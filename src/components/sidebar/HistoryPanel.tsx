import { useEffect, useState } from 'react';
import { historyApi } from '../../api';
import { getUserColor, getInitials } from '../../utils';
import { History, RotateCcw, Eye } from 'lucide-react';
import toast from 'react-hot-toast';

interface Props {
  documentId: string;
  role: string;
  onPreview?: (content: string | null) => void;
}

interface HistoryEntry {
  historyId: string;
  version: number;
  content: string;
  timestamp: string;
  editedBy: string;
  editedByUser?: { name: string; userId: string };
}

function groupByDate(entries: HistoryEntry[]) {
  const groups: Record<string, HistoryEntry[]> = {};
  for (const e of entries) {
    const d = new Date(e.timestamp);
    const key = d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    if (!groups[key]) groups[key] = [];
    groups[key].push(e);
  }
  return Object.entries(groups);
}

function formatTime(ts: string) {
  return new Date(ts).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

export default function HistoryPanel({ documentId, role, onPreview }: Props) {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [restoring, setRestoring] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    historyApi.getAll(documentId)
      .then((res) => setHistory(res.data.data || []))
      .catch(() => toast.error('Failed to load history'))
      .finally(() => setLoading(false));
  }, [documentId]);

  const handleRestore = async (historyId: string) => {
    if (!confirm('Restore this version? Your current content will be replaced.')) return;
    setRestoring(historyId);
    try {
      await historyApi.restore(documentId, historyId);
      toast.success('Version restored — reloading…');
      setTimeout(() => window.location.reload(), 1000);
    } catch {
      toast.error('Failed to restore version');
    } finally {
      setRestoring(null);
    }
  };

  const handleEnter = (h: HistoryEntry) => {
    setActiveId(h.historyId);
    onPreview?.(h.content ?? null);
  };

  const handleLeave = () => {
    setActiveId(null);
    onPreview?.(null);
  };

  const canRestore = role === 'owner' || role === 'editor';
  const groups = groupByDate(history);

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Active preview notice */}
      {activeId && (
        <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-50 border-b border-amber-100 text-xs text-amber-700 font-medium">
          <Eye size={12} />
          Previewing — move away to return
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-12">
          <span className="w-5 h-5 border-2 border-black/[0.08] border-t-[#4F46E5] rounded-full animate-spin-custom" />
        </div>
      )}

      {/* Empty */}
      {!loading && history.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 gap-3 px-6 text-center">
          <div className="w-12 h-12 rounded-2xl bg-[rgba(79,70,229,0.06)] flex items-center justify-center text-[#4F46E5]">
            <History size={22} />
          </div>
          <p className="text-sm font-semibold text-[#0F172A]">No version history yet</p>
          <p className="text-xs text-[#94A3B8]">Versions are created automatically as you edit.</p>
        </div>
      )}

      {/* Grouped history list */}
      {!loading && groups.map(([dateLabel, entries]) => (
        <div key={dateLabel}>
          {/* Date group header */}
          <div className="px-4 py-2 bg-[#F8FAFC] border-y border-black/[0.04] sticky top-0 z-10">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[#94A3B8]">
              {dateLabel}
            </span>
          </div>

          {entries.map((h) => {
            const userName = h.editedByUser?.name || 'Unknown';
            const userId = h.editedByUser?.userId || h.editedBy;
            const color = getUserColor(userId);
            const isActive = activeId === h.historyId;

            return (
              <div
                key={h.historyId}
                onMouseEnter={() => handleEnter(h)}
                onMouseLeave={handleLeave}
                className={`
                  group flex items-start gap-3 px-4 py-3.5 border-b border-black/[0.04] cursor-pointer
                  transition-all duration-150 relative
                  ${isActive
                    ? 'bg-amber-50/60 border-l-2 border-l-amber-400'
                    : 'hover:bg-[#F8FAFC] border-l-2 border-l-transparent'}
                `}
              >
                {/* User avatar */}
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0 mt-0.5 shadow-sm"
                  style={{ background: color }}
                  title={userName}
                >
                  {getInitials(userName)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[13px] font-semibold text-[#0F172A] truncate">
                      {userName}
                    </span>
                    <span className="text-[10px] text-[#94A3B8] flex-shrink-0">
                      {formatTime(h.timestamp)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-[rgba(79,70,229,0.07)] text-[#4F46E5]">
                      v{h.version}
                    </span>
                    {isActive && (
                      <span className="text-[10px] font-medium text-amber-600">Previewing</span>
                    )}
                  </div>

                  {/* Restore button */}
                  {canRestore && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleRestore(h.historyId); }}
                      disabled={restoring === h.historyId}
                      className="mt-1.5 opacity-0 group-hover:opacity-100 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium
                        bg-[rgba(79,70,229,0.07)] text-[#4F46E5] hover:bg-[rgba(79,70,229,0.14)]
                        disabled:opacity-40 transition-all"
                    >
                      {restoring === h.historyId
                        ? <span className="w-3 h-3 border border-[#4F46E5]/30 border-t-[#4F46E5] rounded-full animate-spin-custom" />
                        : <RotateCcw size={11} />}
                      Restore this version
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
