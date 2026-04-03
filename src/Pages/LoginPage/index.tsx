// Importing Packages
import { useState } from "react";
import toast from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";

// Importing API
import { authApi } from "../../api";

// Importing Store
import { useAuthStore } from "../../Store/useAuthStore";

export default function Login() {
  const navigate = useNavigate();
  const setUser = useAuthStore((s) => s.setUser);
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await authApi.login(form);
      const { data } = res.data;
      setUser(data);
      toast.success("Welcome back!");
      navigate("/dashboard");
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message || "Login failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='min-h-screen bg-linear-to-br from-[#F8FAFC] via-[#EEF2FF] to-[#F0F9FF] flex items-center justify-center px-4 relative overflow-hidden'>
      <div className='absolute inset-0 pointer-events-none'>
        <div className='absolute w-96 h-96 -top-20 -left-20 rounded-full bg-[radial-gradient(circle,rgba(79,70,229,0.08),transparent_70%)] blur-[60px] animate-float' />
        <div className='absolute w-80 h-80 -bottom-10 -right-10 rounded-full bg-[radial-gradient(circle,rgba(6,182,212,0.06),transparent_70%)] blur-[60px] animate-float [animation-delay:-3s]' />
      </div>

      <div className='relative z-10 w-full max-w-md animate-slide-up'>
        <div className='text-center mb-8 text-6xl'>
          <span>Collab</span>
          <span className='text-blue-600'>Edit</span>
        </div>

        <div className='bg-white border border-black/6 rounded-2xl p-8 shadow-[0_8px_48px_rgba(0,0,0,0.06)]'>
          <div className='mb-7'>
            <h1 className='text-2xl font-bold mb-1.5 text-[#0F172A]'>
              Welcome back
            </h1>
            <p className='text-sm text-[#64748B]'>Sign in to your workspace</p>
          </div>

          <form onSubmit={handleSubmit} className='flex flex-col gap-4'>
            <div className='flex flex-col gap-1.5'>
              <label
                htmlFor='email'
                className='text-xs font-medium text-[#64748B]'>
                Email address
              </label>
              <div className='relative'>
                <Mail
                  size={15}
                  className='absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]'
                />
                <input
                  id='email'
                  type='email'
                  className='w-full pl-10 pr-4 py-3 bg-[#F8FAFC] border border-black/8 rounded-xl text-sm text-[#0F172A] placeholder-[#94A3B8] outline-none focus:border-[#4F46E5] focus:shadow-[0_0_0_3px_rgba(79,70,229,0.1)] transition-all'
                  placeholder='kavin@gmail.com'
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                  autoComplete='email'
                />
              </div>
            </div>

            {/* Password */}
            <div className='flex flex-col gap-1.5'>
              <label
                htmlFor='password'
                className='text-xs font-medium text-[#64748B]'>
                Password
              </label>
              <div className='relative'>
                <Lock
                  size={15}
                  className='absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]'
                />
                <input
                  id='password'
                  type={showPass ? "text" : "password"}
                  className='w-full pl-10 pr-10 py-3 bg-[#F8FAFC] border border-black/8 rounded-xl text-sm text-[#0F172A] placeholder-[#94A3B8] outline-none focus:border-[#4F46E5] focus:shadow-[0_0_0_3px_rgba(79,70,229,0.1)] transition-all'
                  placeholder='••••••••'
                  value={form.password}
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                  }
                  required
                  autoComplete='current-password'
                />
                <button
                  type='button'
                  onClick={() => setShowPass(!showPass)}
                  className='absolute right-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#64748B] transition-colors'>
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button
              id='login-submit'
              type='submit'
              disabled={loading}
              className='w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm bg-[#4F46E5] text-white shadow-[0_2px_12px_rgba(79,70,229,0.25)] hover:bg-[#4338CA] hover:shadow-[0_4px_20px_rgba(79,70,229,0.35)] hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none transition-all'>
              {loading && (
                <span className='w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin-custom' />
              )}
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <p className='mt-6 text-center text-sm text-[#64748B]'>
            Don't have an account?{" "}
            <Link
              to='/register'
              className='text-[#4F46E5] hover:text-[#4338CA] font-medium transition-colors'>
              Create one.
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
