import { useState,type JSXElementConstructor, type Key, type ReactElement, type ReactNode, type ReactPortal, type SetStateAction } from "react";
import {
  Plus, FileText, Trash2, Search, Clock,
  Share2, Users, History, MessageSquare,
  Bold, Italic, Strikethrough,
  AlignLeft, AlignCenter, AlignRight, Highlighter,
  Heading1, Heading2, List, ListOrdered, Quote, Minus,
  CheckCircle, AlertCircle, Loader2, ChevronLeft, X, Bell, Check,
  Underline as UnderlineIcon, RotateCcw, UserPlus,
  Eye, Edit3, Crown, Link, Image
} from "lucide-react";

/* ─── Mock Data ──────────────────────────────────────────────────────── */
const MOCK_DOCS = [
  { documentId: "1", title: "Product Roadmap Q2 2026", role: "owner", updatedAt: "2026-04-03T10:00:00Z" },
  { documentId: "2", title: "Engineering Design Doc", role: "editor", updatedAt: "2026-04-02T14:30:00Z" },
  { documentId: "3", title: "Marketing Brief — Launch", role: "viewer", updatedAt: "2026-04-01T09:00:00Z" },
  { documentId: "4", title: "Interview Rubric v3", role: "owner", updatedAt: "2026-03-31T18:20:00Z" },
  { documentId: "5", title: "OKR Tracker 2026", role: "editor", updatedAt: "2026-03-30T11:00:00Z" },
];

const MOCK_CONTENT = {
  "1": `<h1>Product Roadmap Q2 2026</h1><p>This document outlines the key initiatives for Q2. Our primary focus areas are <strong>performance improvements</strong>, new feature rollouts, and infrastructure reliability.</p><h2>Key Milestones</h2><p>We will be shipping the new collaboration layer in mid-April, followed by the redesigned dashboard in May. The mobile application enters beta in late June.</p><blockquote>Speed is not just a feature — it's the product.</blockquote><p>Each team should align their sprint goals with the roadmap by <strong>April 10th</strong>. Please review and comment on any dependencies below.</p>`,
  "2": `<h1>Engineering Design Doc</h1><p>This document covers the architecture decisions for the new <strong>real-time sync engine</strong>. We evaluated several approaches before settling on CRDT-based synchronisation using Yjs.</p><h2>Architecture Overview</h2><p>The backend consists of a Socket.IO server that maintains in-memory Y.Doc instances per active document. State is persisted to MongoDB on a debounced schedule every 3 seconds.</p>`,
  "3": `<h1>Marketing Brief — Launch</h1><p>Audience: <strong>Product teams</strong> at Series A–C startups. We're positioning  as the <em>thinking layer</em> for distributed teams — where ideas become decisions.</p><h2>Messaging Pillars</h2><p>Clarity, speed, and trust. Every message should reinforce that  reduces the friction between thinking and shipping.</p>`,
  "4": `<h1>Interview Rubric v3</h1><p>This rubric applies to all engineering interviews at the Senior and above level. Interviewers should score candidates across five dimensions.</p><h2>Dimensions</h2><p><strong>1. Problem decomposition</strong> — Can the candidate break down ambiguous problems into tractable sub-problems?</p><p><strong>2. Communication</strong> — Do they explain their thinking clearly under pressure?</p>`,
  "5": `<h1>OKR Tracker 2026</h1><p>Company-level objectives and key results for fiscal year 2026. Updated monthly by the leadership team.</p><h2>O1 — Grow to 50,000 active workspaces</h2><p>KR1: Reach 50k by end of Q4. KR2: Maintain 40%+ monthly retention. KR3: Reduce time-to-first-doc under 2 minutes.</p>`,
};

const MOCK_USERS = [
  { userId: "u1", name: "Arjun Mehra", email: "arjun@te.ai", profilePicture: "", color: "#6366F1" },
  { userId: "u2", name: "Priya Singh", email: "priya@te.ai", profilePicture: "", color: "#EC4899" },
  { userId: "u3", name: "Luca Ferrari", email: "luca@te.ai", profilePicture: "", color: "#F59E0B" },
];

const MOCK_MEMBERS = {
  "1": [
    { userId: "me", name: "Kavin P D", email: "kavin@te.ai", role: "owner" },
    { userId: "u1", name: "Arjun Mehra", email: "arjun@te.ai", role: "editor" },
    { userId: "u2", name: "Priya Singh", email: "priya@te.ai", role: "viewer" },
  ],
  "2": [
    { userId: "me", name: "Kavin P D", email: "kavin@te.ai", role: "editor" },
    { userId: "u3", name: "Luca Ferrari", email: "luca@te.ai", role: "owner" },
  ],
};

const MOCK_HISTORY = [
  { version: 5, editedBy: "Kavin P D", timestamp: "2026-04-03T10:00:00Z", content: "<h1>Product Roadmap Q2 2026</h1><p>Earlier version — performance improvements only. No mention of mobile beta yet.</p>" },
  { version: 4, editedBy: "Arjun Mehra", timestamp: "2026-04-02T18:00:00Z", content: "<h1>Product Roadmap Q2 2026</h1><p>Draft from Arjun. Q2 focus areas are under discussion.</p>" },
  { version: 3, editedBy: "Kavin P D", timestamp: "2026-04-01T12:00:00Z", content: "<h1>Product Roadmap Q2</h1><p>Initial skeleton document.</p>" },
];

