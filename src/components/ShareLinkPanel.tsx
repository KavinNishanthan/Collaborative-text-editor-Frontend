// Importing Packages
import { useState } from "react";
import toast from "react-hot-toast";
import { Copy, Check, X, Share2, ExternalLink } from "lucide-react";

// Importing API
import { sharingApi } from "../api";

// Importing Utils
import { copyToClipboard } from "../Utils";

interface Props {
  documentId: string;
  onClose: () => void;
}

export default function ShareLinkPanel({ documentId, onClose }: Props) {
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const shareLink = token ? `${window.location.origin}/join/${token}` : "";

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const res = await sharingApi.generateLink(documentId);
      setToken(res.data.data.shareToken);
      toast.success("Share link generated!");
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      toast.error(axiosErr?.response?.data?.message || "Failed to generate link");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    await copyToClipboard(shareLink);
    setCopied(true);
    toast.success("Link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/20 backdrop-blur-sm animate-fade-in'>
      <div className='bg-white border border-black/8 rounded-2xl p-7 max-w-md w-full shadow-[0_8px_48px_rgba(0,0,0,0.1)] animate-slide-up'>
        {/* Header */}
        <div className='flex items-center justify-between mb-6'>
          <div className='flex items-center gap-2.5'>
            <div className='w-9 h-9 rounded-xl bg-[rgba(79,70,229,0.06)] flex items-center justify-center text-[#4F46E5]'>
              <Share2 size={18} />
            </div>
            <div>
              <h2 className='font-bold text-base text-[#0F172A]'>
                Share Document
              </h2>
              <p className='text-xs text-[#64748B]'>
                Generate a shareable link
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className='p-2 rounded-xl text-[#94A3B8] hover:text-[#0F172A] hover:bg-black/4 transition-all'>
            <X size={18} />
          </button>
        </div>

        {!token ? (
          <div className='flex flex-col items-center gap-4 py-4 text-center'>
            <div className='w-16 h-16 rounded-2xl bg-[rgba(79,70,229,0.06)] border border-[rgba(79,70,229,0.1)] flex items-center justify-center text-[#4F46E5]'>
              <ExternalLink size={28} />
            </div>
            <p className='text-sm text-[#64748B] max-w-xs'>
              Anyone with the link can join this document as a viewer.
            </p>
            <button
              onClick={handleGenerate}
              disabled={loading}
              className='flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm bg-[#4F46E5] text-white shadow-[0_2px_12px_rgba(79,70,229,0.25)] hover:bg-[#4338CA] disabled:opacity-60 transition-all'>
              {loading && (
                <span className='w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin-custom' />
              )}
              {loading ? "Generating…" : "Generate Share Link"}
            </button>
          </div>
        ) : (
          <div className='flex flex-col gap-4'>
            <div>
              <label className='text-xs font-medium text-[#64748B] block mb-1.5'>
                Share link
              </label>
              <div className='flex gap-2'>
                <input
                  type='text'
                  readOnly
                  value={shareLink}
                  className='flex-1 px-3 py-2.5 bg-[#F8FAFC] border border-black/8 rounded-xl text-sm text-[#64748B] outline-none font-mono truncate'
                />
                <button
                  onClick={handleCopy}
                  className='flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-medium text-sm bg-[rgba(79,70,229,0.06)] text-[#4F46E5] border border-[rgba(79,70,229,0.12)] hover:bg-[rgba(79,70,229,0.12)] transition-all shrink-0'>
                  {copied ? (
                    <>
                      <Check size={14} className='text-[#10B981]' /> Copied!
                    </>
                  ) : (
                    <>
                      <Copy size={14} /> Copy
                    </>
                  )}
                </button>
              </div>
            </div>
            <p className='text-xs text-[#94A3B8]'>
              ⚠️ Anyone with this link can join as a viewer. Generate a new link
              to invalidate the previous one.
            </p>
            <button
              onClick={handleGenerate}
              disabled={loading}
              className='text-sm text-[#64748B] hover:text-[#0F172A] transition-colors underline text-center'>
              Regenerate link
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
