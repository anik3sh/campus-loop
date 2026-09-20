import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, ArrowRight } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

export default function SignupPage() {
  const navigate = useNavigate();
  const { register, isLoading } = useAuthStore();
  const [form, setForm] = useState({ name: '', email: '', password: '', college: '', campus: '' });
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    try {
      await register(form);
      toast.success('Account created! Welcome to Campus Loop 🎉');
      navigate('/');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Registration failed');
    }
  };

  const update = (field: string, value: string) => setForm(f => ({ ...f, [field]: value }));

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
          <h1 className="font-serif text-2xl font-semibold text-[#1a1a1a] mb-2">Join Campus Loop</h1>
          <p className="text-sm text-[#8a8a8a]">Create your free student account</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white border border-[#e8e4de] rounded-2xl p-6 space-y-4">
          <div>
            <label className="text-sm font-medium text-[#1a1a1a] block mb-1.5">Full Name</label>
            <input type="text" value={form.name} onChange={e => update('name', e.target.value)} required placeholder="Your name"
              className="w-full px-4 py-2.5 border border-[#e8e4de] rounded-lg text-sm focus:outline-none focus:border-[#6b7c5e] bg-[#faf8f5]" />
          </div>
          <div>
            <label className="text-sm font-medium text-[#1a1a1a] block mb-1.5">Email</label>
            <input type="email" value={form.email} onChange={e => update('email', e.target.value)} required placeholder="you@student.in"
              className="w-full px-4 py-2.5 border border-[#e8e4de] rounded-lg text-sm focus:outline-none focus:border-[#6b7c5e] bg-[#faf8f5]" />
          </div>
          <div>
            <label className="text-sm font-medium text-[#1a1a1a] block mb-1.5">Password</label>
            <div className="relative">
              <input type={showPass ? 'text' : 'password'} value={form.password} onChange={e => update('password', e.target.value)} required placeholder="Min. 6 characters"
                className="w-full px-4 py-2.5 pr-11 border border-[#e8e4de] rounded-lg text-sm focus:outline-none focus:border-[#6b7c5e] bg-[#faf8f5]" />
              <button type="button" onClick={() => setShowPass(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8a8a8a] hover:text-[#1a1a1a]">
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-[#1a1a1a] block mb-1.5">College / University</label>
            <input type="text" value={form.college} onChange={e => update('college', e.target.value)} placeholder="e.g. IIT Delhi, Delhi University"
              className="w-full px-4 py-2.5 border border-[#e8e4de] rounded-lg text-sm focus:outline-none focus:border-[#6b7c5e] bg-[#faf8f5]" />
          </div>
          <div>
            <label className="text-sm font-medium text-[#1a1a1a] block mb-1.5">Campus / Location</label>
            <input type="text" value={form.campus} onChange={e => update('campus', e.target.value)} placeholder="e.g. North Campus, Powai"
              className="w-full px-4 py-2.5 border border-[#e8e4de] rounded-lg text-sm focus:outline-none focus:border-[#6b7c5e] bg-[#faf8f5]" />
          </div>

          <p className="text-xs text-[#8a8a8a]">
            By joining, you agree to our{' '}
            <a href="#" className="text-[#6b7c5e] hover:underline">Terms of Service</a> and{' '}
            <a href="#" className="text-[#6b7c5e] hover:underline">Privacy Policy</a>.
          </p>

          <button type="submit" disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 py-3 bg-[#6b7c5e] text-white font-medium rounded-xl hover:bg-[#4a5c40] transition-colors disabled:opacity-70">
            {isLoading ? 'Creating account...' : (<>Create Account <ArrowRight className="w-4 h-4" /></>)}
          </button>
        </form>

        <p className="text-center text-sm text-[#8a8a8a] mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-[#6b7c5e] font-medium hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
