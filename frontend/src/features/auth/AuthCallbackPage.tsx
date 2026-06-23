import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore, redirectAfterAuth } from '@/stores/authStore';

export default function AuthCallbackPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const setToken = useAuthStore((s) => s.setToken);

  useEffect(() => {
    const token = params.get('token');
    if (token) {
      setToken(token);
      fetch(`${import.meta.env.VITE_API_URL || '/api/v1'}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include',
      })
        .then((r) => r.json())
        .then((data) => {
          if (data.success) {
            setAuth(data.data.user, token);
            redirectAfterAuth(data.data.user.role);
          } else {
            navigate('/login');
          }
        })
        .catch(() => navigate('/login'));
    } else {
      navigate('/login');
    }
  }, [params, navigate, setAuth, setToken]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full" />
    </div>
  );
}
