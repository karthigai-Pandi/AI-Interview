import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { StatCard } from '@/components/ui/StatCard';
import { Users, Briefcase, FileText, HelpCircle } from 'lucide-react';
import type { DashboardStats } from '@/types';

export default function AdminDashboard() {
  const { data: stats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => api.get('/dashboard/stats').then((r) => r.data.data as DashboardStats),
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard title="Users" value={stats?.users || 0} icon={<Users className="w-6 h-6" />} />
      <StatCard title="Jobs" value={stats?.jobs || 0} icon={<Briefcase className="w-6 h-6" />} />
      <StatCard title="Applications" value={stats?.applications || 0} icon={<FileText className="w-6 h-6" />} />
      <StatCard title="Questions" value={stats?.questions || 0} icon={<HelpCircle className="w-6 h-6" />} />
    </div>
  );
}

export function AdminUsers() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');

  const { data: users, isLoading } = useQuery({
    queryKey: ['admin-users', search],
    queryFn: () => api.get('/admin/users', { params: { search } }).then((r) => r.data.data),
  });

  const updateRole = useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) => api.patch(`/admin/users/${id}/role`, { role }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-users'] }); toast.success('Role updated'); },
  });

  return (
    <Card title="User Management">
      <Input className="mb-4" placeholder="Search users..." value={search} onChange={(e) => setSearch(e.target.value)} />
      {isLoading ? <div className="animate-pulse h-48 bg-slate-200 rounded-xl" /> : (
        <table className="w-full">
          <thead>
            <tr className="border-b"><th className="text-left py-2">Name</th><th className="text-left py-2">Email</th><th className="text-left py-2">Role</th><th className="text-right py-2">Actions</th></tr>
          </thead>
          <tbody>
            {users?.map((user: { _id: string; name: string; email: string; role: string }) => (
              <tr key={user._id} className="border-b border-slate-100 dark:border-slate-800">
                <td className="py-3">{user.name}</td>
                <td className="py-3 text-sm text-slate-500">{user.email}</td>
                <td className="py-3"><Badge>{user.role}</Badge></td>
                <td className="py-3 text-right">
                  <select
                    className="input-field w-32 text-sm"
                    value={user.role}
                    onChange={(e) => updateRole.mutate({ id: user._id, role: e.target.value })}
                  >
                    <option value="candidate">Candidate</option>
                    <option value="recruiter">Recruiter</option>
                    <option value="admin">Admin</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Card>
  );
}

export function AdminQuestions() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<{
    _id: string;
    type: string;
    category?: string;
    difficulty: string;
    question: string;
    options?: string[];
    correctAnswer?: string;
    language?: string;
  } | null>(null);

  const { data: questions, isLoading } = useQuery({
    queryKey: ['admin-questions'],
    queryFn: () => api.get('/admin/questions').then((r) => r.data.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => api.post('/admin/questions', data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-questions'] }); setShowForm(false); setEditing(null); toast.success('Question created'); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => api.put(`/admin/questions/${id}`, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-questions'] }); setShowForm(false); setEditing(null); toast.success('Question updated'); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/questions/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-questions'] }); toast.success('Deleted'); },
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <h2 className="text-xl font-semibold">Question Bank</h2>
        <Button onClick={() => { setShowForm(true); setEditing(null); }}>Add Question</Button>
      </div>

      {showForm && (
        <Card title={editing ? 'Edit Question' : 'New Question'}>
          <form onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            const payload = {
              type: fd.get('type'),
              category: fd.get('category') || undefined,
              difficulty: fd.get('difficulty'),
              question: fd.get('question'),
              options: (fd.get('options') as string)?.split('|').filter(Boolean),
              correctAnswer: fd.get('correctAnswer'),
              language: fd.get('language') || undefined,
            };
            if (editing) updateMutation.mutate({ id: editing._id, data: payload });
            else createMutation.mutate(payload);
          }} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-sm font-medium">Type</label><select name="type" className="input-field" defaultValue={editing?.type || 'aptitude'}><option value="aptitude">Aptitude</option><option value="mcq">MCQ</option><option value="coding">Coding</option><option value="sql">SQL</option></select></div>
              <div><label className="text-sm font-medium">Difficulty</label><select name="difficulty" className="input-field" defaultValue={editing?.difficulty || 'easy'}><option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option></select></div>
            </div>
            <Input label="Question" name="question" required defaultValue={editing?.question} />
            <Input label="Options (pipe-separated)" name="options" placeholder="A|B|C|D" defaultValue={editing?.options?.join('|')} />
            <Input label="Correct Answer" name="correctAnswer" defaultValue={editing?.correctAnswer} />
            <Input label="Language (for coding)" name="language" defaultValue={editing?.language} />
            <div className="flex gap-2">
              <Button type="submit" loading={createMutation.isPending || updateMutation.isPending}>{editing ? 'Update' : 'Create'}</Button>
              <Button type="button" variant="secondary" onClick={() => { setShowForm(false); setEditing(null); }}>Cancel</Button>
            </div>
          </form>
        </Card>
      )}

      <Card>
        {isLoading ? <div className="animate-pulse h-48 bg-slate-200 rounded-xl" /> : (
          <div className="space-y-3">
            {questions?.map((q: { _id: string; type: string; question: string; difficulty: string; options?: string[]; correctAnswer?: string; language?: string }) => (
              <div key={q._id} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                <div>
                  <Badge>{q.type}</Badge> <Badge>{q.difficulty}</Badge>
                  <p className="mt-1 text-sm">{q.question}</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="secondary" onClick={() => { setEditing(q); setShowForm(true); }}>Edit</Button>
                  <Button size="sm" variant="danger" onClick={() => deleteMutation.mutate(q._id)}>Delete</Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

export function AdminAIConfig() {
  const queryClient = useQueryClient();

  const { data: config, isLoading } = useQuery({
    queryKey: ['admin-ai-config'],
    queryFn: () => api.get('/admin/ai-config').then((r) => r.data.data),
  });

  const updateMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => api.patch('/admin/ai-config', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-ai-config'] });
      toast.success('AI configuration saved');
    },
  });

  if (isLoading) return <div className="animate-pulse h-48 bg-slate-200 rounded-xl" />;

  return (
    <Card title="AI & Proctoring Configuration">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          updateMutation.mutate({
            aiModel: fd.get('aiModel'),
            aiTemperature: parseFloat(fd.get('aiTemperature') as string),
            maxInterviewQuestions: parseInt(fd.get('maxInterviewQuestions') as string, 10),
            proctoringEnabled: fd.get('proctoringEnabled') === 'on',
            faceAnalysisEnabled: fd.get('faceAnalysisEnabled') === 'on',
          });
        }}
        className="space-y-4 max-w-lg"
      >
        <Input label="AI Model" name="aiModel" defaultValue={config?.aiModel} />
        <Input label="Temperature (0-2)" name="aiTemperature" type="number" step="0.1" defaultValue={config?.aiTemperature} />
        <Input label="Max Interview Questions" name="maxInterviewQuestions" type="number" defaultValue={config?.maxInterviewQuestions} />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="proctoringEnabled" defaultChecked={config?.proctoringEnabled} />
          Enable proctoring (tab switch detection)
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="faceAnalysisEnabled" defaultChecked={config?.faceAnalysisEnabled} />
          Enable webcam face analysis
        </label>
        <Button type="submit" loading={updateMutation.isPending}>Save Configuration</Button>
      </form>
    </Card>
  );
}
