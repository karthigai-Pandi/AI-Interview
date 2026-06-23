import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mic, MicOff, Send, Volume2, AlertTriangle, Video } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ScoreRing } from '@/components/ui/StatCard';
import type { ConversationMessage, EvaluationResult } from '@/types';

export default function AIInterviewRoom() {
  const { id: applicationId } = useParams();
  const navigate = useNavigate();
  const [interviewId, setInterviewId] = useState('');
  const [conversation, setConversation] = useState<ConversationMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [result, setResult] = useState<EvaluationResult | null>(null);
  const [timeLeft, setTimeLeft] = useState(30 * 60);
  const [antiCheat, setAntiCheat] = useState({ tabSwitches: 0, pasteEvents: 0, fullscreenExits: 0 });
  const [engagement, setEngagement] = useState<number | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current || !applicationId) return;
    startedRef.current = true;

    const startInterview = async () => {
      try {
        const res = await api.post('/interviews/ai/start', { applicationId });
        setInterviewId(res.data.data.interviewId);
        setConversation([{ role: 'interviewer', content: res.data.data.question }]);
        speak(res.data.data.question);
      } catch {
        startedRef.current = false;
        toast.error('Failed to start interview');
      }
    };
    startInterview();
  }, [applicationId]);

  useEffect(() => {
    const timer = setInterval(() => setTimeLeft((t) => Math.max(0, t - 1)), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) {
        setAntiCheat((a) => ({ ...a, tabSwitches: a.tabSwitches + 1 }));
        if (interviewId) {
          api.patch(`/interviews/ai/${interviewId}/anti-cheat`, {
            tabSwitches: antiCheat.tabSwitches + 1,
            pasteEvents: antiCheat.pasteEvents,
            fullscreenExits: antiCheat.fullscreenExits,
          }).catch(() => {});
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [interviewId, antiCheat]);

  useEffect(() => {
    let stream: MediaStream | null = null;
    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch {
        toast.error('Webcam access denied — proctoring limited');
      }
    };
    startCamera();
    return () => stream?.getTracks().forEach((t) => t.stop());
  }, []);

  useEffect(() => {
    if (!interviewId || !videoRef.current) return;
    const interval = setInterval(async () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || video.readyState < 2) return;
      canvas.width = 160;
      canvas.height = 120;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(video, 0, 0, 160, 120);
      const imageBase64 = canvas.toDataURL('image/jpeg', 0.5).split(',')[1];
      try {
        const res = await api.post('/assessments/proctoring/analyze', { image_base64: imageBase64 });
        setEngagement(res.data.data.engagement_score);
      } catch {
        /* optional */
      }
    }, 15000);
    return () => clearInterval(interval);
  }, [interviewId]);

  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      speechSynthesis.speak(utterance);
    }
  };

  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error('Speech recognition not supported. Use text input.');
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onresult = (event) => {
      setInput(event.results[0][0].transcript);
      setIsListening(false);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    setLoading(true);
    const message = input.trim();
    setInput('');
    setConversation((prev) => [...prev, { role: 'candidate', content: message }]);

    try {
      const res = await api.post(`/interviews/ai/${interviewId}/message`, { message });
      const data = res.data.data;
      setConversation(data.conversation);

      if (data.isComplete) {
        setIsComplete(true);
        try {
          const evalRes = await api.post(`/interviews/ai/${interviewId}/complete`);
          setResult(evalRes.data.data.result);
          toast.success('Interview completed!');
        } catch {
          toast.error('Interview ended but evaluation failed. You can return to applications.');
        }
      } else if (data.question) {
        speak(data.question);
      }
    } catch {
      toast.error('Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  if (result) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Card title="Interview Evaluation" className="text-center">
          <div className="flex justify-center mb-6"><ScoreRing score={result.overallScore} /></div>
          <div className="grid grid-cols-2 gap-4 text-left mb-6">
            {Object.entries(result.sectionScores).map(([key, val]) => (
              <div key={key} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                <p className="text-xs text-slate-500 capitalize">{key.replace(/([A-Z])/g, ' $1')}</p>
                <p className="text-lg font-bold">{val}%</p>
              </div>
            ))}
          </div>
          <div className="text-left space-y-4">
            <div><h4 className="font-medium text-green-600">Strengths</h4><ul className="list-disc list-inside text-sm">{result.strengths.map((s, i) => <li key={i}>{s}</li>)}</ul></div>
            <div><h4 className="font-medium text-red-600">Areas to Improve</h4><ul className="list-disc list-inside text-sm">{result.weaknesses.map((w, i) => <li key={i}>{w}</li>)}</ul></div>
            <p className="text-sm italic text-slate-600">{result.recruiterSummary}</p>
          </div>
          <Button className="mt-6" onClick={() => navigate('/candidate/applications')}>Back to Applications</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-3 mb-4 flex items-center gap-2 text-sm text-amber-700 dark:text-amber-300">
        <AlertTriangle className="w-4 h-4 flex-shrink-0" />
        AI scoring is experimental and should not be used as the sole basis for hiring decisions.
      </div>

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">AI HR Interview</h2>
        <div className="flex items-center gap-4">
          {engagement !== null && (
            <span className="text-xs text-slate-500">Engagement: {engagement}%</span>
          )}
          <span className="font-mono">{formatTime(timeLeft)}</span>
        </div>
      </div>

      <canvas ref={canvasRef} className="hidden" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card title="AI Interviewer" className="min-h-[400px]">
          <div className="flex flex-col items-center justify-center h-full">
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="w-32 h-24 rounded-xl object-cover mb-3 border border-slate-200 dark:border-slate-700"
            />
            <p className="text-xs text-slate-500 flex items-center gap-1 mb-4">
              <Video className="w-3 h-3" /> Proctoring active
            </p>
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="w-24 h-24 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mb-4"
            >
              <Volume2 className="w-10 h-10 text-primary-600" />
            </motion.div>
            <p className="text-center text-slate-600 dark:text-slate-400">
              {conversation.filter((c) => c.role === 'interviewer').slice(-1)[0]?.content}
            </p>
          </div>
        </Card>

        <Card title="Your Responses" className="min-h-[400px] flex flex-col">
          <div className="flex-1 overflow-y-auto space-y-3 mb-4 max-h-[300px]">
            {conversation.map((msg, i) => (
              <div key={i} className={`p-3 rounded-xl text-sm ${msg.role === 'interviewer' ? 'bg-slate-100 dark:bg-slate-800' : 'bg-primary-50 dark:bg-primary-900/20 ml-8'}`}>
                <span className="text-xs font-medium capitalize text-slate-500">{msg.role}</span>
                <p className="mt-1">{msg.content}</p>
              </div>
            ))}
          </div>

          {!isComplete && (
            <div className="flex gap-2">
              <input
                className="input-field flex-1"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Type your answer..."
                disabled={loading}
              />
              <Button variant="secondary" onClick={startListening} disabled={isListening}>
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </Button>
              <Button onClick={sendMessage} loading={loading}><Send className="w-4 h-4" /></Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
