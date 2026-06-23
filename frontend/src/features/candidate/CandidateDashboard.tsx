import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { FileText, Briefcase, Brain, TrendingUp } from 'lucide-react';
import api from '@/lib/api';
import { StatCard } from '@/components/ui/StatCard';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { CardSkeleton } from '@/components/ui/Skeleton';
import type { DashboardStats, Application } from '@/types';

export default function CandidateDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['candidate-stats'],
    queryFn: () => api.get('/dashboard/stats').then((r) => r.data.data as DashboardStats),
  });

  const { data: applications } = useQuery({
    queryKey: ['candidate-applications'],
    queryFn: () => api.get('/candidate/applications').then((r) => r.data.data as Application[]),
  });

  if (isLoading) return <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">{Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)}</div>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Applications" value={stats?.totalApplications || 0} icon={<FileText className="w-6 h-6" />} />
        <StatCard title="Active" value={stats?.activeApplications || 0} icon={<Briefcase className="w-6 h-6" />} />
        <StatCard title="Interviews Done" value={stats?.completedInterviews || 0} icon={<Brain className="w-6 h-6" />} />
        <StatCard title="Avg Score" value={`${stats?.avgScore || 0}%`} icon={<TrendingUp className="w-6 h-6" />} />
      </div>

      <Card title="Recent Applications">
        <div className="space-y-3">
          {applications?.slice(0, 5).map((app) => {
            const job = typeof app.jobId === 'object' ? app.jobId : null;
            return (
              <div key={app._id} className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <div>
                  <p className="font-medium">{job?.title || 'Job'}</p>
                  <p className="text-sm text-slate-500">{app.currentStage}</p>
                </div>
                <Badge status={app.status}>{app.status}</Badge>
              </div>
            );
          })}
          {(!applications || applications.length === 0) && (
            <p className="text-slate-500 text-center py-4">No applications yet. <Link to="/candidate/jobs" className="text-primary-600">Browse jobs</Link></p>
          )}
        </div>
      </Card>
    </div>
  );
}
