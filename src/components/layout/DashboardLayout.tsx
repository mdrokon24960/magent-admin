import type { ReactNode } from 'react';
import { useState, useRef, useEffect } from 'react';
import { NavLink, Navigate, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Ticket as TicketIcon, Users, LogOut, Bell, ShieldCheck, AlertCircle, Clock } from 'lucide-react';
import { useAuthStore } from '../../store/auth';
import { cn } from '../../lib/utils';
import { useQuery } from '@tanstack/react-query';
import api from '../../api/client';

export const DashboardLayout = ({ children }: { children: ReactNode }) => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const { data: tickets } = useQuery<{ ticket_id: string; title: string; status: string }[]>({
    queryKey: ['notifications-tickets'],
    queryFn: async () => (await api.get('/api/v1/tickets')).data.tickets,
    refetchInterval: 10000,
  });

  const unreadCount = tickets?.filter(t => t.status === 'new' || t.status === 'open')?.length || 0;
  const recentTickets = tickets?.filter(t => t.status === 'new' || t.status === 'open')?.slice(0, 4) || [];

  if (!user) return <Navigate to="/login" replace />;

  const navItems = [
    { label: 'Dashboard', icon: LayoutDashboard, href: '/' },
    { label: 'Tickets',   icon: TicketIcon,      href: '/tickets' },
    { label: 'Users',     icon: Users,           href: '/users' },
    { label: 'Roles',     icon: ShieldCheck,     href: '/roles' },
  ];

  return (
    <div className="flex min-h-screen bg-bg">
      {/* Sidebar */}
      <aside className="w-72 bg-bg-surface border-r border-bg-border p-6 flex flex-col fixed inset-y-0">
        <div className="text-2xl font-black bg-gradient-primary bg-clip-text text-transparent mb-10 tracking-tightest">
          MAGNET <span className="text-text-subtle text-xs font-medium ml-1 bg-white/5 py-0.5 px-1.5 rounded uppercase">Admin</span>
        </div>

        <nav className="flex-1 space-y-1.5">
          {navItems.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              className={({ isActive }) => cn(
                'flex items-center gap-3.5 px-4 py-3 rounded-xl transition-all font-semibold',
                isActive ? 'bg-primary/10 text-primary shadow-glow border border-primary/20' : 'text-text-subtle hover:bg-white/5 hover:text-text'
              )}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="pt-6 border-t border-bg-border space-y-4">
          <div className="bg-bg-card rounded-2xl p-4 flex items-center gap-3 border border-white/5 shadow-card">
            <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center font-bold text-sm shadow-glow ring-2 ring-white/10">
              {user?.username?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="truncate font-bold text-sm leading-none mb-1">{user?.username || 'User'}</p>
              <p className="truncate text-xs text-text-subtle font-medium">{user?.roles?.[0] || 'Member'}</p>
            </div>
          </div>
          <button
            onClick={() => { logout(); navigate('/login'); }}
            className="w-full flex items-center gap-3.5 px-4 py-3 text-danger/80 font-bold hover:bg-danger/5 transition-all rounded-xl"
          >
            <LogOut className="w-5 h-5" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-72">
        <header className="h-20 px-10 flex items-center justify-between border-b border-bg-border sticky top-0 bg-bg/80 backdrop-blur-md z-40">
           <h2 className="text-xl font-bold tracking-tight">System Management</h2>
           <div className="relative" ref={dropdownRef}>
             <button 
               onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
               className="p-2.5 rounded-xl bg-bg-surface hover:bg-bg-card border border-bg-border text-text-subtle transition-all relative"
             >
               <Bell className="w-5 h-5" />
               {unreadCount > 0 && (
                 <span className="absolute top-2 right-2.5 w-2 h-2 bg-primary rounded-full ring-2 ring-bg animate-pulse" />
               )}
             </button>
             
             {isNotificationsOpen && (
               <div className="absolute right-0 mt-3 w-80 bg-bg-surface border border-bg-border rounded-2xl shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-4 duration-200">
                  <div className="p-4 border-b border-bg-border flex justify-between items-center bg-bg/50">
                    <h3 className="font-bold text-sm">Action Items</h3>
                    {unreadCount > 0 && (
                      <span className="text-[10px] font-bold bg-primary/20 text-primary px-2 py-0.5 rounded-full">{unreadCount} Pending</span>
                    )}
                  </div>
                  <div className="max-h-[300px] overflow-y-auto overflow-x-hidden">
                    {recentTickets.length === 0 ? (
                      <div className="p-6 text-center text-text-subtle text-sm font-medium">No system alerts at this time.</div>
                    ) : (
                      <div className="flex flex-col">
                        {recentTickets.map((t) => (
                          <div 
                            key={t.ticket_id} 
                            onClick={() => { setIsNotificationsOpen(false); navigate('/tickets'); }}
                            className="p-4 border-b border-white/5 hover:bg-white/5 cursor-pointer transition-colors flex gap-3 group"
                          >
                            <div className="mt-0.5">
                              {t.status === 'new' ? <AlertCircle className="w-4 h-4 text-primary" /> : <Clock className="w-4 h-4 text-warning" />}
                            </div>
                            <div className="flex-1 min-w-0">
                               <p className="text-sm font-bold truncate group-hover:text-primary transition-colors">{t.title}</p>
                               <p className="text-xs text-text-subtle capitalize mt-0.5">Ticket status: {t.status.replace('_', ' ')}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="p-3 bg-bg flex justify-center border-t border-bg-border">
                     <button onClick={() => { setIsNotificationsOpen(false); navigate('/tickets'); }} className="text-xs font-bold text-text hover:text-primary transition-colors">Go to Helpdesk →</button>
                  </div>
               </div>
             )}
           </div>
        </header>
        <div className="p-10 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};
