import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, ArrowRight } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, isLoading } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
      toast.success('Welcome back!');
      navigate('/');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen bg-[#faf8f5] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-8 h-8 rounded-full border-2 border-[#6b7c5e] flex items-center justify-center">
              <div className="w-3 h-3 rounded-full bg-[#6b7c5e]" />
            </div>
            <span className="font-serif text-lg font-semibold text-[#1a1a1a]">Campus Loop</span>
          </Link>
          <h1 className="font-serif text-2xl font-semibold text-[#1a1a1a] mb-2">Welcome back</h1>
          <p className="text-sm text-[#8a8a8a]">Sign in to your Campus Loop account</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white border border-[#e8e4de] rounded-2xl p-6 space-y-4">
          <div>
            <label className="text-sm font-medium text-[#1a1a1a] block mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="you@student.in"
              className="w-full px-4 py-2.5 border border-[#e8e4de] rounded-lg text-sm focus:outline-none focus:border-[#6b7c5e] bg-[#faf8f5]"
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-medium text-[#1a1a1a]">Password</label>
              <Link to="/forgot-password" className="text-xs text-[#6b7c5e] hover:underline">Forgot password?</Link>
            </div>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full px-4 py-2.5 pr-11 border border-[#e8e4de] rounded-lg text-sm focus:outline-none focus:border-[#6b7c5e] bg-[#faf8f5]"
              />
              <button type="button" onClick={() => setShowPass(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8a8a8a] hover:text-[#1a1a1a]">
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 py-3 bg-[#6b7c5e] text-white font-medium rounded-xl hover:bg-[#4a5c40] transition-colors disabled:opacity-70"
          >
            {isLoading ? 'Signing in...' : (
              <>Sign In <ArrowRight className="w-4 h-4" /></>
            )}
          </button>
        </form>

        <div className="mt-4 p-4 bg-[#f3f0eb] border border-[#e8e4de] rounded-xl">
          <p className="text-xs text-[#8a8a8a] text-center mb-2">Demo accounts:</p>
          <div className="space-y-1">
            {[
              { email: 'aryan@student.in', label: 'Aryan (Seller)' },
              { email: 'admin@campusloop.in', label: 'Admin User' },
            ].map(d => (
              <button
                key={d.email}
                onClick={() => { setEmail(d.email); setPassword('pass123'); }}
                className="w-full text-left text-xs text-[#5c5c5c] hover:text-[#1a1a1a] px-2 py-1 rounded hover:bg-[#e8e4de] transition-colors"
              >
                {d.label} — {d.email}
              </button>
            ))}
          </div>
          <p className="text-xs text-[#8a8a8a] mt-1 text-center">Password: pass123 / admin123</p>
        </div>

        <p className="text-center text-sm text-[#8a8a8a] mt-6">
          Don't have an account?{' '}
          <Link to="/signup" className="text-[#6b7c5e] font-medium hover:underline">Join free</Link>
        </p>
      </div>
    </div>
  );
}