const MOCK_COMMENTS = [
  { commentId: "c1", author: "Arjun Mehra", text: "Should we also include the API deprecation timeline here?", timestamp: "2026-04-03T09:30:00Z", resolved: false },
  { commentId: "c2", author: "Priya Singh", text: "The mobile beta date should be confirmed with the iOS team.", timestamp: "2026-04-02T16:00:00Z", resolved: false },
  { commentId: "c3", author: "Luca Ferrari", text: "Looks good. Approved.", timestamp: "2026-04-01T11:00:00Z", resolved: true },
];

const MOCK_INVITATIONS = [
  { invitationId: "i1", documentId: "3", documentTitle: "Marketing Brief — Launch", inviterName: "Priya Singh", role: "editor" },
];

/* ─── Helpers ────────────────────────────────────────────────────────── */
const getInitials = (name: string) => name?.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() || "?";
const formatDate = (iso: string | number | Date) => {
  const d = new Date(iso);
  const now = new Date();
  const diff = Math.floor((now - d) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

const ROLE_STYLE = {
  owner: { bg: "rgba(99,102,241,0.1)", text: "#6366F1", icon: Crown },
  editor: { bg: "rgba(16,185,129,0.1)", text: "#10B981", icon: Edit3 },
  viewer: { bg: "rgba(100,116,139,0.1)", text: "#94A3B8", icon: Eye },
};

const USER_COLORS = ["#6366F1", "#EC4899", "#F59E0B", "#10B981", "#3B82F6", "#EF4444"];
const getUserColor = (id: string) => USER_COLORS[id?.charCodeAt(0) % USER_COLORS.length] || "#6366F1";

/* ─── Sub-components ─────────────────────────────────────────────────── */

function Avatar({ name, color, size = 32, src }) {
  return src ? (
    <img src={src} alt={name} style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover" }} />
  ) : (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: color || getUserColor(name),
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.3, fontWeight: 700, color: "#fff",
      fontFamily: "'Geist Mono', monospace", flexShrink: 0,
    }}>
      {getInitials(name)}
    </div>
  );
}

function RoleBadge({ role }) {
  const s = ROLE_STYLE[role] || ROLE_STYLE.viewer;
  const Icon = s.icon;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      padding: "2px 8px", borderRadius: 100,
      background: s.bg, color: s.text,
      fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em",
      fontFamily: "'Geist Mono', monospace",
    }}>
      <Icon size={9} />{role}
    </span>
  );
}

/* ─── Panels ─────────────────────────────────────────────────────────── */

function MembersPanel({ docId }) {
  const members = MOCK_MEMBERS[docId] || [];
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("editor");
  return (
    <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Invite */}
      <div style={{ background: "rgba(99,102,241,0.04)", border: "1px solid rgba(99,102,241,0.12)", borderRadius: 14, padding: 14 }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 10, fontFamily: "'Geist Mono', monospace" }}>Invite member</p>
        <input value={email} onChange={e => setEmail(e.target.value)} placeholder="name@company.com"
          style={{ width: "100%", background: "white", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 10, padding: "8px 12px", fontSize: 13, color: "#0F172A", outline: "none", boxSizing: "border-box", fontFamily: "inherit" }} />
        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          {["viewer", "editor"].map(r => (
            <button key={r} onClick={() => setRole(r)}
              style={{ flex: 1, padding: "7px 0", borderRadius: 9, border: "1.5px solid", fontSize: 12, fontWeight: 600, cursor: "pointer", transition: "all 0.15s",
                borderColor: role === r ? "#6366F1" : "rgba(0,0,0,0.08)",
                background: role === r ? "rgba(99,102,241,0.08)" : "transparent",
                color: role === r ? "#6366F1" : "#64748B" }}>
              {r}
            </button>
          ))}
        </div>
        <button style={{ marginTop: 8, width: "100%", padding: "9px 0", borderRadius: 10, background: "#6366F1", color: "white", border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
          <UserPlus size={13} /> Send Invite
        </button>
      </div>
      {/* List */}
      <div>
        <p style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 10, fontFamily: "'Geist Mono', monospace" }}>{members.length} members</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {members.map((m: { userId: Key | null | undefined; name: unknown; email: string | number | bigint | boolean | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<string | number | bigint | boolean | ReactPortal | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined> | null | undefined; role: unknown; }) => (
            <div key={m.userId} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 12, background: "#F8FAFC", border: "1px solid rgba(0,0,0,0.04)" }}>
              <Avatar name={m.name} color={getUserColor(m.userId)} size={34} src={undefined} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: "#0F172A", margin: 0, display: "flex", alignItems: "center", gap: 6 }}>
                  {m.name} {m.userId === "me" && <span style={{ fontSize: 10, color: "#94A3B8", fontFamily: "'Geist Mono', monospace" }}>(you)</span>}
                </p>
                <p style={{ fontSize: 11, color: "#94A3B8", margin: 0 }}>{m.email}</p>
              </div>
              <RoleBadge role={m.role} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function CommentsPanel({ docId }) {
  const [newComment, setNewComment] = useState("");
  const [comments, setComments] = useState(MOCK_COMMENTS);
  const resolve = (id: string) => setComments(cs => cs.map(c => c.commentId === id ? { ...c, resolved: true } : c));
  return (
    <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ background: "#F8FAFC", border: "1px solid rgba(0,0,0,0.07)", borderRadius: 14, padding: 12 }}>
        <textarea value={newComment} onChange={e => setNewComment(e.target.value)} placeholder="Add a comment…" rows={3}
          style={{ width: "100%", background: "transparent", border: "none", resize: "none", fontSize: 13, color: "#0F172A", outline: "none", fontFamily: "inherit", boxSizing: "border-box" }} />
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button onClick={() => setNewComment("")}
            style={{ padding: "7px 16px", borderRadius: 9, background: "#6366F1", color: "white", border: "none", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
            Comment
          </button>
        </div>
      </div>
      {comments.map(c => (
        <div key={c.commentId} style={{ padding: "12px 14px", borderRadius: 14, background: c.resolved ? "rgba(0,0,0,0.02)" : "white", border: `1px solid ${c.resolved ? "rgba(0,0,0,0.04)" : "rgba(0,0,0,0.07)"}`, opacity: c.resolved ? 0.6 : 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <Avatar name={c.author} color={getUserColor(c.author)} size={26} src={undefined} />
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: "#0F172A" }}>{c.author}</p>
              <p style={{ margin: 0, fontSize: 10, color: "#94A3B8", fontFamily: "'Geist Mono', monospace" }}>{formatDate(c.timestamp)}</p>
            </div>
            {c.resolved
              ? <span style={{ fontSize: 10, color: "#10B981", fontWeight: 700, fontFamily: "'Geist Mono', monospace" }}>RESOLVED</span>
              : <button onClick={() => resolve(c.commentId)} title="Resolve" style={{ padding: 4, borderRadius: 7, border: "none", background: "transparent", cursor: "pointer", color: "#94A3B8" }}><Check size={13} /></button>}
          </div>
          <p style={{ margin: 0, fontSize: 13, color: "#334155", lineHeight: 1.5 }}>{c.text}</p>
        </div>
      ))}
    </div>
  );
}

