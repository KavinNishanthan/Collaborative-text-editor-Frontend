// Importing Packages
import * as Y from "yjs";
import toast from "react-hot-toast";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useEffect, useState, useCallback, useRef } from "react";

// Importing TipTao Packages
import StarterKit from "@tiptap/starter-kit";
import Highlight from "@tiptap/extension-highlight";
import TextAlign from "@tiptap/extension-text-align";
import Placeholder from "@tiptap/extension-placeholder";
import { useEditor, EditorContent } from "@tiptap/react";
import Collaboration from "@tiptap/extension-collaboration";
import {
  Plus,
  FileText,
  Trash2,
  LogOut,
  Search,
  Clock,
  Share2,
  Users,
  History,
  MessageSquare,
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Highlighter,
  Heading1,
  Heading2,
  List,
  ListOrdered,
  Quote,
  Minus,
  CheckCircle,
  AlertCircle,
  Loader2,
  ChevronLeft,
  X,
  Bell,
  Check,
} from "lucide-react";

// Importing Interface
import type { Document, OnlineUser } from "../../interface/interface";

// Importing Lib
import CollabCursor from "../../lib/CollabCursor";
import CommentHighlight from "../../lib/CommentHighlight";
import { SocketIOProvider } from "../../lib/SocketIOProvider";

// Importing API
import { documentApi, authApi, invitationApi } from "../../api";

// Importing Store
import { useAuthStore } from "../../Store/useAuthStore";

// Importing Utils
import { formatDate, getInitials, getUserColor } from "../../Utils";

// Importing Components
import ShareModal from "../../components/ShareLinkPanel";
import HistoryPanel from "../../components/sidebar/HistoryPanel";
import MembersPanel from "../../components/sidebar/MembersPanel";
import CommentsPanel from "../../components/sidebar/CommentsPanel";

// Declaring Types
type Panel = "members" | "comments" | "history" | null;
interface FloatingBtn { top: number; left: number; }
type SaveStatus = "saved" | "saving" | "error" | "idle";

