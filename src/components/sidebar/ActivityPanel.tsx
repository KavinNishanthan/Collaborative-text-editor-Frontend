// Importing Packages
import { useEffect, useState } from "react";
import { Activity } from "lucide-react";
import toast from "react-hot-toast";

// Importing API
import { activityApi } from "../../api";

// Importing Utils
import { formatDate } from "../../Utils";

const actionIcon: Record<string, string> = {
  joined: "👋",
  left: "🚪",
  edited: "✏️",
  commented: "💬",
  invited: "🔗",
  removed: "🗑️",
  restored: "🔄",
};

export default function ActivityPanel({ documentId }: { documentId: string }) {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    activityApi
      .getAll(documentId)
      .then((res) => setLogs(res.data.data || []))
      .catch(() => toast.error("Failed to load activity"))
      .finally(() => setLoading(false));
  }, [documentId]);

  return (
    <div className='flex flex-col'>
      {loading && (
        <div className='flex justify-center py-8'>
          <span className='w-6 h-6 border-2 border-black/8 border-t-[#4F46E5] rounded-full animate-spin-custom' />
        </div>
      )}
      {!loading && logs.length === 0 && (
        <div className='flex flex-col items-center justify-center py-16 gap-3 text-center px-4'>
          <Activity size={28} className='text-[#94A3B8]' />
          <p className='text-sm text-[#64748B]'>No activity yet.</p>
        </div>
      )}
      {!loading &&
        logs.map((log) => (
          <div
            key={log.logId}
            className='flex items-start gap-3 px-4 py-3 border-b border-black/4'>
            <span className='text-base shrink-0 mt-0.5'>
              {actionIcon[log.action] || "📝"}
            </span>
            <div className='flex-1 min-w-0'>
              <p className='text-sm text-[#334155]'>
                <span className='font-semibold text-[#0F172A]'>
                  {log.user?.name || "Someone"}
                </span>{" "}
                <span className='text-[#64748B]'>{log.action}</span>
              </p>
              <p className='text-[11px] text-[#94A3B8] mt-0.5'>
                {formatDate(log.timestamp)}
              </p>
            </div>
          </div>
        ))}
    </div>
  );
}
