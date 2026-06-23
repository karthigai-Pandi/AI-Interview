import { useQuery } from '@tanstack/react-query';
import { Users, Briefcase, FileText, Star } from 'lucide-react';
import api from '@/lib/api';
import { StatCard } from '@/components/ui/StatCard';
import { Card } from '@/components/ui/Card';
import { CardSkeleton } from '@/components/ui/Skeleton';
import type { DashboardStats } from '@/types';

export default function RecruiterDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['recruiter-stats'],
    queryFn: () => api.get('/dashboard/stats').then((r) => r.data.data as DashboardStats),
  });

  if (isLoading) return <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">{Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)}</div>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Jobs" value={stats?.totalJobs || 0} icon={<Briefcase className="w-6 h-6" />} />
        <StatCard title="Active Jobs" value={stats?.activeJobs || 0} icon={<FileText className="w-6 h-6" />} />
        <StatCard title="Applications" value={stats?.totalApplications || 0} icon={<Users className="w-6 h-6" />} />
        <StatCard title="Shortlisted" value={stats?.shortlisted || 0} icon={<Star className="w-6 h-6" />} />
      </div>
      <Card title="Quick Actions">
        <p className="text-slate-600 dark:text-slate-400">Manage jobs, review candidates, and view analytics from the sidebar.</p>
      </Card>
    </div>
  );
}
