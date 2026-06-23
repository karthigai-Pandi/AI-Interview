import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import type { AssessmentQuestion } from '@/types';

export default function TechnicalTest() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const applicationId = params.get('applicationId') || '';

  const [sessionId, setSessionId] = useState('');
  const [questions, setQuestions] = useState<AssessmentQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, { answer?: string; code?: string }>>({});
  const [output, setOutput] = useState('');
  const [timeLeft, setTimeLeft] = useState(0);
  const [started, setStarted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [running, setRunning] = useState(false);
  const [antiCheat, setAntiCheat] = useState({ tabSwitches: 0, pasteEvents: 0, fullscreenExits: 0 });

  const startTest = async () => {
    if (!applicationId) {
      toast.error('Missing application. Go back to Applications and try again.');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/assessments/technical/start', { applicationId, difficulty: 'medium' });
      const qs = (res.data.data.questions || []).map((q: AssessmentQuestion) => ({
        ...q,
        id: String(q.id),
      }));
      if (qs.length === 0) {
        toast.error('No questions available. Please try again.');
        return;
      }
      setSessionId(res.data.data.sessionId);
      setQuestions(qs);
      setTimeLeft((res.data.data.timeLimitMinutes || 60) * 60);
      setStarted(true);
      document.documentElement.requestFullscreen?.().catch(() => {});
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || 'Failed to start test');
    } finally {
      setLoading(false);
    }
  };

  const current = questions[currentIndex];
  const isCoding = current?.type === 'coding' || current?.type === 'sql' || current?.type === 'debugging';

  const runCode = async () => {
    if (!current) return;
    setRunning(true);
    try {
      const code = answers[current.id]?.code || current.starterCode || '';
      const res = await api.post(`/assessments/technical/${sessionId}/run-code`, {
        language: current.language || 'python',
        code,
      });
      setOutput(res.data.data.run?.stdout || res.data.data.run?.stderr || 'No output');
    } catch {
      toast.error('Code execution failed');
    } finally {
      setRunning(false);
    }
  };

  const submitTest = useCallback(async () => {
    try {
      const answerList = questions.map((q) => ({
        questionId: q.id,
        answer: answers[q.id]?.answer,
        code: answers[q.id]?.code,
        timeSpent: 60,
      }));
      const res = await api.post(`/assessments/technical/${sessionId}/submit`, {
        answers: answerList,
        antiCheatFlags: antiCheat,
      });
      toast.success(`Test completed! Score: ${res.data.data.score}%`);
      navigate('/candidate/applications');
    } catch {
      toast.error('Submit failed');
    }
  }, [questions, answers, sessionId, antiCheat, navigate]);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) setAntiCheat((a) => ({ ...a, tabSwitches: a.tabSwitches + 1 }));
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  useEffect(() => {
    if (!started || timeLeft <= 0) return;
    const timer = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(timer);
  }, [started, timeLeft]);

  useEffect(() => {
    if (started && timeLeft === 0 && questions.length > 0) submitTest();
  }, [timeLeft, started, questions.length, submitTest]);

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  if (!started) {
    return (
      <Card title="Technical Assessment" className="max-w-lg mx-auto text-center">
        <p className="text-slate-600 dark:text-slate-400 mb-6">MCQ + Coding challenges · 60 minutes</p>
        {!applicationId && (
          <p className="text-sm text-red-500 mb-4">No application selected. Open this test from My Applications.</p>
        )}
        <Button onClick={startTest} loading={loading} className="w-full" disabled={!applicationId}>Start Assessment</Button>
      </Card>
    );
  }

  if (!current) {
    return (
      <Card title="Technical Assessment" className="max-w-lg mx-auto text-center">
        <p className="text-slate-500 mb-4">Loading questions...</p>
        <Button variant="secondary" onClick={() => navigate('/candidate/applications')}>Back to Applications</Button>
      </Card>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <span className="text-sm">Question {currentIndex + 1}/{questions.length} · {current?.type}</span>
        <span className="font-mono font-bold">{formatTime(timeLeft)}</span>
      </div>

      <Card>
        <h3 className="text-lg font-medium mb-4">{current?.question}</h3>

        {!isCoding ? (
          <div className="space-y-3">
            {current?.options?.map((opt) => (
              <button
                key={opt}
                onClick={() => setAnswers({ ...answers, [current.id]: { answer: opt } })}
                className={`w-full text-left p-4 rounded-xl border ${
                  answers[current.id]?.answer === opt ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-slate-200 dark:border-slate-700'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        ) : (
          <div>
            <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 mb-4">
              <Editor
                height="300px"
                language={current.language === 'cpp' ? 'cpp' : current.language || 'python'}
                value={answers[current.id]?.code || current.starterCode || ''}
                onChange={(v) => setAnswers({ ...answers, [current.id]: { ...answers[current.id], code: v || '' } })}
                theme="vs-dark"
                options={{ minimap: { enabled: false }, fontSize: 14, paste: 'never' }}
              />
            </div>
            <div className="flex gap-2 mb-4">
              <Button variant="secondary" onClick={runCode} loading={running}>Run Code</Button>
            </div>
            {output && (
              <pre className="bg-slate-900 text-green-400 p-4 rounded-xl text-sm overflow-auto max-h-40">{output}</pre>
            )}
          </div>
        )}
      </Card>

      <div className="flex justify-between mt-6">
        <Button variant="secondary" disabled={currentIndex === 0} onClick={() => setCurrentIndex(currentIndex - 1)}>Previous</Button>
        {currentIndex < questions.length - 1 ? (
          <Button onClick={() => { setCurrentIndex(currentIndex + 1); setOutput(''); }}>Next</Button>
        ) : (
          <Button onClick={submitTest}>Submit</Button>
        )}
      </div>
    </div>
  );
}
