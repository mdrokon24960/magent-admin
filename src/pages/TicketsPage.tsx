import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  LayoutGrid, Plus, CheckCircle2, Clock, AlertCircle, XCircle,
  RefreshCw, Sparkles, ChevronDown, Send, Mail, Eye
} from 'lucide-react';
import api from '../api/client';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { useState, useRef, useEffect } from 'react';
import { cn } from '../lib/utils';

interface Ticket {
  ID: string;
  CustomerID: string;
  Title: string;
  Description: string;
  Status: 'new' | 'open' | 'in_progress' | 'resolved' | 'closed';
  Priority?: string | null;
  Category?: string | null;
  Summary?: string | null;
  Feedback?: string | null;
  AdminPrompt?: string | null;
  CreatedAt?: string;
}

interface User {
  user_id: string;
  username: string;
  email: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; icon: React.ReactNode }> = {
  new:         { label: 'New',         color: '#818cf8', bg: 'rgba(129,140,248,0.1)',  border: 'rgba(129,140,248,0.2)', icon: <AlertCircle className="w-3.5 h-3.5" /> },
  open:        { label: 'Open',        color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',   border: 'rgba(245,158,11,0.2)',  icon: <Clock className="w-3.5 h-3.5" /> },
  in_progress: { label: 'In Progress', color: '#22d3ee', bg: 'rgba(34,211,238,0.1)',   border: 'rgba(34,211,238,0.2)',  icon: <Clock className="w-3.5 h-3.5" /> },
  resolved:    { label: 'Resolved',    color: '#10b981', bg: 'rgba(16,185,129,0.1)',   border: 'rgba(16,185,129,0.2)',  icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  closed:      { label: 'Closed',      color: '#64748b', bg: 'rgba(100,116,139,0.1)',  border: 'rgba(100,116,139,0.2)', icon: <XCircle className="w-3.5 h-3.5" /> },
};

const TRANSITIONS: Record<string, { status: string; label: string; color: string }[]> = {
  new:         [{ status: 'open', label: 'Open', color: '#f59e0b' }, { status: 'in_progress', label: 'Start Work', color: '#22d3ee' }, { status: 'closed', label: 'Close', color: '#64748b' }],
  open:        [{ status: 'in_progress', label: 'Start Work', color: '#22d3ee' }, { status: 'resolved', label: 'Resolve', color: '#10b981' }, { status: 'closed', label: 'Close', color: '#64748b' }],
  in_progress: [{ status: 'resolved', label: 'Resolve', color: '#10b981' }, { status: 'open', label: 'Put On Hold', color: '#f59e0b' }, { status: 'closed', label: 'Close', color: '#64748b' }],
  resolved:    [{ status: 'closed', label: 'Close', color: '#64748b' }, { status: 'open', label: 'Reopen', color: '#f59e0b' }],
  closed:      [{ status: 'open', label: 'Reopen', color: '#f59e0b' }],
};

function StatusDropdown({ ticket, onUpdate, onOpenDetail }: {
  ticket: Ticket;
  onUpdate: (id: string, status: string, prompt: string) => void;
  onOpenDetail?: (optimisticTicket: Ticket) => void;
}) {
  const [open, setOpen] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const cfg = STATUS_CONFIG[ticket.Status] ?? STATUS_CONFIG.new;
  const transitions = TRANSITIONS[ticket.Status] ?? [];

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '5px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700,
          color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}`,
          cursor: 'pointer', transition: 'all 0.2s',
        }}
      >
        {cfg.icon}
        {cfg.label}
        <ChevronDown style={{ width: 12, height: 12, transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'none' }} />
      </button>
      {open && (
        <div style={{
          position: 'absolute', right: 0, top: 'calc(100% + 8px)', zIndex: 100,
          background: '#0f111a', border: '1px solid #232738', borderRadius: 12,
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)', minWidth: 160, overflow: 'hidden',
        }}>
          <p style={{ padding: '8px 12px', fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', borderBottom: '1px solid #232738' }}>
            Change Status
          </p>
          {transitions.map(t => (
            <button
              key={t.status}
              onClick={() => { setPendingStatus(t.status); setOpen(false); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                padding: '10px 14px', background: 'transparent', border: 'none',
                color: t.color, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                transition: 'background 0.15s', textAlign: 'left',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = `${t.color}15`)}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              {STATUS_CONFIG[t.status]?.icon}
              {t.label}
            </button>
          ))}
        </div>
      )}

      <Modal
        isOpen={!!pendingStatus}
        onClose={() => setPendingStatus(null)}
        title={`Transition to ${pendingStatus ? STATUS_CONFIG[pendingStatus]?.label : ''}`}
      >
        <div className="space-y-4">
          <p className="text-sm text-text-subtle leading-relaxed">
            Provide instructions for the AI to generate a professional customer update email.
          </p>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-text-subtle uppercase tracking-widest">Admin Note / Prompt</label>
            <textarea
              className="w-full h-32 bg-white/5 border border-white/10 rounded-xl p-4 text-sm text-white resize-none outline-none focus:border-primary/50 transition-colors"
              placeholder="e.g. Tell the user we've assigned a senior engineer and expect resolution in 2 hours."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
          </div>
          <div style={{ padding: '10px 14px', background: 'rgba(129,140,248,0.06)', border: '1px solid rgba(129,140,248,0.15)', borderRadius: 10, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <Sparkles style={{ width: 15, height: 15, color: '#818cf8', flexShrink: 0, marginTop: 2 }} />
            <p style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.5 }}>
              The AI will draft a professional email. You'll review and approve it before sending.
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="ghost" className="flex-1" onClick={() => setPendingStatus(null)}>Cancel</Button>
            <Button className="flex-1" onClick={() => {
              if (pendingStatus) {
                onUpdate(ticket.ID, pendingStatus, prompt);
                // Pass an OPTIMISTIC ticket so the detail modal shows the spinner immediately,
                // without waiting for the next poll cycle
                onOpenDetail?.({
                  ...ticket,
                  Status: pendingStatus as Ticket['Status'],
                  AdminPrompt: prompt,
                  Feedback: null,
                });
              }
              setPendingStatus(null);
              setPrompt('');
            }}>
              <Sparkles className="w-4 h-4 mr-1" />
              Generate Draft
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export const TicketsPage = () => {
  const queryClient = useQueryClient();

  const { data: tickets, isLoading } = useQuery<Ticket[]>({
    queryKey: ['admin-tickets'],
    queryFn: async () => {
      const res = await api.get('/api/v1/admin/tickets?cb=' + Date.now());
      const rawTickets = res.data.tickets ?? [];
      return rawTickets.map((t: any) => ({
        ID: t.ticket_id || t.ID || '',
        CustomerID: t.customer_id || t.CustomerID || '',
        Title: t.title || t.Title || '',
        Description: t.description || t.Description || '',
        Status: t.status || t.Status || 'new',
        Priority: t.priority || t.Priority,
        Category: t.category || t.Category,
        Summary: t.summary || t.Summary,
        Feedback: t.ai_feedback || t.feedback || t.Feedback,
        AdminPrompt: t.latest_admin_prompt || t.admin_prompt || t.AdminPrompt,
        CreatedAt: t.created_at || t.CreatedAt,
      })) as Ticket[];
    },
    refetchInterval: (data) => {
      // Poll faster while any ticket is awaiting AI feedback
      const generating = Array.isArray(data) && data.some((t: Ticket) => t.AdminPrompt && !t.Feedback);
      return generating ? 2000 : 5000;
    },
  });

  const { data: users } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: async () => (await api.get('/api/v1/users')).data.users,
  });

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [newTicket, setNewTicket] = useState({ customer_id: '', title: '', description: '' });
  const [customerSearch, setCustomerSearch] = useState('');
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false);
  const [sendSuccess, setSendSuccess] = useState<string | null>(null);
  const [editedFeedback, setEditedFeedback] = useState<string>('');
  const [isEditingFeedback, setIsEditingFeedback] = useState(false);

  const filteredUsers = users?.filter(u =>
    u.username?.toLowerCase().includes(customerSearch.toLowerCase()) ||
    u.email?.toLowerCase().includes(customerSearch.toLowerCase())
  ).slice(0, 50);

  const createTicketMutation = useMutation({
    mutationFn: (data: typeof newTicket) => api.post('/api/v1/admin/tickets', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-tickets'] });
      setIsCreateModalOpen(false);
      setNewTicket({ customer_id: '', title: '', description: '' });
      setCustomerSearch('');
      setIsCustomerDropdownOpen(false);
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status, admin_prompt }: { id: string; status: string; admin_prompt?: string }) =>
      api.patch(`/api/v1/tickets/${id}/status`, { status, admin_prompt }),
    onSuccess: () => {
      // Refresh list data in background; the optimistic selectedTicket already shows spinner
      queryClient.invalidateQueries({ queryKey: ['admin-tickets'] });
    },
  });

  const sendEmailMutation = useMutation({
    mutationFn: ({ id, feedback, title, status }: { id: string; feedback: string; title: string; status: string }) =>
      api.post(`/api/v1/tickets/${id}/send-email`, { feedback, title, status }),
    onSuccess: (res) => {
      setSendSuccess(res.data.email || 'customer');
      setIsEditingFeedback(false);
      queryClient.invalidateQueries({ queryKey: ['admin-tickets'] });
    },
  });

  const priorityColor: Record<string, string> = {
    high: '#f43f5e', medium: '#f59e0b', low: '#64748b',
  };

  // When ticket selected, pre-fill the editable feedback
  const handleSelectTicket = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setEditedFeedback(ticket.Feedback || '');
    setIsEditingFeedback(false);
    setSendSuccess(null);
  };

  // Merge optimistic selectedTicket data with fresh server data from polling.
  // selectedTicket may have optimistic AdminPrompt before the server confirms it.
  const serverTicket = tickets?.find(t => t.ID === selectedTicket?.ID);
  const liveTicket: Ticket | null = selectedTicket ? {
    ...(serverTicket ?? selectedTicket),
    // Prefer optimistic AdminPrompt if server hasn't confirmed yet
    AdminPrompt: serverTicket?.AdminPrompt || selectedTicket.AdminPrompt,
    // Use server Feedback once it arrives
    Feedback: serverTicket?.Feedback ?? selectedTicket.Feedback,
  } : null;

  // When server delivers AI feedback, populate the editable textarea
  useEffect(() => {
    const feedback = serverTicket?.Feedback;
    if (feedback && feedback !== editedFeedback && !isEditingFeedback && !sendSuccess) {
      setEditedFeedback(feedback);
    }
  }, [serverTicket?.Feedback]);

  const hasFeedback = !!(liveTicket?.Feedback || editedFeedback);
  const isGenerating = !!(liveTicket?.AdminPrompt && !liveTicket?.Feedback);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
        <div>
          <h1 style={{ fontWeight: 900, fontSize: 32, letterSpacing: '-1px', marginBottom: 6 }}>
            Ticket Registry
          </h1>
          <p style={{ color: 'var(--text-subtle)', fontSize: 14 }}>
            Real-time classification and routing queue — {tickets?.length ?? 0} ticket{tickets?.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button className="gap-2" onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="w-4 h-4" /> New Ticket
        </Button>
      </div>

      {/* Create modal */}
      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Manual Ticket Entry">
        <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); createTicketMutation.mutate(newTicket); }}>
          <div className="space-y-4">
            <div className="space-y-2 relative">
              <label className="text-xs font-bold text-text-subtle uppercase tracking-widest">Customer</label>
              <Input
                placeholder="Search by name or email..."
                value={customerSearch}
                onChange={(e) => {
                  setCustomerSearch(e.target.value);
                  setIsCustomerDropdownOpen(true);
                  if (e.target.value === '') setNewTicket({ ...newTicket, customer_id: '' });
                }}
                onFocus={() => setIsCustomerDropdownOpen(true)}
                onBlur={() => setTimeout(() => setIsCustomerDropdownOpen(false), 200)}
              />
              {isCustomerDropdownOpen && users && customerSearch && (
                <div className="absolute top-[72px] left-0 right-0 bg-[#0f111a] border border-[#232738] rounded-xl shadow-2xl z-50 max-h-60 overflow-y-auto">
                  {filteredUsers?.map(user => (
                    <div
                      key={user.user_id}
                      className={cn("px-4 py-3 cursor-pointer transition-colors border-b border-[#232738]/50 last:border-0",
                        user.user_id === newTicket.customer_id ? "bg-primary/20" : "hover:bg-primary/10")}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        setNewTicket({ ...newTicket, customer_id: user.user_id });
                        setCustomerSearch(`${user.username} (${user.email})`);
                        setIsCustomerDropdownOpen(false);
                      }}
                    >
                      <p className="font-bold text-sm text-white">{user.username}</p>
                      <p className="text-xs text-text-subtle">{user.email}</p>
                    </div>
                  ))}
                  {filteredUsers?.length === 0 && (
                    <div className="px-4 py-3 text-sm text-text-subtle italic text-center">No users found.</div>
                  )}
                </div>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-text-subtle uppercase tracking-widest">Subject Line</label>
              <Input
                placeholder="Connection parity issues in eu-west..."
                value={newTicket.title}
                onChange={(e) => setNewTicket({ ...newTicket, title: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-text-subtle uppercase tracking-widest">Full Narrative</label>
              <Input
                placeholder="Describe the technical fault..."
                value={newTicket.description}
                onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                required
              />
            </div>
          </div>
          <Button className="w-full mt-4" type="submit" isLoading={createTicketMutation.isPending}>
            Inject into Queue
          </Button>
        </form>
      </Modal>

      {/* ── Ticket Detail Modal ── */}
      <Modal isOpen={!!selectedTicket} onClose={() => { setSelectedTicket(null); setSendSuccess(null); setIsEditingFeedback(false); }} title="Ticket Details">
        {selectedTicket && liveTicket && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Title */}
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Title</p>
              <p style={{ fontWeight: 700, fontSize: 17 }}>{liveTicket.Title}</p>
            </div>

            {/* Description */}
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Description</p>
              <p style={{ fontSize: 14, color: '#94a3b8', lineHeight: 1.6, padding: '12px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: 10, border: '1px solid #232738' }}>
                {liveTicket.Description || '—'}
              </p>
            </div>

            {/* Status + Priority + Category row */}
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-start' }}>
              <div>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Status</p>
                <StatusDropdown ticket={liveTicket} onUpdate={(id, status, prompt) => {
                  updateStatusMutation.mutate({ id, status, admin_prompt: prompt });
                }} />
              </div>
              {liveTicket.Priority && (
                <div>
                  <p style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Priority</p>
                  <span style={{ fontWeight: 700, fontSize: 13, textTransform: 'capitalize', color: priorityColor[liveTicket.Priority] ?? '#64748b' }}>{liveTicket.Priority}</span>
                </div>
              )}
              {liveTicket.Category && (
                <div>
                  <p style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>AI Category</p>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, fontWeight: 700, color: '#22d3ee' }}>
                    <Sparkles style={{ width: 13, height: 13 }} /> {liveTicket.Category}
                  </span>
                </div>
              )}
            </div>

            {/* AI Summary */}
            {liveTicket.Summary && (
              <div>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>AI Summary</p>
                <p style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.6, padding: '12px 14px', background: 'rgba(34,211,238,0.04)', borderRadius: 10, border: '1px solid rgba(34,211,238,0.15)' }}>
                  {liveTicket.Summary}
                </p>
              </div>
            )}

            {/* ══ AI Email Draft Section ════════════════════════════════════ */}
            <div style={{ borderTop: '1px solid #232738', paddingTop: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <Mail style={{ width: 16, height: 16, color: '#818cf8' }} />
                <p style={{ fontSize: 12, fontWeight: 700, color: '#818cf8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  AI-Generated Customer Email
                </p>
              </div>

              {/* Send success state */}
              {sendSuccess && (
                <div style={{ padding: '14px 16px', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 12, display: 'flex', gap: 10, alignItems: 'center' }}>
                  <CheckCircle2 style={{ width: 18, height: 18, color: '#10b981', flexShrink: 0 }} />
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 700, color: '#10b981' }}>Email Sent Successfully</p>
                    <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>Dispatched to {sendSuccess}</p>
                  </div>
                </div>
              )}

              {/* Generating spinner */}
              {!sendSuccess && isGenerating && (
                <div style={{ padding: '14px 16px', background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 12, display: 'flex', gap: 10, alignItems: 'center' }}>
                  <RefreshCw style={{ width: 16, height: 16, color: '#f59e0b', flexShrink: 0, animation: 'spin 1s linear infinite' }} />
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#f59e0b' }}>AI is crafting the email…</p>
                    <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>Based on: "{liveTicket.AdminPrompt}"</p>
                  </div>
                </div>
              )}

              {/* AI Draft ready — review & send */}
              {!sendSuccess && hasFeedback && !isGenerating && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <p style={{ fontSize: 12, color: '#64748b' }}>
                      Review the draft below and click <strong style={{ color: '#fff' }}>Send to Customer</strong> when ready.
                    </p>
                    <button
                      onClick={() => setIsEditingFeedback(!isEditingFeedback)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 600,
                        color: '#818cf8', background: 'rgba(129,140,248,0.08)', border: '1px solid rgba(129,140,248,0.2)',
                        borderRadius: 8, padding: '4px 10px', cursor: 'pointer',
                      }}
                    >
                      <Eye style={{ width: 11, height: 11 }} />
                      {isEditingFeedback ? 'Stop Editing' : 'Edit Draft'}
                    </button>
                  </div>

                  {isEditingFeedback ? (
                    <textarea
                      value={editedFeedback}
                      onChange={e => setEditedFeedback(e.target.value)}
                      style={{
                        width: '100%', minHeight: 160, background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(129,140,248,0.3)', borderRadius: 12,
                        padding: '14px 16px', fontSize: 13, color: '#e2e8f0', lineHeight: 1.7,
                        resize: 'vertical', outline: 'none', fontFamily: 'inherit',
                      }}
                    />
                  ) : (
                    <div style={{
                      padding: '14px 16px', background: 'rgba(16,185,129,0.04)',
                      borderRadius: 12, border: '1px solid rgba(16,185,129,0.2)',
                    }}>
                      <p style={{ fontSize: 13, color: '#e2e8f0', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
                        {editedFeedback}
                      </p>
                    </div>
                  )}

                  <Button
                    className="w-full gap-2"
                    isLoading={sendEmailMutation.isPending}
                    onClick={() => {
                      sendEmailMutation.mutate({
                        id: liveTicket.ID,
                        feedback: editedFeedback,
                        title: liveTicket.Title,
                        status: liveTicket.Status,
                      });
                    }}
                    style={{ background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none', color: '#fff', fontWeight: 700, padding: '12px', fontSize: 14 }}
                  >
                    <Send style={{ width: 16, height: 16 }} />
                    Send to Customer
                  </Button>
                </div>
              )}

              {/* No prompt yet */}
              {!sendSuccess && !hasFeedback && !isGenerating && (
                <div style={{ padding: '12px 14px', background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)', borderRadius: 10, display: 'flex', gap: 10, alignItems: 'center' }}>
                  <Sparkles style={{ width: 15, height: 15, color: '#818cf8', flexShrink: 0 }} />
                  <p style={{ fontSize: 12, color: '#94a3b8' }}>
                    Change the ticket status and enter an admin note to generate a customer email draft.
                  </p>
                </div>
              )}
            </div>
            {/* ════════════════════════════════════════════════════════════════ */}

            <div style={{ fontSize: 11, color: '#64748b', padding: '10px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: 8, border: '1px solid #232738' }}>
              <strong>Ticket ID:</strong> {liveTicket.ID}
            </div>
            <Button variant="ghost" className="w-full" onClick={() => { setSelectedTicket(null); setSendSuccess(null); setIsEditingFeedback(false); }}>Close</Button>
          </div>
        )}
      </Modal>

      {/* Ticket list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {isLoading ? (
          [1, 2, 3].map(i => <Card key={i} className="h-24 animate-pulse"><div /></Card>)
        ) : !tickets?.length ? (
          <Card className="p-16 text-center">
            <LayoutGrid className="w-12 h-12 text-text-subtle opacity-25 mx-auto mb-4" />
            <p className="font-bold text-lg mb-2">No tickets in the queue</p>
            <p className="text-text-subtle text-sm">New customer submissions will appear here automatically.</p>
          </Card>
        ) : tickets.map((ticket) => {
          const cfg = STATUS_CONFIG[ticket.Status] ?? STATUS_CONFIG.new;
          const hasReadyEmail = !!(ticket.Feedback) && !(ticket.AdminPrompt && !ticket.Feedback);
          return (
            <div
              key={ticket.ID}
              style={{
                background: 'var(--bg-card)', border: '1px solid var(--bg-border)',
                borderRadius: 16, padding: '16px 20px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
                transition: 'border-color 0.2s, background 0.2s', cursor: 'pointer',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = cfg.border; (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.015)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--bg-border)'; (e.currentTarget as HTMLElement).style.background = 'var(--bg-card)'; }}
              onClick={() => handleSelectTicket(ticket)}
            >
              {/* Left: icon + info */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0, flex: 1 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                  background: cfg.bg, border: `1px solid ${cfg.border}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: cfg.color,
                }}>
                  <LayoutGrid style={{ width: 20, height: 20 }} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontWeight: 700, fontSize: 15, marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {ticket.Title}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 11, color: '#64748b', fontFamily: 'monospace' }}>
                      #{ticket.ID.slice(0, 8)}
                    </span>
                    {ticket.Priority && (
                      <span style={{
                        fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
                        textTransform: 'uppercase', letterSpacing: '0.06em',
                        color: priorityColor[ticket.Priority] ?? '#64748b',
                        background: `${priorityColor[ticket.Priority] ?? '#64748b'}15`,
                        border: `1px solid ${priorityColor[ticket.Priority] ?? '#64748b'}25`,
                      }}>
                        {ticket.Priority}
                      </span>
                    )}
                    {ticket.Category && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#22d3ee', fontWeight: 600 }}>
                        <Sparkles style={{ width: 10, height: 10 }} /> {ticket.Category}
                      </span>
                    )}
                    {/* Email draft ready badge */}
                    {hasReadyEmail && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 700, color: '#10b981', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 12, padding: '2px 8px' }}>
                        <Mail style={{ width: 9, height: 9 }} /> Email Ready
                      </span>
                    )}
                    {/* Generating badge */}
                    {ticket.AdminPrompt && !ticket.Feedback && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 700, color: '#f59e0b', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 12, padding: '2px 8px' }}>
                        <RefreshCw style={{ width: 9, height: 9 }} /> Drafting…
                      </span>
                    )}
                    {!ticket.Category && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#475569', fontWeight: 500 }}>
                        <RefreshCw style={{ width: 9, height: 9 }} /> Awaiting AI
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Right: status dropdown */}
              <div onClick={e => e.stopPropagation()}>
                <StatusDropdown
                  ticket={ticket}
                  onUpdate={(id, status, prompt) => updateStatusMutation.mutate({ id, status, admin_prompt: prompt })}
                  onOpenDetail={(optimisticTicket) => handleSelectTicket(optimisticTicket)}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
