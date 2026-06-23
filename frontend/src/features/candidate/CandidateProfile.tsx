import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Upload, Sparkles, Plus, X } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ScoreRing } from '@/components/ui/StatCard';
import { CardSkeleton } from '@/components/ui/Skeleton';
import type { ResumeReport } from '@/types';

export default function CandidateProfile() {
  const queryClient = useQueryClient();
  const [skills, setSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [report, setReport] = useState<ResumeReport | null>(null);

  const { data: profile, isLoading } = useQuery({
    queryKey: ['candidate-profile'],
    queryFn: () => api.get('/candidate/profile').then((r) => r.data.data),
  });

  const updateMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => api.put('/candidate/profile', data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['candidate-profile'] }); toast.success('Profile updated'); },
  });

  const uploadMutation = useMutation({
    mutationFn: (file: File) => {
      const formData = new FormData();
      formData.append('resume', file);
      return api.post('/candidate/resume', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['candidate-profile'] }); toast.success('Resume uploaded'); },
    onError: () => toast.error('Upload failed'),
  });

  const handleAnalyze = async () => {
    setAnalyzing(true);
    try {
      const res = await api.post('/ai/resume/analyze', {});
      setReport(res.data.data.report);
      toast.success('Resume analyzed!');
    } catch {
      toast.error('Analysis failed');
    } finally {
      setAnalyzing(false);
    }
  };

  if (isLoading) return <CardSkeleton />;

  const p = profile?.profile || {};

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card title="Personal Information">
        <form onSubmit={(e) => {
          e.preventDefault();
          const form = e.target as HTMLFormElement;
          const fd = new FormData(form);
          updateMutation.mutate({
            name: fd.get('name'),
            phone: fd.get('phone'),
            location: fd.get('location'),
            bio: fd.get('bio'),
            skills: [...(p.skills || []), ...skills],
            githubUrl: fd.get('githubUrl'),
            linkedinUrl: fd.get('linkedinUrl'),
          });
        }} className="space-y-4">
          <Input label="Name" name="name" defaultValue={profile?.name} />
          <Input label="Phone" name="phone" defaultValue={p.phone} />
          <Input label="Location" name="location" defaultValue={p.location} />
          <div>
            <label className="block text-sm font-medium mb-1">Bio</label>
            <textarea name="bio" className="input-field min-h-[100px]" defaultValue={p.bio} />
          </div>
          <Input label="GitHub URL" name="githubUrl" defaultValue={p.githubUrl} />
          <Input label="LinkedIn URL" name="linkedinUrl" defaultValue={p.linkedinUrl} />
          <div>
            <label className="block text-sm font-medium mb-2">Skills</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {(p.skills || []).map((s: string) => (
                <span key={s} className="px-3 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full text-sm">{s}</span>
              ))}
            </div>
            <div className="flex gap-2">
              <Input value={newSkill} onChange={(e) => setNewSkill(e.target.value)} placeholder="Add skill" />
              <Button type="button" variant="secondary" onClick={() => { if (newSkill) { setSkills([...skills, newSkill]); setNewSkill(''); } }}><Plus className="w-4 h-4" /></Button>
            </div>
          </div>
          <Button type="submit" loading={updateMutation.isPending}>Save Profile</Button>
        </form>
      </Card>

      <div className="space-y-6">
        <Card title="Resume Upload">
          <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl p-8 text-center">
            <Upload className="w-12 h-12 mx-auto text-slate-400 mb-4" />
            <p className="text-sm text-slate-500 mb-4">PDF or DOCX, max 5MB</p>
            <input type="file" accept=".pdf,.docx,.doc" className="hidden" id="resume-upload" onChange={(e) => e.target.files?.[0] && uploadMutation.mutate(e.target.files[0])} />
            <label htmlFor="resume-upload" className="btn-secondary inline-block cursor-pointer px-4 py-2.5 rounded-xl">Choose File</label>
            {p.resumeUrl && <p className="text-sm text-green-600 mt-4">Resume uploaded successfully</p>}
          </div>
          <Button className="w-full mt-4" onClick={handleAnalyze} loading={analyzing}>
            <Sparkles className="w-4 h-4" /> Analyze Resume with AI
          </Button>
        </Card>

        {report && (
          <Card title="AI Resume Analysis">
            <div className="flex justify-center mb-6">
              <ScoreRing score={report.data.atsScore} />
            </div>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Skills Identified</h4>
                <div className="flex flex-wrap gap-2">
                  {report.data.skills.map((s) => <span key={s} className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded text-sm">{s}</span>)}
                </div>
              </div>
              {report.data.missingSkills.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Missing Skills</h4>
                  <div className="flex flex-wrap gap-2">
                    {report.data.missingSkills.map((s) => <span key={s} className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded text-sm">{s}</span>)}
                  </div>
                </div>
              )}
              <div>
                <h4 className="font-medium mb-2">Improvements</h4>
                <ul className="list-disc list-inside text-sm text-slate-600 dark:text-slate-400 space-y-1">
                  {report.data.improvements.map((imp, i) => <li key={i}>{imp}</li>)}
                </ul>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 italic">{report.data.recruiterSummary}</p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
