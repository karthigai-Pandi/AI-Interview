import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { Card } from '@/components/ui/Card';

export default function VerifyEmailPage() {
  const [params] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    const token = params.get('token');
    if (!token) {
      setStatus('error');
      return;
    }
    api.post('/auth/verify-email', { token })
      .then(() => { setStatus('success'); toast.success('Email verified!'); })
      .catch(() => setStatus('error'));
  }, [params]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md text-center">
        {status === 'loading' && <p>Verifying your email...</p>}
        {status === 'success' && <p className="text-green-600">Email verified successfully! You can now log in.</p>}
        {status === 'error' && <p className="text-red-600">Verification failed. The link may be invalid or expired.</p>}
      </Card>
    </div>
  );
}
