import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Clock, ArrowRight, Calendar } from 'lucide-react';
import api from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatDate, formatDateTime } from '@/lib/utils';
import type { Application, Job } from '@/types';

export default function CandidateApplications() {
  const { data: applications, isLoading } = useQuery({
    queryKey: ['candidate-applications'],
    queryFn: () => api.get('/candidate/applications').then((r) => r.data.data as Application[]),
  });

  if (isLoading) return <div className="animate-pulse h-64 bg-slate-200 dark:bg-slate-700 rounded-2xl" />;

  return (
    <Card title="My Applications" description="Track your application status">
      <div className="space-y-4">
        {applications?.map((app) => {
          const job = app.jobId as Job;
          return (
            <div key={app._id} className="glass-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-semibold text-lg">{job?.title}</h3>
                <p className="text-sm text-slate-500">{job?.companyInfo?.name}</p>
                <div className="flex items-center gap-3 mt-2">
                  <Badge status={app.status}>{app.status}</Badge>
                  <span className="text-xs text-slate-400 flex items-center gap-1"><Clock className="w-3 h-3" />{formatDate(app.appliedAt)}</span>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{app.currentStage}</p>
                {app.scheduledInterviewAt && (
                  <p className="text-sm text-primary-600 dark:text-primary-400 mt-2 flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    Interview: {formatDateTime(app.scheduledInterviewAt)}
                    {app.interviewType && ` (${app.interviewType})`}
                    {app.interviewNotes && ` — ${app.interviewNotes}`}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                {['screening', 'assessment', 'interview'].includes(app.status) && (
                  <>
                    {(!job?.interviewConfig || job.interviewConfig.aptitudeEnabled !== false) && (
                      <Link to={`/candidate/assessment/aptitude?applicationId=${app._id}`}>
                        <Button size="sm" variant="secondary">Aptitude</Button>
                      </Link>
                    )}
                    {(!job?.interviewConfig || job.interviewConfig.technicalEnabled !== false) && (
                      <Link to={`/candidate/assessment/technical?applicationId=${app._id}`}>
                        <Button size="sm" variant="secondary">Technical</Button>
                      </Link>
                    )}
                    {(!job?.interviewConfig || job.interviewConfig.aiInterviewEnabled !== false) && (
                      <Link to={`/candidate/interview/${app._id}`}>
                        <Button size="sm">AI Interview <ArrowRight className="w-4 h-4" /></Button>
                      </Link>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })}
        {(!applications || applications.length === 0) && (
          <p className="text-center text-slate-500 py-8">No applications yet</p>
        )}
      </div>
    </Card>
  );
}
