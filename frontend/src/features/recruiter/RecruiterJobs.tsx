import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import type { Job } from '@/types';

export default function RecruiterJobs() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Job | null>(null);

  const { data: jobs, isLoading } = useQuery({
    queryKey: ['recruiter-jobs'],
    queryFn: () => api.get('/recruiter/jobs').then((r) => r.data.data as Job[]),
  });

  const saveMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      editing ? api.put(`/recruiter/jobs/${editing._id}`, data) : api.post('/recruiter/jobs', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recruiter-jobs'] });
      setShowForm(false);
      setEditing(null);
      toast.success(editing ? 'Job updated' : 'Job created');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/recruiter/jobs/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['recruiter-jobs'] }); toast.success('Job deleted'); },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    saveMutation.mutate({
      title: fd.get('title'),
      description: fd.get('description'),
      skills: (fd.get('skills') as string).split(',').map((s) => s.trim()).filter(Boolean),
      experienceLevel: fd.get('experienceLevel'),
      status: fd.get('status'),
      companyInfo: { name: fd.get('companyName'), location: fd.get('companyLocation') },
      interviewConfig: {
        aptitudeEnabled: fd.get('aptitudeEnabled') === 'on',
        technicalEnabled: fd.get('technicalEnabled') === 'on',
        aiInterviewEnabled: fd.get('aiInterviewEnabled') === 'on',
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Job Management</h2>
        <Button onClick={() => { setShowForm(true); setEditing(null); }}><Plus className="w-4 h-4" /> New Job</Button>
      </div>

      {showForm && (
        <Card title={editing ? 'Edit Job' : 'Create Job'}>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Title" name="title" defaultValue={editing?.title} required />
            <Input label="Company" name="companyName" defaultValue={editing?.companyInfo?.name} />
            <Input label="Location" name="companyLocation" defaultValue={editing?.companyInfo?.location} />
            <div>
              <label className="block text-sm font-medium mb-1">Experience Level</label>
              <select name="experienceLevel" className="input-field" defaultValue={editing?.experienceLevel || 'mid'}>
                <option value="entry">Entry</option><option value="mid">Mid</option><option value="senior">Senior</option><option value="lead">Lead</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <select name="status" className="input-field" defaultValue={editing?.status || 'draft'}>
                <option value="draft">Draft</option><option value="active">Active</option><option value="closed">Closed</option>
              </select>
            </div>
            <Input label="Skills (comma-separated)" name="skills" defaultValue={editing?.skills?.join(', ')} className="md:col-span-2" />
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea name="description" className="input-field min-h-[120px]" defaultValue={editing?.description} required />
            </div>
            <div className="md:col-span-2 flex flex-wrap gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="aptitudeEnabled" defaultChecked={editing?.interviewConfig?.aptitudeEnabled ?? true} />
                Aptitude Test
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="technicalEnabled" defaultChecked={editing?.interviewConfig?.technicalEnabled ?? true} />
                Technical Test
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="aiInterviewEnabled" defaultChecked={editing?.interviewConfig?.aiInterviewEnabled ?? true} />
                AI Interview
              </label>
            </div>
            <div className="flex gap-2 md:col-span-2">
              <Button type="submit" loading={saveMutation.isPending}>Save</Button>
              <Button type="button" variant="secondary" onClick={() => { setShowForm(false); setEditing(null); }}>Cancel</Button>
            </div>
          </form>
        </Card>
      )}

      <div className="grid gap-4">
        {isLoading ? <div className="animate-pulse h-32 bg-slate-200 rounded-2xl" /> : jobs?.map((job) => (
          <Card key={job._id}>
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold text-lg">{job.title}</h3>
                <p className="text-sm text-slate-500">{job.companyInfo?.name}</p>
                <div className="flex gap-2 mt-2">
                  <Badge status={job.status}>{job.status}</Badge>
                  <Badge>{job.experienceLevel}</Badge>
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="ghost" onClick={() => { setEditing(job); setShowForm(true); }}><Pencil className="w-4 h-4" /></Button>
                <Button size="sm" variant="ghost" onClick={() => deleteMutation.mutate(job._id)}><Trash2 className="w-4 h-4 text-red-500" /></Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
