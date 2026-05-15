import { useEffect, useState, type FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card } from './ui/card';
import { Award, Mail, Lock } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { supabaseBrowser } from '../lib/supabaseBrowser';

interface LoginPageProps {
  onNavigate: (page: string) => void;
}

export default function LoginPage({ onNavigate }: LoginPageProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('player');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const { signIn, signUp, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const from = (location.state as { from?: string } | null)?.from ?? '/dashboard';

  useEffect(() => {
    if (user && supabaseBrowser) {
      navigate(from, { replace: true });
    }
  }, [user, from, navigate]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!supabaseBrowser) {
      onNavigate('dashboard');
      return;
    }
    setSubmitting(true);
    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          setFormError(
            error.message.includes('Invalid login credentials')
              ? 'Account not found or incorrect password. Try signing up.'
              : error.message,
          );
          return;
        }
        navigate(from, { replace: true });
      } else {
        const { error } = await signUp(email, password, fullName, role);
        if (error) {
          setFormError(error.message);
          return;
        }
        setFormError('Check your email to confirm your account, then sign in.');
        setIsLogin(true);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#022851] via-[#1a2f4a] to-[#022851] flex items-center justify-center p-6">
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center">
        <div className="hidden lg:block text-white">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-[#FFBF00] rounded-xl flex items-center justify-center">
              <Award className="text-[#022851]" size={28} />
            </div>
            <h2 className="text-white text-3xl">UC Davis Water Polo</h2>
          </div>

          <h1 className="text-5xl mb-6 leading-tight">Analytics Platform for Aggie Water Polo</h1>
          <p className="text-xl text-gray-300 mb-8">
            Join the coaching staff using data-driven insights to improve team performance and achieve championship success.
          </p>

          <div className="space-y-4">
            {[
              'Advanced statistical analysis',
              'Real-time performance tracking',
              'Comprehensive player insights',
              'Professional match reports',
            ].map((feature, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="w-6 h-6 bg-[#FFBF00] rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-[#022851]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-gray-300">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        <Card className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-[#FFBF00] rounded-lg flex items-center justify-center">
              <Award className="text-[#022851]" size={24} />
            </div>
            <h3 className="text-[#022851]">UC Davis Water Polo</h3>
          </div>

          <div className="mb-8">
            <h2 className="text-[#022851] mb-2">{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
            <p className="text-gray-600">
              {isLogin
                ? 'Enter your credentials to access your dashboard'
                : 'Sign up to start analyzing your matches'}
            </p>
          </div>

          {!supabaseBrowser && (
            <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
              Supabase Auth is not configured (add <code className="text-xs">VITE_SUPABASE_URL</code> and{' '}
              <code className="text-xs">VITE_SUPABASE_ANON_KEY</code>). You can still open the app for local API
              development.
            </p>
          )}

          {formError && (
            <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3 mb-4">{formError}</p>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {!isLogin && (
              <>
                <div>
                  <Label htmlFor="name" className="text-[#022851]">
                    Full Name
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="John Doe"
                    className="mt-2 border-gray-300"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required={!isLogin}
                  />
                </div>
                <div>
                  <Label htmlFor="role" className="text-[#022851]">
                    I am a…
                  </Label>
                  <select
                    id="role"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm mt-2 outline-none focus:ring-2 focus:ring-[#022851]"
                  >
                    <option value="player">Player / Student</option>
                    <option value="coach">Coach / Educator</option>
                  </select>
                </div>
              </>
            )}

            <div>
              <Label htmlFor="email" className="text-[#022851]">
                Email Address
              </Label>
              <div className="relative mt-2">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  className="pl-10 border-gray-300"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="password" className="text-[#022851]">
                Password
              </Label>
              <div className="relative mt-2">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className="pl-10 border-gray-300"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  autoComplete={isLogin ? 'current-password' : 'new-password'}
                />
              </div>
            </div>

            {isLogin && (
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="rounded border-gray-300" />
                  <span className="text-sm text-gray-600">Remember me</span>
                </label>
                <span className="text-sm text-gray-400">Forgot password — use Supabase dashboard recovery</span>
              </div>
            )}

            <Button
              type="submit"
              disabled={submitting}
              className="w-full bg-[#FFBF00] hover:bg-[#C69214] text-[#022851]"
            >
              {submitting ? 'Please wait…' : isLogin ? 'Sign In' : 'Create Account'}
            </Button>

            {!supabaseBrowser && (
              <Button type="button" variant="outline" className="w-full" onClick={() => onNavigate('dashboard')}>
                Continue without Supabase (local dev)
              </Button>
            )}
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              {isLogin ? "Don't have an account?" : 'Already have an account?'}
              <button type="button" onClick={() => setIsLogin(!isLogin)} className="ml-2 text-[#FFBF00] hover:underline">
                {isLogin ? 'Sign Up' : 'Sign In'}
              </button>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
