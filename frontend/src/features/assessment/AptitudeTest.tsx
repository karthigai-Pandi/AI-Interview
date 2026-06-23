import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import type { AssessmentQuestion } from '@/types';

export default function AptitudeTest() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const applicationId = params.get('applicationId') || '';

  const [sessionId, setSessionId] = useState('');
  const [questions, setQuestions] = useState<AssessmentQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [started, setStarted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [antiCheat, setAntiCheat] = useState({ tabSwitches: 0, pasteEvents: 0, fullscreenExits: 0 });

  const startTest = async () => {
    if (!applicationId) {
      toast.error('Missing application. Go back to Applications and try again.');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/assessments/aptitude/start', {
        applicationId,
        category: 'aptitude',
        difficulty: 'medium',
        questionCount: 10,
      });
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
      setTimeLeft((res.data.data.timeLimitMinutes || 20) * 60);
      setStarted(true);
      document.documentElement.requestFullscreen?.().catch(() => {});
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || 'Failed to start test');
    } finally {
      setLoading(false);
    }
  };

  const submitTest = useCallback(async () => {
    try {
      const answerList = questions.map((q) => ({
        questionId: q.id,
        answer: answers[q.id] || '',
        timeSpent: 30,
      }));
      const res = await api.post(`/assessments/aptitude/${sessionId}/submit`, {
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
    if (!started || timeLeft <= 0) return;
    const timer = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(timer);
  }, [started, timeLeft]);

  useEffect(() => {
    if (started && timeLeft === 0 && questions.length > 0) submitTest();
  }, [timeLeft, started, questions.length, submitTest]);

  useEffect(() => {
    const handleVisibility = () => { if (document.hidden) setAntiCheat((a) => ({ ...a, tabSwitches: a.tabSwitches + 1 })); };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
  const current = questions[currentIndex];

  if (!started) {
    return (
      <Card title="Aptitude Test" className="max-w-lg mx-auto text-center">
        <p className="text-slate-600 dark:text-slate-400 mb-6">10 questions · 20 minutes · Multiple choice</p>
        <p className="text-sm text-amber-600 mb-4">Fullscreen mode will be enabled. Tab switching is monitored.</p>
        {!applicationId && (
          <p className="text-sm text-red-500 mb-4">No application selected. Open this test from My Applications.</p>
        )}
        <Button onClick={startTest} loading={loading} className="w-full" disabled={!applicationId}>Start Test</Button>
      </Card>
    );
  }

  if (!current) {
    return (
      <Card title="Aptitude Test" className="max-w-lg mx-auto text-center">
        <p className="text-slate-500 mb-4">Loading questions...</p>
        <Button variant="secondary" onClick={() => navigate('/candidate/applications')}>Back to Applications</Button>
      </Card>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <span className="text-sm text-slate-500">Question {currentIndex + 1} of {questions.length}</span>
        <span className={`font-mono text-lg font-bold ${timeLeft < 60 ? 'text-red-500' : ''}`}>{formatTime(timeLeft)}</span>
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={currentIndex} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
          <Card>
            <h3 className="text-lg font-medium mb-6">{current?.question}</h3>
            <div className="space-y-3">
              {current?.options?.map((opt) => (
                <button
                  key={opt}
                  onClick={() => setAnswers({ ...answers, [current.id]: opt })}
                  className={`w-full text-left p-4 rounded-xl border transition-all ${
                    answers[current.id] === opt
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-slate-200 dark:border-slate-700 hover:border-primary-300'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </Card>
        </motion.div>
      </AnimatePresence>

      <div className="flex justify-between mt-6">
        <Button variant="secondary" disabled={currentIndex === 0} onClick={() => setCurrentIndex(currentIndex - 1)}>Previous</Button>
        {currentIndex < questions.length - 1 ? (
          <Button onClick={() => setCurrentIndex(currentIndex + 1)}>Next</Button>
        ) : (
          <Button onClick={submitTest}>Submit Test</Button>
        )}
      </div>
    </div>
  );
}