export default function Dashboard() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, logout } = useAuthStore();

  // ── Document list state ─────────────────────────────────────────────
  const [docs, setDocs] = useState<Document[]>([]);
  const [docsLoading, setDocsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // ── Active document / editor state ──────────────────────────────────
  const activeDocId = searchParams.get("doc") || null;
  const [activeDoc, setActiveDoc] = useState<any>(null);
  const [docRole, setDocRole] = useState<string>("owner");
  const [docLoading, setDocLoading] = useState(false);
  const [panel, setPanel] = useState<Panel>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [titleEdit, setTitleEdit] = useState(false);
  const [titleVal, setTitleVal] = useState("");
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [historyPreview, setHistoryPreview] = useState<string | null>(null);
  const [floatingBtn, setFloatingBtn] = useState<FloatingBtn | null>(null);
  const providerRef = useRef<SocketIOProvider | null>(null);
  const ydocRef = useRef<Y.Doc | null>(null);
  const isPreviewingRef = useRef(false);
  const editorInitializedRef = useRef(false);

  // ── Invitation inbox state ──────────────────────────────────────────
  interface Invitation {
    invitationId: string;
    documentId: string;
    documentTitle: string;
    inviterName: string;
    inviterEmail: string;
    role: string;
    createdAt: string;
  }
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [inboxOpen, setInboxOpen] = useState(false);
  const [invLoading, setInvLoading] = useState<string | null>(null);

  const [editorReady, setEditorReady] = useState(false);
  const editor = useEditor(
    {
      extensions: [
        StarterKit.configure({
          undoRedo: false, // Yjs handles undo/redo
          link: { openOnClick: false },
        }),
        Placeholder.configure({ placeholder: "Start writing your document…" }),
        TextAlign.configure({ types: ["heading", "paragraph"] }),
        Highlight.configure({ multicolor: true }),
        CommentHighlight,

        ...(ydocRef.current
          ? [Collaboration.configure({ document: ydocRef.current })]
          : []),
        ...(providerRef.current
          ? [
              CollabCursor.configure({
                provider: providerRef.current as any,
                user: {
                  name: user?.name || "Anonymous",
                  color: getUserColor(user?.userId || "anon"),
                  userId: user?.userId || "",
                },
              }),
            ]
          : []),
      ],
      editable: true,
      editorProps: { attributes: { spellcheck: "true" } },
      onSelectionUpdate: ({ editor: ed }) => {
        const { from, to } = ed.state.selection;
        if (to - from > 0 && !ed.state.selection.empty) {
          const coords = ed.view.coordsAtPos(from);
          const editorRect = ed.view.dom.closest('.editor-paper')?.getBoundingClientRect();
          if (editorRect) {
            setFloatingBtn({
              top: coords.top - editorRect.top - 36,
              left: coords.left - editorRect.left,
            });
          }
        } else {
          setFloatingBtn(null);
        }
      },
    },
    [editorReady],
  );

  const fetchDocs = useCallback(async () => {
    try {
      const res = await documentApi.getAll();
      setDocs(res.data.data || []);
    } catch {
      toast.error("Failed to load documents");
    } finally {
      setDocsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDocs();
  }, [fetchDocs]);

  useEffect(() => {
    if (!activeDocId) return;

    if (providerRef.current) {
      providerRef.current.destroy();
      providerRef.current = null;
    }
    if (ydocRef.current) {
      ydocRef.current.destroy();
      ydocRef.current = null;
    }

    setDocLoading(true);
    setActiveDoc(null);
    setSaveStatus("idle");
    setOnlineUsers([]);
    setHistoryPreview(null);
    isPreviewingRef.current = false;
    editorInitializedRef.current = false;

    documentApi
      .getById(activeDocId)
      .then((res) => {
        const data = res.data.data;
        setActiveDoc(data);
        setDocRole(data.role);
        setTitleVal(data.title);

        const canEdit = data.role === "owner" || data.role === "editor";

        const ydoc = new Y.Doc();
        ydocRef.current = ydoc;
        const p = new SocketIOProvider(activeDocId, ydoc);
        providerRef.current = p;

        if (user) {
          p.setAwarenessField("user", {
            name: user.name,
            color: getUserColor(user.userId),
            userId: user.userId,
          });
        }

        p.socket.on("save-status", ({ status }: { status: string }) => {
          setSaveStatus(
            status === "saved"
              ? "saved"
              : status === "saving"
                ? "saving"
                : "error",
          );
        });

        p.socket.on("room-users", (users: OnlineUser[]) => {
          const seen = new Set<string>();
          const unique = users.filter((u) => {
            if (u.userId === user?.userId) return false;
            if (seen.has(u.userId)) return false;
            seen.add(u.userId);
            return true;
          });
          setOnlineUsers(unique);
        });

        p.socket.on("user-joined", (u: OnlineUser) => {
          if (u.userId === user?.userId) return;
          setOnlineUsers((prev) => {
            if (prev.find((x) => x.userId === u.userId)) return prev;
            return [...prev, u];
          });
        });

        p.socket.on("user-left", ({ userId: uid }: { userId: string }) => {
          setOnlineUsers((prev) => prev.filter((x) => x.userId !== uid));
        });

        editorInitializedRef.current = true;
        setEditorReady((v) => !v);

        setTimeout(() => {
          if (editor) editor.setEditable(canEdit);
        }, 100);

        // Wait for Yjs sync before removing the loading screen
        // Provider emits 'synced' after applying state — safer than socket.once('sync-init')
        const syncTimeout = setTimeout(() => {
          setDocLoading(false);
        }, 2000); // fallback for new/empty docs or slow connections

        p.once("synced", () => {
          clearTimeout(syncTimeout);
          // Brief delay so TipTap renders the Yjs content before loader disappears
          setTimeout(() => setDocLoading(false), 80);
        });

      })
      .catch(() => {
        toast.error("Failed to load document");
        setSearchParams({});
        setDocLoading(false);
      });

    return () => {
      if (providerRef.current) {
        providerRef.current.destroy();
        providerRef.current = null;
      }
      if (ydocRef.current) {
        ydocRef.current.destroy();
        ydocRef.current = null;
      }
    };
  }, [activeDocId]);

  const handleHistoryPreview = useCallback((content: string | null) => {
    isPreviewingRef.current = content !== null;
    setHistoryPreview(content);
  }, []);

  const stripHtml = useCallback((html: string): string => {
    const withNewlines = html
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>/gi, "\n")
      .replace(/<\/div>/gi, "\n")
      .replace(/<\/h[1-6]>/gi, "\n")
      .replace(/<\/li>/gi, "\n");

    const text = withNewlines.replace(/<[^>]*>/g, "");

    const txt = document.createElement("textarea");
    txt.innerHTML = text;
    return txt.value.trim();
  }, []);

  const computeWordDiff = useCallback(
    (
      historical: string,
      current: string,
    ): Array<{ type: "kept" | "removed" | "added"; text: string }> => {
      const cleanHistorical = stripHtml(historical);
      const cleanCurrent = stripHtml(current);

      const aLines = cleanHistorical.split("\n").filter(Boolean);
      const bLines = cleanCurrent.split("\n").filter(Boolean);

      if (cleanHistorical === cleanCurrent) {
        return [{ type: "kept", text: cleanCurrent }];
      }

      let prefixLen = 0;
      while (
        prefixLen < aLines.length &&
        prefixLen < bLines.length &&
        aLines[prefixLen] === bLines[prefixLen]
      ) {
        prefixLen++;
      }

      let suffixLen = 0;
      while (
        suffixLen < aLines.length - prefixLen &&
        suffixLen < bLines.length - prefixLen &&
        aLines[aLines.length - 1 - suffixLen] ===
          bLines[bLines.length - 1 - suffixLen]
      ) {
        suffixLen++;
      }

      const result: Array<{
        type: "kept" | "removed" | "added";
        text: string;
      }> = [];

      if (prefixLen > 0) {
        result.push({
          type: "kept",
          text: aLines.slice(0, prefixLen).join("\n"),
        });
      }

      const aMiddle = aLines.slice(prefixLen, aLines.length - suffixLen);
      if (aMiddle.length > 0) {
        result.push({ type: "removed", text: aMiddle.join("\n") });
      }

      const bMiddle = bLines.slice(prefixLen, bLines.length - suffixLen);
      if (bMiddle.length > 0) {
        result.push({ type: "added", text: bMiddle.join("\n") });
      }

      if (suffixLen > 0) {
        result.push({
          type: "kept",
          text: aLines.slice(aLines.length - suffixLen).join("\n"),
        });
      }

      if (result.length === 0) {
        return [{ type: "kept", text: "" }];
      }

      return result;
    },
    [stripHtml],
  );

  const diffParts = historyPreview
    ? computeWordDiff(historyPreview, editor?.getHTML() ?? "")
    : null;

  const selectDoc = (docId: string) => {
    setPanel(null);
    setSearchParams({ doc: docId });
    if (window.innerWidth < 768) setSidebarOpen(false);
  };

  const handleCreate = async () => {
    setCreating(true);
    try {
      const res = await documentApi.create({ title: "Untitled Document" });
      const newDoc = res.data.data;
      await fetchDocs();
      selectDoc(newDoc.documentId);
    } catch {
      toast.error("Failed to create document");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (docId: string) => {
    try {
      await documentApi.delete(docId);
      setDocs((d) => d.filter((x) => x.documentId !== docId));
      if (activeDocId === docId) {
        setSearchParams({});
        setActiveDoc(null);
        editor?.commands.clearContent();
      }
      toast.success("Document deleted");
    } catch {
      toast.error("Failed to delete");
    } finally {
      setDeleteConfirm(null);
    }
  };

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch {}
    logout();
    navigate("/");
  };

  const fetchInvitations = useCallback(async () => {
    try {
      const res = await invitationApi.getPending();
      setInvitations(res.data.data || []);
    } catch {}
  }, []);

  const handleAcceptInvite = useCallback(async (invitationId: string) => {
    setInvLoading(invitationId);
    try {
      const res = await invitationApi.accept(invitationId);
      toast.success(res.data.message || "Invitation accepted!");
      setInvitations((prev) =>
        prev.filter((i) => i.invitationId !== invitationId),
      );

      fetchDocs();

      const docId = res.data.data?.documentId;
      if (docId) setSearchParams({ doc: docId });
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to accept");
    } finally {
      setInvLoading(null);
    }
  }, []);

  const handleDeclineInvite = useCallback(async (invitationId: string) => {
    setInvLoading(invitationId);
    try {
      await invitationApi.decline(invitationId);
      toast.success("Invitation declined");
      setInvitations((prev) =>
        prev.filter((i) => i.invitationId !== invitationId),
      );
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to decline");
    } finally {
      setInvLoading(null);
    }
  }, []);

 
  useEffect(() => {
    fetchInvitations();
    const t = setInterval(fetchInvitations, 30_000);
    return () => clearInterval(t);
  }, [fetchInvitations]);

  const saveTitle = useCallback(async () => {
    if (!activeDocId || !titleVal.trim()) return;
    try {
      await documentApi.update(activeDocId, { title: titleVal });
      setActiveDoc((d: any) => ({ ...d, title: titleVal }));
      setDocs((ds) =>
        ds.map((d) =>
          d.documentId === activeDocId ? { ...d, title: titleVal } : d,
        ),
      );
    } catch {
      toast.error("Failed to update title");
    }
    setTitleEdit(false);
  }, [activeDocId, titleVal]);

  const togglePanel = (p: Panel) => setPanel((cur) => (cur === p ? null : p));
  const canEdit = docRole === "owner" || docRole === "editor";
  const filtered = docs.filter((d) =>
    d.title.toLowerCase().includes(search.toLowerCase()),
  );

  const roleColor: Record<string, string> = {
    owner: "bg-[rgba(79,70,229,0.08)] text-[#4F46E5]",
    editor: "bg-[rgba(16,185,129,0.08)] text-[#059669]",
    viewer: "bg-[rgba(100,116,139,0.08)] text-[#64748B]",
  };

  return (
    <div className='h-screen flex flex-col bg-[#F8FAFC] text-[#0F172A] overflow-hidden'>
      <header className='h-14 border-b border-black/[0.06] bg-white flex items-center gap-2 px-3 flex-shrink-0 z-40'>
        {/* Sidebar toggle */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className='p-2 rounded-xl text-[#94A3B8] hover:text-[#0F172A] hover:bg-black/[0.04] transition-all'
          title={sidebarOpen ? "Hide sidebar" : "Show sidebar"}>
          {sidebarOpen ? <ChevronLeft size={18} /> : <FileText size={18} />}
        </button>

        {/* Logo */}
        <div className='flex items-center text-lg font-bold mr-3'>
          <span>Collab</span>
          <span className='text-blue-600'>Edit</span>
        </div>

        {/* Document title (when doc is open) */}
        {activeDoc && (
          <div className='flex-1 min-w-0 flex items-center gap-3'>
            {titleEdit ? (
              <input
                autoFocus
                value={titleVal}
                onChange={(e) => setTitleVal(e.target.value)}
                onBlur={saveTitle}
                onKeyDown={(e) => {
                  if (e.key === "Enter") saveTitle();
                  if (e.key === "Escape") setTitleEdit(false);
                }}
                className='bg-transparent border-b-2 border-[#4F46E5] outline-none text-sm font-semibold w-full max-w-xs px-1 text-[#0F172A]'
              />
            ) : (
              <button
                onClick={() => canEdit && setTitleEdit(true)}
                className={`text-sm font-semibold truncate max-w-xs text-left text-[#0F172A] ${canEdit ? "hover:text-[#64748B] cursor-text" : "cursor-default"}`}>
                {activeDoc.title}
              </button>
            )}

            {/* Save status */}
            <div className='flex items-center gap-1 text-xs text-[#94A3B8] flex-shrink-0'>
              {saveStatus === "saving" && (
                <>
                  <Loader2 size={12} className='animate-spin-custom' /> Saving…
                </>
              )}
              {saveStatus === "saved" && (
                <>
                  <CheckCircle size={12} className='text-[#10B981]' />
                  <span className='text-[#10B981]'>Saved</span>
                </>
              )}
              {saveStatus === "error" && (
                <>
                  <AlertCircle size={12} className='text-[#EF4444]' />
                  <span className='text-[#EF4444]'>Error</span>
                </>
              )}
            </div>
          </div>
        )}

        {!activeDoc && <div className='flex-1' />}

        {/* History preview indicator */}
        {historyPreview && (
          <div className='flex items-center gap-1.5 px-3 py-1 rounded-full bg-[rgba(245,158,11,0.1)] text-[#D97706] text-xs font-medium flex-shrink-0'>
            <History size={12} />
            Preview Mode
          </div>
        )}

        {/* ── Right side: Online avatars + Share + Panels ── */}
        <div className='flex items-center gap-1 flex-shrink-0'>
          {/* Online user avatars (Google Docs-style) */}
          {activeDoc && onlineUsers.length > 0 && (
            <div className='flex items-center mr-2'>
              {onlineUsers.slice(0, 4).map((u, i) => (
                <div
                  key={u.userId}
                  className='relative group'
                  style={{ marginLeft: i > 0 ? -8 : 0 }}>
                  {u.profilePicture ? (
                    <img
                      src={u.profilePicture}
                      alt={u.name}
                      className='w-8 h-8 rounded-full border-2 border-white object-cover shadow-sm'
                    />
                  ) : (
                    <div
                      className='w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-bold text-white shadow-sm'
                      style={{ background: getUserColor(u.userId) }}>
                      {getInitials(u.name)}
                    </div>
                  )}
                  {/* Online indicator dot */}
                  <span className='absolute bottom-0 right-0 w-2.5 h-2.5 bg-[#22C55E] rounded-full border-2 border-white' />
                  {/* Tooltip */}
                  <div className='absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2.5 py-1.5 bg-[#1E293B] text-white text-[10px] rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-lg'>
                    {u.name}
                    <div className='absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-[#1E293B] rotate-45' />
                  </div>
                </div>
              ))}
              {onlineUsers.length > 4 && (
                <div
                  className='w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-bold bg-[#E2E8F0] text-[#64748B] shadow-sm'
                  style={{ marginLeft: -8 }}>
                  +{onlineUsers.length - 4}
                </div>
              )}
            </div>
          )}

          {/* Share button */}
          {activeDoc && (
            <button
              onClick={() => setShareOpen(true)}
              className='hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-[rgba(79,70,229,0.06)] text-[#4F46E5] border border-[rgba(79,70,229,0.12)] hover:bg-[rgba(79,70,229,0.12)] transition-all mr-1'>
              <Share2 size={13} /> Share
            </button>
          )}

          {/* Panel buttons (no Activity — replaced by avatars) */}
          {activeDoc && (
            <>
              {[
                { icon: MessageSquare, key: "comments", label: "Comments" },
                { icon: Users, key: "members", label: "Members" },
                { icon: History, key: "history", label: "History" },
              ].map(({ icon: Icon, key, label }) => (
                <button
                  key={key}
                  onClick={() => togglePanel(key as Panel)}
                  title={label}
                  className={`p-2 rounded-xl transition-all ${panel === key ? "bg-[rgba(79,70,229,0.08)] text-[#4F46E5]" : "text-[#94A3B8] hover:text-[#0F172A] hover:bg-black/[0.04]"}`}>
                  <Icon size={17} />
                </button>
              ))}
            </>
          )}

          {/* Separator */}
          {activeDoc && <div className='w-px h-6 bg-black/[0.06] mx-1' />}

          {/* Notification bell */}
          <div className='relative'>
            <button
              onClick={() => {
                setInboxOpen(!inboxOpen);
                fetchInvitations();
              }}
              className='p-2 rounded-xl text-[#94A3B8] hover:text-[#0F172A] hover:bg-black/[0.04] transition-all relative'
              title='Notifications'>
              <Bell size={17} />
              {invitations.length > 0 && (
                <span className='absolute top-1 right-1 w-4 h-4 rounded-full bg-[#EF4444] text-white text-[9px] font-bold flex items-center justify-center animate-pulse'>
                  {invitations.length}
                </span>
              )}
            </button>

            {/* Inbox dropdown */}
            {inboxOpen && (
              <>
                <div
                  className='fixed inset-0 z-40'
                  onClick={() => setInboxOpen(false)}
                />
                <div className='absolute right-0 top-full mt-2 w-80 max-w-[90vw] bg-white border border-black/[0.08] rounded-2xl shadow-[0_8px_48px_rgba(0,0,0,0.12)] z-50 overflow-hidden animate-slide-up'>
                  <div className='px-4 py-3 border-b border-black/[0.06] flex items-center justify-between'>
                    <h3 className='font-semibold text-sm text-[#0F172A]'>
                      Invitations
                    </h3>
                    <button
                      onClick={() => setInboxOpen(false)}
                      className='p-1 rounded-lg text-[#94A3B8] hover:text-[#0F172A] transition-colors'>
                      <X size={14} />
                    </button>
                  </div>
                  <div className='max-h-72 overflow-y-auto'>
                    {invitations.length === 0 ? (
                      <div className='px-4 py-8 text-center'>
                        <Bell
                          size={24}
                          className='mx-auto mb-2 text-[#CBD5E1]'
                        />
                        <p className='text-sm text-[#94A3B8]'>
                          No pending invitations
                        </p>
                      </div>
                    ) : (
                      invitations.map((inv) => (
                        <div
                          key={inv.invitationId}
                          className='px-4 py-3 border-b border-black/[0.04] last:border-0 hover:bg-[#F8FAFC] transition-colors'>
                          <p className='text-sm font-medium text-[#0F172A] truncate'>
                            {inv.documentTitle}
                          </p>
                          <p className='text-xs text-[#64748B] mt-0.5'>
                            <span className='font-medium'>
                              {inv.inviterName}
                            </span>{" "}
                            invited you as{" "}
                            <span className='font-medium capitalize text-[#4F46E5]'>
                              {inv.role}
                            </span>
                          </p>
                          <div className='flex gap-2 mt-2'>
                            <button
                              disabled={invLoading === inv.invitationId}
                              onClick={() =>
                                handleAcceptInvite(inv.invitationId)
                              }
                              className='flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-medium bg-[#4F46E5] text-white hover:bg-[#4338CA] disabled:opacity-50 transition-all'>
                              {invLoading === inv.invitationId ? (
                                <Loader2 size={12} className='animate-spin' />
                              ) : (
                                <Check size={12} />
                              )}
                              Accept
                            </button>
                            <button
                              disabled={invLoading === inv.invitationId}
                              onClick={() =>
                                handleDeclineInvite(inv.invitationId)
                              }
                              className='flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-medium bg-[#F1F5F9] text-[#64748B] hover:bg-[#E2E8F0] disabled:opacity-50 transition-all'>
                              <X size={12} />
                              Decline
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* User pill */}
          <div className='hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-xl bg-[#F8FAFC] border border-black/[0.06]'>
            <div className='w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white bg-gradient-to-br from-[#4F46E5] to-[#06B6D4]'>
              {getInitials(user?.name || "U")}
            </div>
            <span className='text-xs font-medium text-[#0F172A] truncate max-w-[80px]'>
              {user?.name}
            </span>
          </div>
          <button
            onClick={handleLogout}
            className='p-2 rounded-xl text-[#94A3B8] hover:text-[#0F172A] hover:bg-black/[0.04] transition-all'
            title='Sign out'>
            <LogOut size={15} />
          </button>
        </div>
      </header>

      {/* ═══════════════════════ BODY ═══════════════════════ */}
      <div className='flex flex-1 overflow-hidden'>
        {/* Mobile backdrop when sidebar is open */}
        {sidebarOpen && (
          <div
            className='fixed inset-0 bg-black/20 z-20 md:hidden'
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* ─── Left Sidebar ─── */}
        <aside
          className={`${sidebarOpen ? "w-72 translate-x-0" : "w-0 -translate-x-full md:translate-x-0"} fixed md:relative z-30 md:z-auto top-0 left-0 h-full md:h-auto shrink-0 border-r border-black/[0.06] bg-white flex flex-col transition-all duration-200 overflow-hidden`}>
          <div className='p-3 flex flex-col gap-2 flex-shrink-0'>
            <button
              onClick={handleCreate}
              disabled={creating}
              className='w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm bg-[#4F46E5] text-white shadow-[0_2px_12px_rgba(79,70,229,0.25)] hover:bg-[#4338CA] disabled:opacity-50 transition-all'>
              {creating ? (
                <span className='w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin-custom' />
              ) : (
                <Plus size={15} />
              )}
              New Document
            </button>
            <div className='relative'>
              <Search
                size={14}
                className='absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]'
              />
              <input
                type='text'
                placeholder='Search…'
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className='w-full pl-8 pr-3 py-2 bg-[#F8FAFC] border border-black/[0.06] rounded-xl text-xs text-[#0F172A] placeholder-[#94A3B8] outline-none focus:border-[#4F46E5] transition-all'
              />
            </div>
          </div>

          <div className='flex-1 overflow-y-auto px-2 pb-3'>
            {docsLoading && (
              <div className='flex justify-center py-10'>
                <span className='w-6 h-6 border-2 border-black/[0.08] border-t-[#4F46E5] rounded-full animate-spin-custom' />
              </div>
            )}
            {!docsLoading && filtered.length === 0 && (
              <div className='text-center py-10 px-3'>
                <FileText size={28} className='text-[#94A3B8] mx-auto mb-2' />
                <p className='text-xs text-[#64748B]'>
                  {search ? "No results found" : "No documents yet"}
                </p>
              </div>
            )}
            {!docsLoading &&
              filtered.map((doc) => (
                <div
                  key={doc.documentId}
                  onClick={() => selectDoc(doc.documentId)}
                  className={`group flex items-start gap-2.5 px-3 py-2.5 rounded-xl cursor-pointer transition-all mb-0.5
                  ${
                    activeDocId === doc.documentId
                      ? "bg-[rgba(79,70,229,0.08)] border border-[rgba(79,70,229,0.15)]"
                      : "hover:bg-[#F8FAFC] border border-transparent"
                  }`}>
                  <FileText
                    size={16}
                    className={`mt-0.5 flex-shrink-0 ${activeDocId === doc.documentId ? "text-[#4F46E5]" : "text-[#94A3B8]"}`}
                  />
                  <div className='flex-1 min-w-0'>
                    <p
                      className={`text-sm font-medium truncate ${activeDocId === doc.documentId ? "text-[#4F46E5]" : "text-[#0F172A]"}`}>
                      {doc.title}
                    </p>
                    <div className='flex items-center gap-2 mt-0.5'>
                      <span
                        className={`text-[9px] font-semibold uppercase tracking-wide px-1.5 py-0 rounded-full ${roleColor[doc.role] || roleColor.viewer}`}>
                        {doc.role}
                      </span>
                      <span className='text-[10px] text-[#94A3B8] flex items-center gap-1'>
                        <Clock size={9} /> {formatDate(doc.updatedAt)}
                      </span>
                    </div>
                  </div>
                  {doc.role === "owner" && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteConfirm(doc.documentId);
                      }}
                      className='opacity-0 group-hover:opacity-100 p-1 rounded-lg text-[#94A3B8] hover:text-[#EF4444] hover:bg-[rgba(239,68,68,0.06)] transition-all flex-shrink-0 mt-0.5'>
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              ))}
          </div>
        </aside>

        {/* Main Editor Area */}
        <main className='flex-1 flex flex-col overflow-hidden'>
          {/* fixed strip between the two sidebars, right below header */}
          {activeDoc && canEdit && editor && !historyPreview && (
            <div className='editor-toolbar-bar'>
              {[
                {
                  action: () => editor.chain().focus().toggleBold().run(),
                  icon: Bold,
                  isActive: editor.isActive("bold"),
                  title: "Bold",
                },
                {
                  action: () => editor.chain().focus().toggleItalic().run(),
                  icon: Italic,
                  isActive: editor.isActive("italic"),
                  title: "Italic",
                },
                {
                  action: () => editor.chain().focus().toggleUnderline().run(),
                  icon: UnderlineIcon,
                  isActive: editor.isActive("underline"),
                  title: "Underline",
                },
                {
                  action: () => editor.chain().focus().toggleStrike().run(),
                  icon: Strikethrough,
                  isActive: editor.isActive("strike"),
                  title: "Strike",
                },
              ].map(({ action, icon: Icon, isActive, title }) => (
                <button
                  key={title}
                  onClick={action}
                  title={title}
                  className={`toolbar-btn ${isActive ? "active" : ""}`}>
                  <Icon size={14} />
                </button>
              ))}
              <div className='toolbar-sep' />
              {[
                {
                  action: () =>
                    editor.chain().focus().toggleHeading({ level: 1 }).run(),
                  icon: Heading1,
                  isActive: editor.isActive("heading", { level: 1 }),
                  title: "H1",
                },
                {
                  action: () =>
                    editor.chain().focus().toggleHeading({ level: 2 }).run(),
                  icon: Heading2,
                  isActive: editor.isActive("heading", { level: 2 }),
                  title: "H2",
                },
              ].map(({ action, icon: Icon, isActive, title }) => (
                <button
                  key={title}
                  onClick={action}
                  title={title}
                  className={`toolbar-btn ${isActive ? "active" : ""}`}>
                  <Icon size={14} />
                </button>
              ))}
              <div className='toolbar-sep' />
              {[
                {
                  action: () => editor.chain().focus().toggleBulletList().run(),
                  icon: List,
                  isActive: editor.isActive("bulletList"),
                  title: "Bullets",
                },
                {
                  action: () =>
                    editor.chain().focus().toggleOrderedList().run(),
                  icon: ListOrdered,
                  isActive: editor.isActive("orderedList"),
                  title: "Numbers",
                },
                {
                  action: () => editor.chain().focus().toggleBlockquote().run(),
                  icon: Quote,
                  isActive: editor.isActive("blockquote"),
                  title: "Quote",
                },
              ].map(({ action, icon: Icon, isActive, title }) => (
                <button
                  key={title}
                  onClick={action}
                  title={title}
                  className={`toolbar-btn ${isActive ? "active" : ""}`}>
                  <Icon size={14} />
                </button>
              ))}
              <div className='toolbar-sep' />
              {[
                {
                  action: () =>
                    editor.chain().focus().setTextAlign("left").run(),
                  icon: AlignLeft,
                  isActive: editor.isActive({ textAlign: "left" }),
                  title: "Left",
                },
                {
                  action: () =>
                    editor.chain().focus().setTextAlign("center").run(),
                  icon: AlignCenter,
                  isActive: editor.isActive({ textAlign: "center" }),
                  title: "Center",
                },
                {
                  action: () =>
                    editor.chain().focus().setTextAlign("right").run(),
                  icon: AlignRight,
                  isActive: editor.isActive({ textAlign: "right" }),
                  title: "Right",
                },
              ].map(({ action, icon: Icon, isActive, title }) => (
                <button
                  key={title}
                  onClick={action}
                  title={title}
                  className={`toolbar-btn ${isActive ? "active" : ""}`}>
                  <Icon size={14} />
                </button>
              ))}
              <div className='toolbar-sep' />
              <button
                onClick={() => editor.chain().focus().toggleHighlight().run()}
                title='Highlight'
                className={`toolbar-btn ${editor.isActive("highlight") ? "active" : ""}`}>
                <Highlighter size={14} />
              </button>
              <button
                onClick={() => editor.chain().focus().setHorizontalRule().run()}
                title='Divider'
                className='toolbar-btn'>
                <Minus size={14} />
              </button>
            </div>
          )}

          {/* History preview banner */}
          {historyPreview && (
            <div className='editor-toolbar-bar editor-history-banner'>
              <History size={12} />
              Previewing older version — move away from history panel to return
            </div>
          )}

          {/* Scrollable canvas area  */}
          <div className='flex-1 overflow-y-auto editor-canvas'>
            {!activeDocId && !docLoading && (
              <div className='flex flex-col items-center justify-center flex-1 gap-5 text-center px-6'>
                <div className='w-20 h-20 rounded-3xl bg-gradient-to-br from-primary-dim to-[rgba(6,182,212,0.06)] border border-[rgba(79,70,229,0.1)] flex items-center justify-center text-primary'>
                  <FileText size={36} />
                </div>
                <div>
                  <h2 className='text-2xl font-bold text-text mb-1.5'>
                    Select a document
                  </h2>
                  <p className='text-sm text-text-2 max-w-xs'>
                    Choose a document from the sidebar or create a new one to
                    start writing.
                  </p>
                </div>
                <button
                  onClick={handleCreate}
                  disabled={creating}
                  className='inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm bg-primary text-white shadow-[0_2px_12px_rgba(79,70,229,0.25)] hover:bg-primary-hover disabled:opacity-50 transition-all'>
                  {creating ? (
                    <span className='w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin-custom' />
                  ) : (
                    <Plus size={15} />
                  )}
                  New Document
                </button>
              </div>
            )}

            {docLoading && (
              <div className='flex items-center justify-center flex-1'>
                <div className='flex flex-col items-center gap-3'>
                  <span className='w-8 h-8 border-2 border-black/8 border-t-primary rounded-full animate-spin-custom' />
                  <p className='text-sm text-text-2'>Loading document…</p>
                </div>
              </div>
            )}

            {activeDocId && activeDoc && !docLoading && editor && (
              <div className='editor-page-wrapper'>
                {onlineUsers.length > 0 && (
                  <div className='editor-user-bars'>
                    {onlineUsers.map((u) => (
                      <div
                        key={u.userId}
                        className='editor-user-bar'
                        style={{ background: getUserColor(u.userId) }}
                        title={u.name}
                      />
                    ))}
                  </div>
                )}

                {/* Paper */}
                <div className='editor-paper' style={{ position: "relative" }}>
                  {/* Floating comment button */}
                  {floatingBtn && canEdit && !historyPreview && (
                    <button
                      className='comment-float-btn'
                      style={{ top: floatingBtn.top, left: floatingBtn.left }}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setPanel('comments');
                        setFloatingBtn(null);
                      }}
                    >
                      <MessageSquare size={12} /> Comment
                    </button>
                  )}
                  {historyPreview && diffParts ? (
                    <div
                      className='ProseMirror history-diff'
                      aria-readonly='true'>
                      <div className='diff-legend'>
                        <span className='diff-legend-removed'>■ Removed</span>
                        <span className='diff-legend-added'>■ Added since</span>
                      </div>
                      {diffParts.map(
                        (part: { type: string; text: string }, idx: number) => (
                          <p
                            key={idx}
                            style={{ whiteSpace: "pre-wrap", margin: "2px 0" }}>
                            {part.type === "removed" && (
                              <span className='diff-removed'>{part.text}</span>
                            )}
                            {part.type === "added" && (
                              <span className='diff-added'>{part.text}</span>
                            )}
                            {part.type === "kept" && <span>{part.text}</span>}
                          </p>
                        ),
                      )}
                    </div>
                  ) : (
                    <EditorContent editor={editor} />
                  )}
                </div>
              </div>
            )}
          </div>
        </main>

        {panel && activeDocId && (
          <>
            <div
              className='fixed inset-0 bg-black/20 z-20 lg:hidden'
              onClick={() => {
                setPanel(null);
                handleHistoryPreview(null);
              }}
            />
            <aside className='fixed right-0 top-0 h-full w-80 max-w-[85vw] z-30 lg:relative lg:z-auto shrink-0 border-l border-black/6 bg-white flex flex-col overflow-hidden shadow-[-4px_0_24px_rgba(0,0,0,0.08)] lg:shadow-none'>
              <div className='flex items-center justify-between px-4 py-3 border-b border-black/6 shrink-0'>
                <h2 className='font-semibold text-sm capitalize text-text'>
                  {panel}
                </h2>
                <button
                  onClick={() => {
                    setPanel(null);
                    handleHistoryPreview(null);
                  }}
                  className='p-1 rounded-lg text-text-3 hover:text-text hover:bg-black/4 transition-all'>
                  <X size={16} />
                </button>
              </div>
              <div className='flex-1 overflow-y-auto'>
                {panel === "members" && (
                  <MembersPanel documentId={activeDocId} role={docRole} />
                )}
                {panel === "comments" && (
                  <CommentsPanel documentId={activeDocId} role={docRole} editor={editor} />
                )}
                {panel === "history" && (
                  <HistoryPanel
                    documentId={activeDocId}
                    role={docRole}
                    onPreview={handleHistoryPreview}
                  />
                )}
              </div>
            </aside>
          </>
        )}
      </div>

      {shareOpen && activeDocId && (
        <ShareModal
          documentId={activeDocId}
          onClose={() => setShareOpen(false)}
        />
      )}

      {deleteConfirm && (
        <div className='fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/20 backdrop-blur-sm animate-fade-in'>
          <div className='bg-white border border-black/8 rounded-2xl p-7 max-w-sm w-full shadow-[0_8px_48px_rgba(0,0,0,0.1)] animate-slide-up'>
            <div className='w-12 h-12 rounded-xl bg-[rgba(239,68,68,0.06)] flex items-center justify-center text-danger mb-4'>
              <Trash2 size={22} />
            </div>
            <h3 className='font-bold text-lg mb-2 text-text'>
              Delete document?
            </h3>
            <p className='text-sm text-text-2 mb-6'>
              This action is permanent and will delete all history, comments,
              and members.
            </p>
            <div className='flex gap-3'>
              <button
                onClick={() => setDeleteConfirm(null)}
                className='flex-1 py-2.5 rounded-xl text-sm font-medium bg-bg border border-black/8 hover:bg-surface-2 text-text transition-all'>
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className='flex-1 py-2.5 rounded-xl text-sm font-medium bg-[rgba(239,68,68,0.08)] text-danger border border-[rgba(239,68,68,0.15)] hover:bg-[rgba(239,68,68,0.14)] transition-all'>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
