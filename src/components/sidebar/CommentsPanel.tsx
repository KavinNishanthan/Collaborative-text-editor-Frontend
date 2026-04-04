// Importing Packages
import toast from "react-hot-toast";
import { useEffect, useState, useCallback } from "react";
import {
  MessageSquare,
  CheckCircle,
  CornerDownRight,
  Send,
} from "lucide-react";
import type { Editor } from "@tiptap/react";

// Importing API
import { commentApi } from "../../api";

// Importing Utils
import { getInitials, formatDate } from "../../Utils";

interface Props {
  documentId: string;
  role: string;
  editor?: Editor | null;
}

interface Reply {
  replyId: string;
  userId?: string;
  content: string;
}

interface Comment {
  commentId: string;
  content: string;
  selectedText?: string;
  rangeStart?: number;
  rangeEnd?: number;
  isResolved: boolean;
  createdAt: string;
  author?: { name: string };
  replies?: Reply[];
}

export default function CommentsPanel({ documentId, role, editor }: Props) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [posting, setPosting] = useState(false);

  // Capture the current selection state from editor whenever panel is interacted with
  const getSelectionInfo = useCallback(() => {
    if (!editor) return null;
    const { from, to } = editor.state.selection;
    if (from === to) return null;
    const selectedText = editor.state.doc.textBetween(from, to, " ");
    if (!selectedText.trim()) return null;
    return { from, to, selectedText };
  }, [editor]);

  const fetchComments = async () => {
    try {
      const res = await commentApi.getAll(documentId);
      setComments(res.data.data || []);
    } catch {
      toast.error("Failed to load comments");
    } finally {
      setLoading(false);
    }
  };

  // Apply highlight marks for loaded comments that have selectedText
  const applyExistingHighlights = useCallback(() => {
    if (!editor) return;
    comments.forEach((c) => {
      if (c.selectedText && c.rangeStart != null && c.rangeEnd != null && !c.isResolved) {
        const docSize = editor.state.doc.content.size;
        const from = Math.min(c.rangeStart, docSize);
        const to = Math.min(c.rangeEnd, docSize);
        if (from < to && from >= 0) {
          try {
            editor
              .chain()
              .setTextSelection({ from, to })
              .setMark('commentHighlight', { commentId: c.commentId })
              .run();
          } catch {
            // Range may be invalid if doc content changed
          }
        }
      }
    });
    // Reset selection after applying marks
    editor.commands.setTextSelection(0);
  }, [editor, comments]);

  useEffect(() => {
    fetchComments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documentId]);

  // Apply existing highlights after comments load
  useEffect(() => {
    if (!loading && comments.length > 0 && editor) {
      // Small delay to ensure editor content is ready
      const t = setTimeout(applyExistingHighlights, 300);
      return () => clearTimeout(t);
    }
  }, [loading, comments.length, editor, applyExistingHighlights]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setPosting(true);

    try {
      const selectionInfo = getSelectionInfo();
      const payload: {
        content: string;
        selectedText?: string;
        rangeStart?: number;
        rangeEnd?: number;
      } = { content: newComment };

      if (selectionInfo) {
        payload.selectedText = selectionInfo.selectedText;
        payload.rangeStart = selectionInfo.from;
        payload.rangeEnd = selectionInfo.to;
      }

      const res = await commentApi.add(documentId, payload);

      // Apply highlight mark if there was a selection
      if (selectionInfo && editor) {
        const commentId = res.data.data?.commentId;
        if (commentId) {
          editor
            .chain()
            .setTextSelection({ from: selectionInfo.from, to: selectionInfo.to })
            .setMark('commentHighlight', { commentId })
            .run();
          // Clear selection after marking
          editor.commands.setTextSelection(selectionInfo.to);
        }
      }

      setNewComment("");
      fetchComments();
    } catch {
      toast.error("Failed to add comment");
    } finally {
      setPosting(false);
    }
  };

  const handleReply = async (commentId: string) => {
    if (!replyText.trim()) return;
    setPosting(true);
    try {
      await commentApi.reply(documentId, commentId, replyText);
      setReplyText("");
      setReplyTo(null);
      fetchComments();
    } catch {
      toast.error("Failed to reply");
    } finally {
      setPosting(false);
    }
  };

  const handleResolve = async (commentId: string) => {
    try {
      await commentApi.resolve(documentId, commentId);
      setComments((c) =>
        c.map((x) =>
          x.commentId === commentId ? { ...x, isResolved: true } : x,
        ),
      );

      // Remove the highlight mark from the editor
      if (editor) {
        const { doc } = editor.state;
        doc.descendants((node, pos) => {
          node.marks.forEach((mark) => {
            if (
              mark.type.name === 'commentHighlight' &&
              mark.attrs.commentId === commentId
            ) {
              editor
                .chain()
                .setTextSelection({ from: pos, to: pos + node.nodeSize })
                .unsetMark('commentHighlight')
                .run();
            }
          });
        });
        editor.commands.setTextSelection(0);
      }
    } catch {
      toast.error("Failed to resolve comment");
    }
  };

  const handleCommentClick = (comment: Comment) => {
    if (!editor || !comment.selectedText || comment.rangeStart == null) return;

    // Find the highlighted span in the DOM
    const spans = editor.view.dom.querySelectorAll(
      `span[data-comment-id="${comment.commentId}"]`
    );

    if (spans.length > 0) {
      const span = spans[0] as HTMLElement;
      span.scrollIntoView({ behavior: 'smooth', block: 'center' });

      // Add pulse animation
      span.classList.add('comment-highlight-active');
      setTimeout(() => span.classList.remove('comment-highlight-active'), 1500);
    }
  };

  const canResolve = role === "owner" || role === "editor";

  // Determine if there's a selection currently
  const selectionInfo = getSelectionInfo();

  return (
    <div className='flex flex-col h-full'>
      {/* Selection indicator */}
      {selectionInfo && (
        <div className='px-4 pt-3 pb-1'>
          <div className='comment-selected-text'>
            "{selectionInfo.selectedText.slice(0, 100)}{selectionInfo.selectedText.length > 100 ? '…' : ''}"
          </div>
          <p className='text-[10px] text-[#94A3B8] mb-1'>
            Commenting on selected text
          </p>
        </div>
      )}

      {/* Add comment */}
      <form
        onSubmit={handleAdd}
        className='p-4 border-b border-black/6 flex gap-2'>
        <input
          type='text'
          placeholder={selectionInfo ? 'Comment on selection…' : 'Add a comment…'}
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
              No comments yet. Select text and click "Comment" to start!
            </p>
          </div>
        )}
        {!loading &&
          comments.map((c) => (
            <div
              key={c.commentId}
              className={`p-4 border-b border-black/4 ${c.isResolved ? "opacity-50" : ""} ${c.selectedText ? "cursor-pointer hover:bg-[#FFFBEB]" : ""}`}
              onClick={() => handleCommentClick(c)}>

              {/* Selected text snippet */}
              {c.selectedText && (
                <div className='comment-selected-text'>
                  "{c.selectedText.slice(0, 80)}{c.selectedText.length > 80 ? '…' : ''}"
                </div>
              )}

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
              {c.replies?.map((r: Reply) => (
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
                    onClick={(e) => {
                      e.stopPropagation();
                      setReplyTo(replyTo === c.commentId ? null : c.commentId);
                    }}
                    className='text-[11px] text-[#64748B] hover:text-[#4F46E5] transition-colors'>
                    Reply
                  </button>
                  {canResolve && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleResolve(c.commentId);
                      }}
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
                <div
                  className='flex gap-2 mt-2 ml-9'
                  onClick={(e) => e.stopPropagation()}>
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
