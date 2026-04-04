// Importing Packages
import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

// Importing Store
import { useAuthStore } from "../Store/useAuthStore";

export default function GoogleAuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const setUser = useAuthStore((s) => s.setUser);

  useEffect(() => {
    const userId = searchParams.get("userId");
    const name = searchParams.get("name");
    const email = searchParams.get("email");

    if (userId && name && email) {
      setUser({ userId, name, email });
      navigate("/dashboard", { replace: true });
    } else {
      navigate("/login", { replace: true });
    }
  }, [searchParams, setUser, navigate]);

  return (
    <div className='min-h-screen bg-linear-to-br from-[#F8FAFC] via-[#EEF2FF] to-[#F0F9FF] flex items-center justify-center'>
      <div className='flex flex-col items-center gap-3'>
        <span className='w-8 h-8 border-2 border-black/8 border-t-[#4F46E5] rounded-full animate-spin-custom' />
        <p className='text-sm text-[#64748B]'>Signing you in…</p>
      </div>
    </div>
  );
}
