import { useEffect, useState } from 'react';
import { commentApi } from '../../api';
import { getInitials, formatDate } from "../../Utils";
import { MessageSquare, CheckCircle, CornerDownRight, Send } from 'lucide-react';
import toast from 'react-hot-toast';

interface Props { documentId: string; role: string; }

export default function CommentsPanel({ documentId, role }: Props) {
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [posting, setPosting] = useState(false);

  const fetchComments = async () => {
    try {
      const res = await commentApi.getAll(documentId);
      setComments(res.data.data || []);
    } catch { toast.error('Failed to load comments'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchComments(); }, [documentId]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setPosting(true);
    try {
      await commentApi.add(documentId, { content: newComment });
      setNewComment('');
      fetchComments();
    } catch { toast.error('Failed to add comment'); }
    finally { setPosting(false); }
  };

  const handleReply = async (commentId: string) => {
    if (!replyText.trim()) return;
    setPosting(true);
    try {
      await commentApi.reply(documentId, commentId, replyText);
      setReplyText(''); setReplyTo(null);
      fetchComments();
    } catch { toast.error('Failed to reply'); }
    finally { setPosting(false); }
  };

  const handleResolve = async (commentId: string) => {
    try {
      await commentApi.resolve(documentId, commentId);
      setComments((c) => c.map((x) => x.commentId === commentId ? { ...x, isResolved: true } : x));
    } catch { toast.error('Failed to resolve comment'); }
  };

  const canResolve = role === 'owner' || role === 'editor';

  return (
    <div className='flex flex-col h-full'>
      {/* Add comment */}
      <form
        onSubmit={handleAdd}
        className='p-4 border-b border-black/6 flex gap-2'>
        <input
          type='text'
          placeholder='Add a comment…'
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          className='flex-1 px-3 py-2 bg-[#F8FAFC] border border-black/6 rounded-xl text-sm text-[#0F172A] placeholder-[#94A3B8] outline-none focus:border-[#4F46E5] transition-all'
        />
        <button
          type='submit'
          disabled={posting || !newComment.trim()}
          className='p-2 rounded-xl bg-[#4F46E5] text-white hover:bg-[#4338CA] disabled:opacity-50 transition-all shrink-0'>
          {posting ? (
            <span className='w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin-custom block' />
          ) : (
            <Send size={15} />
          )}
        </button>
      </form>

      {/* Comment list */}
      <div className='flex-1 overflow-y-auto'>
        {loading && (
          <div className='flex justify-center py-8'>
            <span className='w-6 h-6 border-2 border-black/8 border-t-[#4F46E5] rounded-full animate-spin-custom' />
          </div>
        )}
        {!loading && comments.length === 0 && (
          <div className='flex flex-col items-center justify-center py-16 gap-3 text-center px-4'>
            <MessageSquare size={28} className='text-[#94A3B8]' />
            <p className='text-sm text-[#64748B]'>
              No comments yet. Be the first to comment!
            </p>
          </div>
        )}
        {!loading &&
          comments.map((c) => (
            <div
              key={c.commentId}
              className={`p-4 border-b border-black/4 ${c.isResolved ? "opacity-50" : ""}`}>
              <div className='flex items-start gap-2.5 mb-2'>
                <div className='w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white bg-linear-to-br from-[#4F46E5] to-[#06B6D4] shrink-0'>
                  {getInitials(c.author?.name || "?")}
                </div>
                <div className='flex-1 min-w-0'>
                  <div className='flex items-center justify-between gap-2 mb-1'>
                    <span className='text-xs font-semibold text-[#0F172A]'>
                      {c.author?.name || "Unknown"}
                    </span>
                    <span className='text-[10px] text-[#94A3B8]'>
                      {formatDate(c.createdAt)}
                    </span>
                  </div>
                  <p className='text-sm text-[#334155] leading-relaxed'>
                    {c.content}
                  </p>
                </div>
              </div>

              {/* Replies */}
              {c.replies?.map((r: any) => (
                <div
                  key={r.replyId}
                  className='ml-9 flex items-start gap-2 mt-2'>
                  <CornerDownRight
                    size={12}
                    className='text-[#94A3B8] mt-1 shrink-0'
                  />
                  <div>
                    <p className='text-[11px] font-medium text-[#64748B]'>
                      {r.userId?.slice(0, 8) || "User"}
                    </p>
                    <p className='text-xs text-[#334155]'>{r.content}</p>
                  </div>
                </div>
              ))}

              {/* Actions */}
              {!c.isResolved && (
                <div className='flex items-center gap-2 mt-2 ml-9'>
                  <button
                    onClick={() =>
                      setReplyTo(replyTo === c.commentId ? null : c.commentId)
                    }
                    className='text-[11px] text-[#64748B] hover:text-[#4F46E5] transition-colors'>
                    Reply
                  </button>
                  {canResolve && (
                    <button
                      onClick={() => handleResolve(c.commentId)}
                      className='flex items-center gap-1 text-[11px] text-[#64748B] hover:text-[#10B981] transition-colors'>
                      <CheckCircle size={11} /> Resolve
                    </button>
                  )}
                </div>
              )}
              {c.isResolved && (
                <span className='ml-9 text-[10px] text-[#10B981] flex items-center gap-1'>
                  <CheckCircle size={10} /> Resolved
                </span>
              )}

              {/* Reply input */}
              {replyTo === c.commentId && (
                <div className='flex gap-2 mt-2 ml-9'>
                  <input
                    type='text'
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder='Write a reply…'
                    autoFocus
                    className='flex-1 px-3 py-1.5 bg-[#F8FAFC] border border-black/6 rounded-lg text-xs text-[#0F172A] placeholder-[#94A3B8] outline-none focus:border-[#4F46E5] transition-all'
                  />
                  <button
                    onClick={() => handleReply(c.commentId)}
                    disabled={posting || !replyText.trim()}
                    className='px-2.5 py-1.5 rounded-lg bg-[#4F46E5] text-white text-xs hover:bg-[#4338CA] disabled:opacity-50 transition-all'>
                    <Send size={12} />
                  </button>
                </div>
              )}
            </div>
          ))}
      </div>
    </div>
  );
}
