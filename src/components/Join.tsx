import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { sharingApi } from '../api';

export default function Join() {
  const { shareToken } = useParams<{ shareToken: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    if (!shareToken) { navigate('/dashboard'); return; }
    sharingApi.joinViaLink(shareToken)
      .then((res) => {
        const { documentId } = res.data.data;
        toast.success(res.data.message || 'Joined successfully!');
        navigate(`/dashboard?doc=${documentId}`, { replace: true });
      })
      .catch((err) => {
        toast.error(err?.response?.data?.message || 'Invalid or expired link.');
        navigate('/dashboard');
      });
  }, [shareToken]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <span className="w-10 h-10 border-2 border-black/8 border-t-[#4F46E5] rounded-full animate-spin-custom" />
        <p className="text-sm text-[#64748B]">Joining document…</p>
      </div>
    </div>
  );
}
