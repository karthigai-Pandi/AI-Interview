import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import type { Job } from '@/types';

export default function CandidateJobs() {
  const queryClient = useQueryClient();

  const { data: jobs, isLoading } = useQuery({
    queryKey: ['candidate-jobs'],
    queryFn: () => api.get('/candidate/jobs').then((r) => r.data.data as Job[]),
  });

  const applyMutation = useMutation({
    mutationFn: (jobId: string) => api.post('/candidate/apply', { jobId }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['candidate-jobs'] }); toast.success('Application submitted!'); },
    onError: (err: unknown) => {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Application failed');
    },
  });

  if (isLoading) return <div className="animate-pulse h-64 bg-slate-200 dark:bg-slate-700 rounded-2xl" />;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {jobs?.map((job) => (
        <Card key={job._id}>
          <div className="flex justify-between items-start mb-3">
            <div>
              <h3 className="font-semibold text-lg">{job.title}</h3>
              <p className="text-sm text-slate-500">{job.companyInfo?.name} · {job.companyInfo?.location}</p>
            </div>
            <Badge status={job.status}>{job.experienceLevel}</Badge>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-3 mb-4">{job.description}</p>
          <div className="flex flex-wrap gap-2 mb-4">
            {job.skills.slice(0, 5).map((s) => (
              <span key={s} className="px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded text-xs">{s}</span>
            ))}
          </div>
          <Button
            className="w-full"
            variant={job.hasApplied ? 'secondary' : 'primary'}
            disabled={job.hasApplied || applyMutation.isPending}
            onClick={() => applyMutation.mutate(job._id)}
          >
            {job.hasApplied ? 'Applied' : 'Apply Now'}
          </Button>
        </Card>
      ))}
    </div>
  );
}
