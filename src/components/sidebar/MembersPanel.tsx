import { useEffect, useState } from 'react';
import { memberApi } from '../../api';
import { getInitials } from '../../utils';
import { UserPlus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface Props { documentId: string; role: string; }

export default function MembersPanel({ documentId, role }: Props) {
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'editor' | 'viewer'>('editor');
  const [inviting, setInviting] = useState(false);

  const fetchMembers = async () => {
    try {
      const res = await memberApi.getAll(documentId);
      setMembers(res.data.data || []);
    } catch { toast.error('Failed to load members'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchMembers(); }, [documentId]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setInviting(true);
    try {
      await memberApi.invite(documentId, { email: inviteEmail, role: inviteRole });
      toast.success('Invite sent!');
      setInviteEmail('');
      fetchMembers();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to invite');
    } finally { setInviting(false); }
  };

  const handleRoleChange = async (memberId: string, newRole: 'editor' | 'viewer') => {
    try {
      await memberApi.updateRole(documentId, memberId, newRole);
      setMembers((m) => m.map((x) => x.memberId === memberId ? { ...x, role: newRole } : x));
    } catch { toast.error('Failed to update role'); }
  };

  const handleRemove = async (memberId: string) => {
    try {
      await memberApi.remove(documentId, memberId);
      setMembers((m) => m.filter((x) => x.memberId !== memberId));
      toast.success('Member removed');
    } catch { toast.error('Failed to remove member'); }
  };

  const isOwner = role === 'owner';
  const inputCls = "w-full px-3 py-2 bg-[#F8FAFC] border border-black/[0.06] rounded-xl text-sm text-[#0F172A] placeholder-[#94A3B8] outline-none focus:border-[#4F46E5] transition-all";
  const roleColor: Record<string, string> = {
    owner: 'bg-[rgba(79,70,229,0.08)] text-[#4F46E5]',
    editor: 'bg-[rgba(16,185,129,0.08)] text-[#059669]',
    viewer: 'bg-[rgba(100,116,139,0.08)] text-[#64748B]',
  };

  return (
    <div className="flex flex-col gap-0">
      {/* Invite form (owner only) */}
      {isOwner && (
        <div className="p-4 border-b border-black/[0.06]">
          <form onSubmit={handleInvite} className="flex flex-col gap-2">
            <input type="email" placeholder="Email to invite" value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)} className={inputCls} />
            <div className="flex gap-2">
              <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value as any)}
                className={`${inputCls} flex-1`}>
                <option value="editor">Editor</option>
                <option value="viewer">Viewer</option>
              </select>
              <button type="submit" disabled={inviting}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium bg-[#4F46E5] text-white hover:bg-[#4338CA] disabled:opacity-50 transition-all flex-shrink-0">
                {inviting ? <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin-custom" /> : <UserPlus size={14} />}
                Invite
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Member list */}
      <div className="flex flex-col divide-y divide-black/[0.04]">
        {loading && (
          <div className="flex justify-center py-8">
            <span className="w-6 h-6 border-2 border-black/[0.08] border-t-[#4F46E5] rounded-full animate-spin-custom" />
          </div>
        )}
        {!loading && members.map((m) => (
          <div key={m.memberId} className="flex items-center gap-3 px-4 py-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white bg-gradient-to-br from-[#4F46E5] to-[#06B6D4] flex-shrink-0">
              {getInitials(m.user?.name || m.userId || '?')}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate text-[#0F172A]">{m.user?.name || '—'}</p>

            </div>
            <div className="flex items-center gap-1.5">
              {isOwner && m.role !== 'owner' ? (
                <>
                  <select
                    value={m.role}
                    onChange={(e) => handleRoleChange(m.memberId, e.target.value as any)}
                    className="bg-transparent text-[11px] font-semibold uppercase tracking-wide border-none outline-none cursor-pointer text-[#64748B] hover:text-[#0F172A] transition-colors"
                  >
                    <option value="editor">Editor</option>
                    <option value="viewer">Viewer</option>
                  </select>
                  <button onClick={() => handleRemove(m.memberId)}
                    className="p-1 rounded-lg text-[#EF4444]/60 hover:text-[#EF4444] hover:bg-[rgba(239,68,68,0.06)] transition-all">
                    <Trash2 size={12} />
                  </button>
                </>
              ) : (
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide ${roleColor[m.role] || roleColor.viewer}`}>
                  {m.role}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
