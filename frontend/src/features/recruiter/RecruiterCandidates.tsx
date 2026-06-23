import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Search, CheckCircle, XCircle, Calendar, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { ScheduleInterviewModal } from './ScheduleInterviewModal';
import { formatDateTime } from '@/lib/utils';
import type { Application } from '@/types';

export default function RecruiterCandidates() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [scheduleTarget, setScheduleTarget] = useState<{ id: string; name: string } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['recruiter-candidates', search, statusFilter],
    queryFn: () =>
      api
        .get('/recruiter/candidates', { params: { search, status: statusFilter || undefined } })
        .then((r) => r.data.data as Application[]),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.patch(`/recruiter/applications/${id}/status`, {
        status,
        currentStage: status === 'shortlisted' ? 'Shortlisted' : status === 'rejected' ? 'Not Selected' : undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recruiter-candidates'] });
      toast.success('Status updated');
    },
  });

  const handleExportCsv = async () => {
    try {
      const res = await api.get('/recruiter/candidates/export', {
        params: { status: statusFilter || undefined },
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = 'candidates.csv';
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('CSV exported');
    } catch {
      toast.error('Export failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
          <Input className="pl-10" placeholder="Search candidates..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="input-field w-full sm:w-48" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All Status</option>
          <option value="applied">Applied</option>
          <option value="screening">Screening</option>
          <option value="assessment">Assessment</option>
          <option value="interview">Interview</option>
          <option value="shortlisted">Shortlisted</option>
          <option value="rejected">Rejected</option>
        </select>
        <Button variant="secondary" onClick={handleExportCsv}>
          <Download className="w-4 h-4" /> Export CSV
        </Button>
      </div>

      <Card>
        {isLoading ? (
          <div className="animate-pulse h-48 bg-slate-200 dark:bg-slate-700 rounded-xl" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">Candidate</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">Job</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">Scheduled</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-slate-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data?.map((app) => {
                  const candidate = app.candidateId as unknown as { name: string; email: string };
                  const job = app.jobId as unknown as { title: string };
                  return (
                    <tr key={app._id} className="border-b border-slate-100 dark:border-slate-800">
                      <td className="py-3 px-4">
                        <p className="font-medium">{candidate?.name}</p>
                        <p className="text-xs text-slate-500">{candidate?.email}</p>
                      </td>
                      <td className="py-3 px-4 text-sm">{job?.title}</td>
                      <td className="py-3 px-4">
                        <Badge status={app.status}>{app.status}</Badge>
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-500">
                        {app.scheduledInterviewAt ? (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDateTime(app.scheduledInterviewAt)}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => setScheduleTarget({ id: app._id, name: candidate?.name })}
                          >
                            <Calendar className="w-4 h-4" />
                          </Button>
                          <Link to={`/recruiter/reports/${app._id}`}>
                            <Button size="sm" variant="secondary">Report</Button>
                          </Link>
                          <Button size="sm" variant="ghost" onClick={() => updateMutation.mutate({ id: app._id, status: 'shortlisted' })}>
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => updateMutation.mutate({ id: app._id, status: 'rejected' })}>
                            <XCircle className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {(!data || data.length === 0) && <p className="text-center text-slate-500 py-8">No candidates found</p>}
          </div>
        )}
      </Card>

      {scheduleTarget && (
        <ScheduleInterviewModal
          applicationId={scheduleTarget.id}
          candidateName={scheduleTarget.name}
          onClose={() => setScheduleTarget(null)}
        />
      )}
    </div>
  );
}
