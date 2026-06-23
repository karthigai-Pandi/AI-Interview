import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Download } from 'lucide-react';
import api from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ScoreRing } from '@/components/ui/StatCard';
import { Badge } from '@/components/ui/Badge';

const COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function RecruiterReport() {
  const { id } = useParams();

  const { data, isLoading } = useQuery({
    queryKey: ['recruiter-report', id],
    queryFn: () => api.get(`/recruiter/reports/${id}`).then((r) => r.data.data),
    enabled: !!id,
  });

  if (isLoading) return <div className="animate-pulse h-96 bg-slate-200 dark:bg-slate-700 rounded-2xl" />;
  if (!data) return <p>Report not found</p>;

  const { application, resumeReport, results, interviews } = data;
  const candidate = application.candidateId;
  const result = results?.[0];

  const chartData = result
    ? Object.entries(result.sectionScores).map(([name, value]) => ({ name: name.replace(/([A-Z])/g, ' $1'), score: value }))
    : [];

  const handlePrintReport = () => {
    window.print();
  };

  return (
    <div className="space-y-6 print:space-y-4" id="interview-report">
      <div className="flex justify-end print:hidden">
        <Button variant="secondary" onClick={handlePrintReport}>
          <Download className="w-4 h-4" /> Download / Print PDF
        </Button>
      </div>
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">{candidate?.name}</h2>
            <p className="text-slate-500">{candidate?.email}</p>
          </div>
          <Badge status={application.status}>{application.status}</Badge>
        </div>
      </Card>

      {resumeReport && (
        <Card title="Resume Analysis">
          <div className="flex items-center gap-8">
            <ScoreRing score={resumeReport.data.atsScore} size={100} />
            <div className="flex-1">
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">{resumeReport.data.recruiterSummary}</p>
              <div className="flex flex-wrap gap-2">
                {resumeReport.data.skills?.map((s: string) => (
                  <span key={s} className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 rounded text-xs">{s}</span>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}

      {result && (
        <>
          <Card title="Interview Scores">
            <div className="flex justify-center mb-6"><ScoreRing score={result.overallScore} /></div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Bar dataKey="score" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card title="Strengths">
              <ul className="list-disc list-inside space-y-1 text-sm">{result.strengths.map((s: string, i: number) => <li key={i}>{s}</li>)}</ul>
            </Card>
            <Card title="Weaknesses">
              <ul className="list-disc list-inside space-y-1 text-sm">{result.weaknesses.map((w: string, i: number) => <li key={i}>{w}</li>)}</ul>
            </Card>
          </div>

          <Card title="Recruiter Summary">
            <p className="text-slate-600 dark:text-slate-400">{result.recruiterSummary}</p>
          </Card>
        </>
      )}

      {interviews?.length > 0 && (
        <Card title="Interview History">
          {interviews.map((interview: { _id: string; type: string; status: string; score?: number }) => (
            <div key={interview._id} className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
              <span className="capitalize">{interview.type.replace('_', ' ')}</span>
              <span>{interview.status} {interview.score !== undefined && `· ${interview.score}%`}</span>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}

export function RecruiterAnalytics() {
  const { data, isLoading } = useQuery({
    queryKey: ['recruiter-analytics'],
    queryFn: () => api.get('/recruiter/analytics').then((r) => r.data.data),
  });

  if (isLoading) return <div className="animate-pulse h-96 bg-slate-200 rounded-2xl" />;

  const pieData = Object.entries(data?.statusCounts || {}).map(([name, value]) => ({ name, value }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title="Application Status Distribution">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>
        <Card title="Overview">
          <div className="space-y-4 text-lg">
            <p>Total Jobs: <strong>{data?.totalJobs}</strong></p>
            <p>Active Jobs: <strong>{data?.activeJobs}</strong></p>
            <p>Total Applications: <strong>{data?.totalApplications}</strong></p>
            <p>Average Score: <strong>{data?.avgScore}%</strong></p>
          </div>
        </Card>
      </div>
    </div>
  );
}
