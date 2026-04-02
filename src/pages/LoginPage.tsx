import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import api from '../api/client';
import { useAuthStore } from '../store/auth';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { user, setAuth } = useAuthStore();
  const navigate = useNavigate();

  if (user) return <Navigate to="/" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data } = await api.post('/api/v1/auth/login', { email, password });
      const token = data.access_token;
      
      // Store token early so follow-up request works
      localStorage.setItem('auth_token', token);

      // Fetch user profile info (Roles, Username, etc)
      const userRes = await api.get('/api/v1/users/me');
      const raw = userRes.data;
      
      const userData = {
        id: raw.id || raw.ID,
        username: raw.username || raw.Username,
        email: raw.email || raw.Email,
        roles: (raw.roles || raw.Roles || []).map((r: any) => typeof r === 'string' ? r : r.name || r.Name),
        permissions: raw.permissions || raw.Permissions || []
      };

      setAuth(userData as any, token);
      
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[url('/grid.svg')] bg-center bg-no-repeat">
      <Card className="w-full max-w-md p-10 overflow-visible relative group">
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-24 h-24 bg-gradient-primary rounded-3xl rotate-12 flex items-center justify-center shadow-glow group-hover:rotate-0 transition-all duration-500 ring-4 ring-bg">
           <span className="text-4xl font-black text-white tracking-tighter -rotate-12 group-hover:rotate-0 transition-transform">M</span>
        </div>

        <div className="text-center mt-6 mb-10">
          <h1 className="text-3xl font-black tracking-tightest mb-2">Welcome Back</h1>
          <p className="text-text-subtle font-medium">Access the Magnet Control Center</p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-danger/10 border border-danger/30 text-danger text-sm font-bold text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <Input label="Email Address" type="email" placeholder="admin@magnet.ai" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <Input label="Password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
          <Button className="w-full h-14" size="lg" isLoading={loading}>Authenticate →</Button>
        </form>

        <p className="mt-8 text-center text-xs text-text-subtle font-medium">
          Authorised Personnel Only. Access is monitored.
        </p>
      </Card>
    </div>
  );
};
