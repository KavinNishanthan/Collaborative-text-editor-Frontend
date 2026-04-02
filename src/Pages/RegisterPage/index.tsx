// Importing Packages
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, User } from 'lucide-react';
import toast from 'react-hot-toast';

// Importing Api
import { authApi } from '../../api';


export default function Register() {

  const navigate = useNavigate();
  const [step, setStep] = useState<'register' | 'otp'>('register');
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [otp, setOtp] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      await authApi.register({ name: form.name, email: form.email, password: form.password });
      toast.success('OTP sent to your email!');
      setStep('otp');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authApi.verifyOtp({ email: form.email, otp });
      toast.success('Account created! Please sign in.');
      navigate('/login');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Invalid OTP.');
    } finally {
      setLoading(false);
    }
  };

  const inputCls = "w-full pl-10 pr-4 py-3 bg-[#F8FAFC] border border-black/[0.08] rounded-xl text-sm text-[#0F172A] placeholder-[#94A3B8] outline-none focus:border-[#4F46E5] focus:shadow-[0_0_0_3px_rgba(79,70,229,0.1)] transition-all";

  return (
    <div className='min-h-screen bg-linear-to-br from-[#F8FAFC] via-[#EEF2FF] to-[#F0F9FF] flex items-center justify-center px-4 relative overflow-hidden'>
      <div className='absolute inset-0 pointer-events-none'>
        <div className='absolute w-96 h-96 -top-20 -right-20 rounded-full bg-[radial-gradient(circle,rgba(79,70,229,0.08),transparent_70%)] blur-[60px] animate-float' />
        <div className='absolute w-80 h-80 -bottom-10 -left-10 rounded-full bg-[radial-gradient(circle,rgba(16,185,129,0.06),transparent_70%)] blur-[60px] animate-float [animation-delay:-2s]' />
      </div>

      <div className='relative z-10 w-full max-w-md animate-slide-up'>
        <div className='text-center mb-8 text-6xl'>
          <span>Collab</span>
          <span className='text-blue-600'>Edit</span>
        </div>

        <div className='bg-white border border-black/6 rounded-2xl p-8 shadow-[0_8px_48px_rgba(0,0,0,0.06)]'>
          {step === "register" ? (
            <>
              <div className='mb-6'>
                <h1 className='text-2xl font-bold mb-1.5 text-[#0F172A]'>
                  Create your account
                </h1>
                <p className='text-sm text-[#64748B]'>
                  Start collaborating on documents today
                </p>
              </div>
              <form onSubmit={handleRegister} className='flex flex-col gap-4'>
                <div className='flex flex-col gap-1.5'>
                  <label className='text-xs font-medium text-[#64748B]'>
                    Full name
                  </label>
                  <div className='relative'>
                    <User
                      size={15}
                      className='absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]'
                    />
                    <input
                      type='text'
                      className={inputCls}
                      placeholder='Kavin Nishanthan'
                      value={form.name}
                      onChange={(e) =>
                        setForm({ ...form, name: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>
                <div className='flex flex-col gap-1.5'>
                  <label className='text-xs font-medium text-[#64748B]'>
                    Email address
                  </label>
                  <div className='relative'>
                    <Mail
                      size={15}
                      className='absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]'
                    />
                    <input
                      type='email'
                      className={inputCls}
                      placeholder='kavin@gamil.com'
                      value={form.email}
                      onChange={(e) =>
                        setForm({ ...form, email: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>
                <div className='flex flex-col gap-1.5'>
                  <label className='text-xs font-medium text-[#64748B]'>
                    Password
                  </label>
                  <div className='relative'>
                    <Lock
                      size={15}
                      className='absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]'
                    />
                    <input
                      type={showPass ? "text" : "password"}
                      className={`${inputCls} pr-10`}
                      placeholder='Min. 8 characters'
                      value={form.password}
                      onChange={(e) =>
                        setForm({ ...form, password: e.target.value })
                      }
                      required
                      minLength={8}
                    />
                    <button
                      type='button'
                      onClick={() => setShowPass(!showPass)}
                      className='absolute right-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#64748B] transition-colors'>
                      {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>
                <div className='flex flex-col gap-1.5'>
                  <label className='text-xs font-medium text-[#64748B]'>
                    Confirm password
                  </label>
                  <div className='relative'>
                    <Lock
                      size={15}
                      className='absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]'
                    />
                    <input
                      type={showConfirmPass ? "text" : "password"}
                      className={`${inputCls} pr-10 ${
                        form.confirmPassword &&
                        form.password !== form.confirmPassword
                          ? "border-red-400 focus:border-red-400 focus:shadow-[0_0_0_3px_rgba(248,113,113,0.15)]"
                          : form.confirmPassword &&
                              form.password === form.confirmPassword
                            ? "border-emerald-400 focus:border-emerald-400 focus:shadow-[0_0_0_3px_rgba(52,211,153,0.15)]"
                            : ""
                      }`}
                      placeholder='Re-enter your password'
                      value={form.confirmPassword}
                      onChange={(e) =>
                        setForm({ ...form, confirmPassword: e.target.value })
                      }
                      required
                      minLength={8}
                    />
                    <button
                      type='button'
                      onClick={() => setShowConfirmPass(!showConfirmPass)}
                      className='absolute right-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#64748B] transition-colors'>
                      {showConfirmPass ? (
                        <EyeOff size={15} />
                      ) : (
                        <Eye size={15} />
                      )}
                    </button>
                  </div>
                  {form.confirmPassword &&
                    form.password !== form.confirmPassword && (
                      <p className='text-xs text-red-400 mt-0.5'>
                        Passwords do not match
                      </p>
                    )}
                </div>
                <button
                  type='submit'
                  disabled={loading}
                  className='w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm bg-[#4F46E5] text-white shadow-[0_2px_12px_rgba(79,70,229,0.25)] hover:bg-[#4338CA] hover:shadow-[0_4px_20px_rgba(79,70,229,0.35)] hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none transition-all mt-1'>
                  {loading && (
                    <span className='w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin-custom' />
                  )}
                  {loading ? "Sending OTP…" : "Next"}
                </button>
              </form>
            </>
          ) : (
            <>
              <div className='mb-6'>
                <h1 className='text-2xl font-bold mb-1.5 text-[#0F172A]'>
                  Verify your email
                </h1>
                <p className='text-sm text-[#64748B]'>
                  We sent a 6-digit OTP to{" "}
                  <span className='text-[#0F172A] font-medium'>
                    {form.email}
                  </span>
                </p>
              </div>
              <form onSubmit={handleVerify} className='flex flex-col gap-4'>
                <div className='flex flex-col gap-1.5'>
                  <label className='text-xs font-medium text-[#64748B]'>
                    OTP Code
                  </label>
                  <input
                    type='text'
                    maxLength={6}
                    className='w-full py-4 text-center text-2xl font-bold tracking-[0.5em] bg-[#F8FAFC] border border-black/8 rounded-xl text-[#0F172A] placeholder-[#94A3B8] outline-none focus:border-[#4F46E5] focus:shadow-[0_0_0_3px_rgba(79,70,229,0.1)] transition-all font-mono'
                    placeholder='000000'
                    value={otp}
                    onChange={(e) =>
                      setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                    }
                    required
                  />
                </div>
                <button
                  type='submit'
                  disabled={loading || otp.length < 6}
                  className='w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm bg-[#4F46E5] text-white shadow-[0_2px_12px_rgba(79,70,229,0.25)] hover:bg-[#4338CA] hover:shadow-[0_4px_20px_rgba(79,70,229,0.35)] hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none transition-all'>
                  {loading && (
                    <span className='w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin-custom' />
                  )}
                  {loading ? "Verifying…" : "Verify & Continue"}
                </button>
                <button
                  type='button'
                  onClick={() => setStep("register")}
                  className='text-sm text-[#64748B] hover:text-[#0F172A] transition-colors'>
                  ← Back to registration
                </button>
              </form>
            </>
          )}

          <p className='mt-6 text-center text-sm text-[#64748B]'>
            Already have an account?{" "}
            <Link
              to='/login'
              className='text-[#4F46E5] hover:text-[#4338CA] font-medium transition-colors'>
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
