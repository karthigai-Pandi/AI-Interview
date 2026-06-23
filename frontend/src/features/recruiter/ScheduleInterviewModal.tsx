import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface Props {
  applicationId: string;
  candidateName: string;
  onClose: () => void;
}

export function ScheduleInterviewModal({ applicationId, candidateName, onClose }: Props) {
  const queryClient = useQueryClient();
  const [scheduledAt, setScheduledAt] = useState('');
  const [interviewType, setInterviewType] = useState<'phone' | 'video' | 'onsite' | 'ai'>('video');
  const [notes, setNotes] = useState('');

  const scheduleMutation = useMutation({
    mutationFn: () =>
      api.patch(`/recruiter/applications/${applicationId}/schedule`, {
        scheduledInterviewAt: new Date(scheduledAt).toISOString(),
        interviewType,
        interviewNotes: notes || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recruiter-candidates'] });
      toast.success('Interview scheduled');
      onClose();
    },
    onError: () => toast.error('Failed to schedule interview'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduledAt) {
      toast.error('Please select date and time');
      return;
    }
    scheduleMutation.mutate();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="glass-card w-full max-w-md p-6">
        <h3 className="text-lg font-semibold mb-1">Schedule Interview</h3>
        <p className="text-sm text-slate-500 mb-4">with {candidateName}</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Date & Time</label>
            <input
              type="datetime-local"
              className="input-field"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Interview Type</label>
            <select
              className="input-field"
              value={interviewType}
              onChange={(e) => setInterviewType(e.target.value as typeof interviewType)}
            >
              <option value="phone">Phone</option>
              <option value="video">Video</option>
              <option value="onsite">On-site</option>
              <option value="ai">AI Interview</option>
            </select>
          </div>
          <Input
            label="Notes (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Meeting link, location, etc."
          />
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={scheduleMutation.isPending}>
              Schedule
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