function HistoryPanel({ docId, onPreview }) {
  return (
    <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: 6 }}>
      <p style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.07em", margin: "0 0 8px", fontFamily: "'Geist Mono', monospace" }}>Version history</p>
      {MOCK_HISTORY.map((h, i) => (
        <div key={h.version} style={{ padding: "12px 14px", borderRadius: 14, background: "white", border: "1px solid rgba(0,0,0,0.07)", display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 26, height: 26, borderRadius: 8, background: i === 0 ? "rgba(99,102,241,0.1)" : "#F1F5F9", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <History size={12} color={i === 0 ? "#6366F1" : "#94A3B8"} />
              </div>
              <div>
                <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: "#0F172A" }}>v{h.version} {i === 0 && <span style={{ fontSize: 10, color: "#6366F1", fontFamily: "'Geist Mono', monospace" }}>· current</span>}</p>
                <p style={{ margin: 0, fontSize: 10, color: "#94A3B8" }}>{h.editedBy} · {formatDate(h.timestamp)}</p>
              </div>
            </div>
            <div style={{ display: "flex", gap: 4 }}>
              <button onClick={() => onPreview(h.content)}
                style={{ padding: "5px 10px", borderRadius: 8, fontSize: 11, fontWeight: 600, border: "1px solid rgba(0,0,0,0.08)", background: "#F8FAFC", color: "#64748B", cursor: "pointer" }}>
                <Eye size={11} />
              </button>
              {i !== 0 && (
                <button style={{ padding: "5px 10px", borderRadius: 8, fontSize: 11, fontWeight: 600, border: "1px solid rgba(239,68,68,0.15)", background: "rgba(239,68,68,0.06)", color: "#EF4444", cursor: "pointer" }}>
                  <RotateCcw size={11} />
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Share Modal ────────────────────────────────────────────────────── */
function ShareModal({ doc, onClose }) {
  const [copied, setCopied] = useState(false);
  const link = `https://edit.app/doc/${doc.documentId}`;
  const copy = () => { setCopied(true); setTimeout(() => setCopied(false), 2000); };
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 60, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(15,23,42,0.4)", backdropFilter: "blur(4px)", padding: 16 }}>
      <div style={{ background: "white", borderRadius: 20, padding: 28, maxWidth: 420, width: "100%", boxShadow: "0 24px 80px rgba(0,0,0,0.18)", border: "1px solid rgba(0,0,0,0.06)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 12, background: "rgba(99,102,241,0.08)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Share2 size={16} color="#6366F1" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#0F172A" }}>Share document</h3>
              <p style={{ margin: 0, fontSize: 11, color: "#94A3B8" }}>Anyone with the link can view</p>
            </div>
          </div>
          <button onClick={onClose} style={{ padding: 6, borderRadius: 9, border: "none", background: "transparent", cursor: "pointer", color: "#94A3B8" }}><X size={16} /></button>
        </div>
        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          <div style={{ flex: 1, padding: "9px 12px", borderRadius: 10, background: "#F8FAFC", border: "1px solid rgba(0,0,0,0.07)", fontSize: 12, color: "#64748B", fontFamily: "'Geist Mono', monospace", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>
            {link}
          </div>
          <button onClick={copy} style={{ padding: "9px 16px", borderRadius: 10, background: copied ? "#10B981" : "#6366F1", color: "white", border: "none", fontSize: 12, fontWeight: 600, cursor: "pointer", transition: "background 0.2s", whiteSpace: "nowrap" }}>
            {copied ? "Copied!" : "Copy link"}
          </button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {["Anyone with the link", "Only invited members"].map((opt, i) => (
            <label key={opt} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 12, border: `1.5px solid ${i === 0 ? "#6366F1" : "rgba(0,0,0,0.07)"}`, background: i === 0 ? "rgba(99,102,241,0.04)" : "transparent", cursor: "pointer" }}>
              <input type="radio" name="share" defaultChecked={i === 0} style={{ accentColor: "#6366F1" }} />
              <span style={{ fontSize: 13, fontWeight: 500, color: "#0F172A" }}>{opt}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Toolbar Button ─────────────────────────────────────────────────── */
function ToolBtn({ icon: Icon, active, onClick, title }) {
  return (
    <button onClick={onClick} title={title} style={{
      padding: "6px 8px", borderRadius: 8, border: "none", cursor: "pointer", transition: "all 0.12s",
      background: active ? "rgba(99,102,241,0.12)" : "transparent",
      color: active ? "#6366F1" : "#64748B",
    }}
      onMouseEnter={e => { if (!active) { e.currentTarget.style.background = "rgba(0,0,0,0.05)"; e.currentTarget.style.color = "#0F172A"; } }}
      onMouseLeave={e => { if (!active) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#64748B"; } }}>
      <Icon size={14} />
    </button>
  );
}

/* ─── Main Dashboard ─────────────────────────────────────────────────── */
export default function Dashboard() {
  const [docs, setDocs] = useState(MOCK_DOCS);
  const [activeDocId, setActiveDocId] = useState("1");
  const [search, setSearch] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [panel, setPanel] = useState(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [saveStatus, setSaveStatus] = useState("saved");
  const [historyPreview, setHistoryPreview] = useState(null);
  const [inboxOpen, setInboxOpen] = useState(false);
  const [invitations, setInvitations] = useState(MOCK_INVITATIONS);
  const [titleEdit, setTitleEdit] = useState(false);
  const [titleVal, setTitleVal] = useState("");
  const [creating, setCreating] = useState(false);
  const [docLoading, setDocLoading] = useState(false);
  const [activeFormat, setActiveFormat] = useState({ bold: false, italic: false, underline: false });

  const activeDoc = docs.find(d => d.documentId === activeDocId) || null;
  const docRole = activeDoc?.role || "owner";
  const canEdit = docRole === "owner" || docRole === "editor";
  const filtered = docs.filter(d => d.title.toLowerCase().includes(search.toLowerCase()));
  const onlineUsers = activeDocId ? MOCK_USERS.slice(0, activeDocId === "1" ? 3 : 1) : [];

  const selectDoc = (id: SetStateAction<string>) => {
    setDocLoading(true);
    setPanel(null);
    setHistoryPreview(null);
    setActiveDocId(id);
    setTitleEdit(false);
    setSaveStatus("saved");
    setTimeout(() => setDocLoading(false), 600);
    if (window.innerWidth < 768) setSidebarOpen(false);
  };

  const handleCreate = () => {
    setCreating(true);
    setTimeout(() => {
      const newDoc = { documentId: String(Date.now()), title: "Untitled Document", role: "owner", updatedAt: new Date().toISOString() };
      setDocs(d => [newDoc, ...d]);
      selectDoc(newDoc.documentId);
      setCreating(false);
    }, 800);
  };

  const handleDelete = (id: string) => {
    setDocs(d => d.filter(x => x.documentId !== id));
    if (activeDocId === id) setActiveDocId(null);
    setDeleteConfirm(null);
  };

  const saveTitle = () => {
    if (!titleVal.trim()) return;
    setDocs(ds => ds.map(d => d.documentId === activeDocId ? { ...d, title: titleVal } : d));
    setTitleEdit(false);
  };

  const togglePanel = (p: string | null) => setPanel(cur => cur === p ? null : p);

  const fmt = (f: string) => setActiveFormat(s => ({ ...s, [f]: !s[f] }));

  /* ── Styles (inline for portability) ── */
  const toolbarBtnSep = { width: 1, height: 18, background: "rgba(0,0,0,0.08)", margin: "0 4px", flexShrink: 0 };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'DM Sans', sans-serif; }
        .te-scroll::-webkit-scrollbar { width: 5px; }
        .te-scroll::-webkit-scrollbar-track { background: transparent; }
        .te-scroll::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); border-radius: 99px; }
        .te-doc-content { font-family: 'DM Sans', sans-serif; color: #1E293B; line-height: 1.75; font-size: 15px; outline: none; }
        .te-doc-content h1 { font-size: 26px; font-weight: 700; color: #0F172A; margin: 0 0 16px; letter-spacing: -0.5px; }
        .te-doc-content h2 { font-size: 18px; font-weight: 700; color: #0F172A; margin: 24px 0 10px; }
        .te-doc-content p { margin: 0 0 12px; }
        .te-doc-content blockquote { border-left: 3px solid #6366F1; padding: 10px 16px; background: rgba(99,102,241,0.04); border-radius: 0 10px 10px 0; margin: 16px 0; font-style: italic; color: #475569; }
        .te-doc-content strong { font-weight: 700; color: #0F172A; }
        .te-doc-content em { font-style: italic; }
        .doc-item { transition: all 0.12s; }
        .doc-item:hover { background: #F8FAFC !important; }
        .panel-btn { transition: all 0.12s; }
        .panel-btn:hover { background: rgba(0,0,0,0.04) !important; color: #0F172A !important; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .fade-up { animation: fadeUp 0.25s ease forwards; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .spin { animation: spin 0.8s linear infinite; }
        .te-doc-content [contenteditable] { outline: none; }
      `}</style>

      <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: "#F8FAFC", color: "#0F172A", overflow: "hidden", fontFamily: "'DM Sans', sans-serif" }}>

        {/* ── Header ── */}
        <header style={{ height: 56, borderBottom: "1px solid rgba(0,0,0,0.06)", background: "white", display: "flex", alignItems: "center", gap: 8, padding: "0 12px", flexShrink: 0, zIndex: 40 }}>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ padding: 8, borderRadius: 10, border: "none", background: "transparent", cursor: "pointer", color: "#94A3B8", display: "flex" }}>
            {sidebarOpen ? <ChevronLeft size={18} /> : <FileText size={18} />}
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 800, fontSize: 16, marginRight: 12 }}>
            <span style={{ color: "#6366F1", fontSize: 20, lineHeight: 1 }}>✦</span>
            <span style={{ letterSpacing: "-0.3px" }}>Collab Editor</span>
          </div>

          {/* Title area */}
          {activeDoc && (
            <div style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", gap: 10 }}>
              {titleEdit ? (
                <input autoFocus value={titleVal}
                  onChange={e => setTitleVal(e.target.value)}
                  onBlur={saveTitle}
                  onKeyDown={e => { if (e.key === "Enter") saveTitle(); if (e.key === "Escape") setTitleEdit(false); }}
                  style={{ background: "transparent", borderBottom: "2px solid #6366F1", border: "none", borderBottom: "2px solid #6366F1", outline: "none", fontSize: 14, fontWeight: 600, maxWidth: 280, padding: "2px 4px", color: "#0F172A", fontFamily: "inherit" }} />
              ) : (
                <button onClick={() => { if (canEdit) { setTitleVal(activeDoc.title); setTitleEdit(true); } }}
                  style={{ fontSize: 14, fontWeight: 600, color: "#0F172A", background: "none", border: "none", cursor: canEdit ? "text" : "default", maxWidth: 280, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", padding: "2px 4px", borderRadius: 6 }}>
                  {activeDoc.title}
                </button>
              )}
              <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "#94A3B8", fontFamily: "'DM Mono', monospace", flexShrink: 0 }}>
                {saveStatus === "saving" && <><Loader2 size={11} className="spin" style={{ animation: "spin 0.8s linear infinite" }} /><span>Saving…</span></>}
                {saveStatus === "saved" && <><CheckCircle size={11} style={{ color: "#10B981" }} /><span style={{ color: "#10B981" }}>Saved</span></>}
                {saveStatus === "error" && <><AlertCircle size={11} style={{ color: "#EF4444" }} /><span style={{ color: "#EF4444" }}>Error</span></>}
              </div>
            </div>
          )}
          {!activeDoc && <div style={{ flex: 1 }} />}

          {historyPreview && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 12px", borderRadius: 99, background: "rgba(245,158,11,0.1)", color: "#D97706", fontSize: 11, fontWeight: 600, flexShrink: 0, fontFamily: "'DM Mono', monospace" }}>
              <History size={11} /> PREVIEW MODE
            </div>
          )}

          {/* Right actions */}
          <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
            {/* Online avatars */}
            {activeDoc && onlineUsers.length > 0 && (
              <div style={{ display: "flex", alignItems: "center", marginRight: 8 }}>
                {onlineUsers.map((u, i) => (
                  <div key={u.userId} style={{ position: "relative", marginLeft: i > 0 ? -8 : 0 }} title={u.name}>
                    <Avatar name={u.name} color={u.color} size={30} src={undefined} />
                    <span style={{ position: "absolute", bottom: 0, right: 0, width: 9, height: 9, background: "#22C55E", borderRadius: "50%", border: "2px solid white" }} />
                  </div>
                ))}
              </div>
            )}

            {activeDoc && (
              <button onClick={() => setShareOpen(true)}
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 10, fontSize: 12, fontWeight: 600, background: "rgba(99,102,241,0.08)", color: "#6366F1", border: "1px solid rgba(99,102,241,0.15)", cursor: "pointer" }}>
                <Share2 size={12} /> Share
              </button>
            )}

            {activeDoc && (
              <div style={{ display: "flex", alignItems: "center", gap: 2, marginLeft: 4 }}>
                {[
                  { icon: MessageSquare, key: "comments" },
                  { icon: Users, key: "members" },
                  { icon: History, key: "history" },
                ].map(({ icon: Icon, key }) => (
                  <button key={key} onClick={() => togglePanel(key)} className="panel-btn"
                    style={{ padding: 8, borderRadius: 10, border: "none", cursor: "pointer", display: "flex", background: panel === key ? "rgba(99,102,241,0.08)" : "transparent", color: panel === key ? "#6366F1" : "#94A3B8" }}>
                    <Icon size={16} />
                  </button>
                ))}
                <div style={{ width: 1, height: 22, background: "rgba(0,0,0,0.07)", margin: "0 4px" }} />
              </div>
            )}

            {/* Inbox */}
            <div style={{ position: "relative" }}>
              <button onClick={() => setInboxOpen(!inboxOpen)}
                style={{ padding: 8, borderRadius: 10, border: "none", background: "transparent", cursor: "pointer", color: "#94A3B8", display: "flex", position: "relative" }}>
                <Bell size={16} />
                {invitations.length > 0 && (
                  <span style={{ position: "absolute", top: 4, right: 4, width: 16, height: 16, borderRadius: "50%", background: "#EF4444", color: "white", fontSize: 9, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Mono', monospace" }}>
                    {invitations.length}
                  </span>
                )}
              </button>
              {inboxOpen && (
                <>
                  <div style={{ position: "fixed", inset: 0, zIndex: 40 }} onClick={() => setInboxOpen(false)} />
                  <div className="fade-up" style={{ position: "absolute", right: 0, top: "calc(100% + 8px)", width: 320, background: "white", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 18, boxShadow: "0 12px 48px rgba(0,0,0,0.12)", zIndex: 50, overflow: "hidden" }}>
                    <div style={{ padding: "14px 16px 12px", borderBottom: "1px solid rgba(0,0,0,0.06)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontWeight: 700, fontSize: 13 }}>Invitations</span>
                      <button onClick={() => setInboxOpen(false)} style={{ border: "none", background: "transparent", cursor: "pointer", color: "#94A3B8", display: "flex" }}><X size={14} /></button>
                    </div>
                    <div style={{ maxHeight: 280, overflowY: "auto" }} className="te-scroll">
                      {invitations.length === 0
                        ? <div style={{ padding: "32px 16px", textAlign: "center", color: "#94A3B8", fontSize: 13 }}><Bell size={24} style={{ margin: "0 auto 8px", display: "block" }} />No pending invitations</div>
                        : invitations.map(inv => (
                          <div key={inv.invitationId} style={{ padding: "14px 16px", borderBottom: "1px solid rgba(0,0,0,0.04)" }}>
                            <p style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>{inv.documentTitle}</p>
                            <p style={{ fontSize: 11, color: "#64748B", marginBottom: 10 }}><strong>{inv.inviterName}</strong> invited you as <strong style={{ color: "#6366F1" }}>{inv.role}</strong></p>
                            <div style={{ display: "flex", gap: 8 }}>
                              <button onClick={() => setInvitations(is => is.filter(i => i.invitationId !== inv.invitationId))}
                                style={{ flex: 1, padding: "7px 0", borderRadius: 9, background: "#6366F1", color: "white", border: "none", fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                                <Check size={11} /> Accept
                              </button>
                              <button onClick={() => setInvitations(is => is.filter(i => i.invitationId !== inv.invitationId))}
                                style={{ flex: 1, padding: "7px 0", borderRadius: 9, background: "#F1F5F9", color: "#64748B", border: "none", fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                                <X size={11} /> Decline
                              </button>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* User chip */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 10px 5px 5px", borderRadius: 99, background: "#F8FAFC", border: "1px solid rgba(0,0,0,0.06)", marginLeft: 4 }}>
              <Avatar name="Kavin P D" color="#6366F1" size={26} src={undefined} />
              <span style={{ fontSize: 12, fontWeight: 600, color: "#0F172A" }}>Kavin P D</span>
            </div>
          </div>
        </header>

        {/* ── Body ── */}
        <div style={{ flex: 1, display: "flex", overflow: "hidden", position: "relative" }}>

          {/* Mobile overlay */}
          {sidebarOpen && <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.2)", zIndex: 20, display: "none" }} />}

          {/* ── Sidebar ── */}
          <aside style={{
            width: sidebarOpen ? 272 : 0, flexShrink: 0, borderRight: "1px solid rgba(0,0,0,0.06)", background: "white", display: "flex", flexDirection: "column", transition: "width 0.2s ease", overflow: "hidden"
          }}>
            <div style={{ width: 272, display: "flex", flexDirection: "column", height: "100%" }}>
              {/* Create + search */}
              <div style={{ padding: 12, display: "flex", flexDirection: "column", gap: 8, flexShrink: 0 }}>
                <button onClick={handleCreate} disabled={creating}
                  style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 7, padding: "10px 0", borderRadius: 12, background: creating ? "#A5B4FC" : "#6366F1", color: "white", border: "none", cursor: creating ? "not-allowed" : "pointer", fontSize: 13, fontWeight: 700, boxShadow: "0 2px 14px rgba(99,102,241,0.3)", transition: "all 0.15s" }}>
                  {creating ? <span className="spin" style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,0.3)", borderTop: "2px solid white", borderRadius: "50%", display: "inline-block" }} /> : <Plus size={14} />}
                  New Document
                </button>
                <div style={{ position: "relative" }}>
                  <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#94A3B8" }} />
                  <input type="text" placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)}
                    style={{ width: "100%", paddingLeft: 30, paddingRight: 10, paddingTop: 8, paddingBottom: 8, background: "#F8FAFC", border: "1px solid rgba(0,0,0,0.06)", borderRadius: 10, fontSize: 12, color: "#0F172A", outline: "none", fontFamily: "inherit" }} />
                </div>
              </div>

              {/* Doc list */}
              <div style={{ flex: 1, overflowY: "auto", padding: "0 8px 12px" }} className="te-scroll">
                {filtered.length === 0 && (
                  <div style={{ textAlign: "center", padding: "40px 12px", color: "#94A3B8", fontSize: 12 }}>
                    <FileText size={28} style={{ margin: "0 auto 8px", display: "block", opacity: 0.4 }} />
                    {search ? "No results" : "No documents yet"}
                  </div>
                )}
                {filtered.map(doc => {
                  const isActive = activeDocId === doc.documentId;
                  return (
                    <div key={doc.documentId} onClick={() => selectDoc(doc.documentId)} className="doc-item"
                      style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 12px", borderRadius: 12, cursor: "pointer", marginBottom: 2, border: `1px solid ${isActive ? "rgba(99,102,241,0.15)" : "transparent"}`, background: isActive ? "rgba(99,102,241,0.06)" : "transparent", position: "relative" }}>
                      <FileText size={15} style={{ marginTop: 2, flexShrink: 0, color: isActive ? "#6366F1" : "#94A3B8" }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 13, fontWeight: 600, color: isActive ? "#4F46E5" : "#0F172A", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: 4 }}>{doc.title}</p>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <RoleBadge role={doc.role} />
                          <span style={{ fontSize: 10, color: "#94A3B8", display: "flex", alignItems: "center", gap: 3, fontFamily: "'DM Mono', monospace" }}>
                            <Clock size={9} />{formatDate(doc.updatedAt)}
                          </span>
                        </div>
                      </div>
                      {doc.role === "owner" && (
                        <button onClick={e => { e.stopPropagation(); setDeleteConfirm(doc.documentId); }}
                          style={{ padding: 5, borderRadius: 7, border: "none", background: "transparent", cursor: "pointer", color: "#CBD5E1", flexShrink: 0, display: "flex", opacity: 0 }}
                          className="del-btn"
                          onMouseEnter={e => { e.currentTarget.style.opacity = 1; e.currentTarget.style.color = "#EF4444"; e.currentTarget.style.background = "rgba(239,68,68,0.07)"; }}
                          onMouseLeave={e => { e.currentTarget.style.opacity = 0; e.currentTarget.style.color = "#CBD5E1"; e.currentTarget.style.background = "transparent"; }}>
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </aside>

          {/* ── Main area ── */}
          <main style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>

            {/* Toolbar */}
            {activeDoc && canEdit && !historyPreview && (
              <div style={{ height: 44, borderBottom: "1px solid rgba(0,0,0,0.06)", background: "white", display: "flex", alignItems: "center", padding: "0 12px", gap: 2, flexShrink: 0, overflowX: "auto" }}>
                {[
                  { icon: Bold, f: "bold" }, { icon: Italic, f: "italic" }, { icon: UnderlineIcon, f: "underline" }, { icon: Strikethrough, f: "strike" },
                ].map(({ icon: Icon, f }) => (
                  <ToolBtn key={f} icon={Icon} active={activeFormat[f]} onClick={() => fmt(f)} title={f} />
                ))}
                <div style={toolbarBtnSep} />
                <ToolBtn icon={Heading1} title="H1" active={undefined} onClick={undefined} />
                <ToolBtn icon={Heading2} title="H2" active={undefined} onClick={undefined} />
                <div style={toolbarBtnSep} />
                <ToolBtn icon={List} title="Bullets" active={undefined} onClick={undefined} />
                <ToolBtn icon={ListOrdered} title="Numbers" active={undefined} onClick={undefined} />
                <ToolBtn icon={Quote} title="Quote" active={undefined} onClick={undefined} />
                <div style={toolbarBtnSep} />
                <ToolBtn icon={AlignLeft} title="Left" active onClick={undefined} />
                <ToolBtn icon={AlignCenter} title="Center" active={undefined} onClick={undefined} />
                <ToolBtn icon={AlignRight} title="Right" active={undefined} onClick={undefined} />
                <div style={toolbarBtnSep} />
                <ToolBtn icon={Highlighter} title="Highlight" active={undefined} onClick={undefined} />
                <ToolBtn icon={Minus} title="Divider" active={undefined} onClick={undefined} />
                <ToolBtn icon={Link} title="Link" active={undefined} onClick={undefined} />
                <ToolBtn icon={Image} title="Image" active={undefined} onClick={undefined} />
              </div>
            )}

            {historyPreview && (
              <div style={{ height: 40, background: "rgba(245,158,11,0.08)", borderBottom: "1px solid rgba(245,158,11,0.2)", display: "flex", alignItems: "center", gap: 8, padding: "0 16px", fontSize: 12, color: "#B45309", fontWeight: 600, flexShrink: 0 }}>
                <History size={13} />
                Previewing an older version — close History panel to return to live document
                <button onClick={() => setHistoryPreview(null)} style={{ marginLeft: "auto", padding: "4px 10px", borderRadius: 8, border: "none", background: "rgba(245,158,11,0.15)", color: "#B45309", cursor: "pointer", fontSize: 11, fontWeight: 700 }}>
                  Exit preview
                </button>
              </div>
            )}

            {/* Canvas */}
            <div style={{ flex: 1, overflowY: "auto", background: "#F0F2F5" }} className="te-scroll">
              {!activeDocId && !docLoading && (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 20, padding: 24, textAlign: "center" }}>
                  <div style={{ width: 72, height: 72, borderRadius: 24, background: "linear-gradient(135deg, rgba(99,102,241,0.1), rgba(6,182,212,0.07))", border: "1px solid rgba(99,102,241,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <FileText size={32} color="#6366F1" />
                  </div>
                  <div>
                    <h2 style={{ fontSize: 22, fontWeight: 800, color: "#0F172A", marginBottom: 6, letterSpacing: "-0.4px" }}>Select a document</h2>
                    <p style={{ fontSize: 13, color: "#64748B", maxWidth: 280 }}>Pick one from the sidebar or create a new one to begin writing.</p>
                  </div>
                  <button onClick={handleCreate} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 22px", borderRadius: 12, background: "#6366F1", color: "white", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 700, boxShadow: "0 2px 14px rgba(99,102,241,0.3)" }}>
                    <Plus size={14} /> New Document
                  </button>
                </div>
              )}

              {docLoading && (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 12 }}>
                  <span className="spin" style={{ width: 32, height: 32, border: "3px solid rgba(99,102,241,0.15)", borderTop: "3px solid #6366F1", borderRadius: "50%", display: "block" }} />
                  <p style={{ fontSize: 13, color: "#64748B" }}>Loading document…</p>
                </div>
              )}

              {activeDocId && activeDoc && !docLoading && (
                <div style={{ maxWidth: 820, margin: "0 auto", padding: "40px 24px 80px" }}>
                  {/* Online user color bars */}
                  {onlineUsers.length > 0 && (
                    <div style={{ display: "flex", gap: 4, marginBottom: 20 }}>
                      {onlineUsers.map(u => (
                        <div key={u.userId} title={u.name}
                          style={{ flex: 1, height: 3, borderRadius: 99, background: u.color, opacity: 0.7 }} />
                      ))}
                    </div>
                  )}

                  {/* Paper */}
                  <div style={{ background: "white", borderRadius: 20, boxShadow: "0 2px 24px rgba(0,0,0,0.06)", border: "1px solid rgba(0,0,0,0.05)", padding: "48px 56px", minHeight: 600 }}>
                    {historyPreview ? (
                      <div className="te-doc-content" dangerouslySetInnerHTML={{ __html: historyPreview }} />
                    ) : (
                      <div
                        className="te-doc-content"
                        contentEditable={canEdit}
                        suppressContentEditableWarning
                        dangerouslySetInnerHTML={{ __html: MOCK_CONTENT[activeDocId] || "<p>Start writing…</p>" }}
                        style={{ minHeight: 500 }}
                      />
                    )}
                  </div>
                </div>
              )}
            </div>
          </main>

          {/* ── Right panel ── */}
          {panel && activeDocId && (
            <>
              <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.1)", zIndex: 20 }} onClick={() => { setPanel(null); setHistoryPreview(null); }} />
              <aside className="fade-up" style={{ width: 320, flexShrink: 0, borderLeft: "1px solid rgba(0,0,0,0.06)", background: "white", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "-4px 0 24px rgba(0,0,0,0.06)", zIndex: 30 }}>
                <div style={{ padding: "14px 16px", borderBottom: "1px solid rgba(0,0,0,0.06)", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
                  <span style={{ fontWeight: 700, fontSize: 14, textTransform: "capitalize" }}>{panel}</span>
                  <button onClick={() => { setPanel(null); setHistoryPreview(null); }}
                    style={{ padding: 6, borderRadius: 8, border: "none", background: "transparent", cursor: "pointer", color: "#94A3B8", display: "flex" }}><X size={15} /></button>
                </div>
                <div style={{ flex: 1, overflowY: "auto" }} className="te-scroll">
                  {panel === "members" && <MembersPanel docId={activeDocId} />}
                  {panel === "comments" && <CommentsPanel docId={activeDocId} />}
                  {panel === "history" && <HistoryPanel docId={activeDocId} onPreview={setHistoryPreview} />}
                </div>
              </aside>
            </>
          )}
        </div>

        {/* ── Delete confirm modal ── */}
        {deleteConfirm && (
          <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, background: "rgba(15,23,42,0.35)", backdropFilter: "blur(4px)" }}>
            <div className="fade-up" style={{ background: "white", borderRadius: 20, padding: 28, maxWidth: 360, width: "100%", boxShadow: "0 24px 80px rgba(0,0,0,0.16)", border: "1px solid rgba(0,0,0,0.06)" }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: "rgba(239,68,68,0.08)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                <Trash2 size={22} color="#EF4444" />
              </div>
              <h3 style={{ fontSize: 17, fontWeight: 800, marginBottom: 8, letterSpacing: "-0.3px" }}>Delete document?</h3>
              <p style={{ fontSize: 13, color: "#64748B", marginBottom: 24, lineHeight: 1.6 }}>This action is permanent and cannot be undone. All history, comments, and members will be removed.</p>
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => setDeleteConfirm(null)}
                  style={{ flex: 1, padding: "10px 0", borderRadius: 12, border: "1px solid rgba(0,0,0,0.08)", background: "#F8FAFC", color: "#0F172A", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                  Cancel
                </button>
                <button onClick={() => handleDelete(deleteConfirm)}
                  style={{ flex: 1, padding: "10px 0", borderRadius: 12, border: "1px solid rgba(239,68,68,0.2)", background: "rgba(239,68,68,0.08)", color: "#EF4444", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Share modal ── */}
        {shareOpen && activeDoc && <ShareModal doc={activeDoc} onClose={() => setShareOpen(false)} />}
      </div>
    </>
  );
}
