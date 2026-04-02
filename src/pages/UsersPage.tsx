import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Shield, UserPlus, Trash2, CheckCircle2, MinusCircle } from 'lucide-react';
import api from '../api/client';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { cn } from '../lib/utils';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { useState } from 'react';

interface User {
  user_id: string;
  username: string;
  email: string;
  status: 'active' | 'disabled';
  roles: string[];
}

export const UsersPage = () => {
  const queryClient = useQueryClient();

  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: async () => (await api.get('/api/v1/users')).data.users,
  });

  const { data: availableRoles } = useQuery<{ id: string; name: string }[]>({
    queryKey: ['roles'],
    queryFn: async () => (await api.get('/api/v1/roles')).data.roles,
  });


  const [isProvisionModalOpen, setIsProvisionModalOpen] = useState(false);
  const [roleModalUser, setRoleModalUser] = useState<User | null>(null);
  const [provisionData, setProvisionData] = useState({ username: '', email: '', password: '' });

  const provisionMutation = useMutation({
    mutationFn: async (data: typeof provisionData) => 
      api.post('/api/v1/users', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setIsProvisionModalOpen(false);
      setProvisionData({ username: '', email: '', password: '' });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => 
      api.delete(`/api/v1/users/${userId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  });

  const assignRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => 
      api.post(`/api/v1/users/${userId}/roles`, { role }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  });

  const revokeRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => 
      api.delete(`/api/v1/users/${userId}/roles`, { data: { role } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ userId, status }: { userId: string; status: string }) => 
      api.patch(`/api/v1/users/${userId}/status`, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  });

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black tracking-tightest mb-2">RBAC Control</h1>
          <p className="text-text-subtle font-medium">Manage user identities and access privileges</p>
        </div>
        <Button className="gap-2" onClick={() => setIsProvisionModalOpen(true)}>
          <UserPlus className="w-4 h-4" /> Provision User
        </Button>
      </div>

      <Modal 
        isOpen={isProvisionModalOpen} 
        onClose={() => setIsProvisionModalOpen(false)} 
        title="Provision New Identity"
      >
        <form className="space-y-6" onSubmit={(e) => {
          e.preventDefault();
          provisionMutation.mutate(provisionData);
        }}>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-text-subtle uppercase tracking-widest">Username</label>
              <Input 
                placeholder="e.g. jdoe" 
                value={provisionData.username}
                onChange={(e) => setProvisionData({ ...provisionData, username: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-text-subtle uppercase tracking-widest">Email Address</label>
              <Input 
                type="email" 
                placeholder="jdoe@magnet.ai" 
                value={provisionData.email}
                onChange={(e) => setProvisionData({ ...provisionData, email: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-text-subtle uppercase tracking-widest">Initial Password</label>
              <Input 
                type="password" 
                placeholder="••••••••" 
                value={provisionData.password}
                onChange={(e) => setProvisionData({ ...provisionData, password: e.target.value })}
                required
              />
            </div>
          </div>
          <div className="flex gap-4 pt-4">
            <Button variant="ghost" className="flex-1" type="button" onClick={() => setIsProvisionModalOpen(false)}>Cancel</Button>
            <Button className="flex-1" type="submit" isLoading={provisionMutation.isPending}>Create Identity</Button>
          </div>
        </form>
      </Modal>

      <Modal 
        isOpen={!!roleModalUser} 
        onClose={() => setRoleModalUser(null)} 
        title={`Manage Roles: ${roleModalUser?.username}`}
      >
        <div className="space-y-3">
          {availableRoles?.map(role => {
            const hasRole = roleModalUser?.roles.includes(role.name);
            return (
              <div key={role.name} className="flex items-center justify-between p-4 border border-bg-border rounded-xl bg-bg-surface">
                <div>
                  <p className="font-bold uppercase tracking-widest text-sm">{role.name}</p>
                </div>
                <Button 
                  size="sm"
                  variant={hasRole ? "danger" : "secondary"}
                  onClick={() => {
                    if (hasRole) {
                      revokeRoleMutation.mutate({ userId: roleModalUser!.user_id, role: role.name });
                    } else {
                      assignRoleMutation.mutate({ userId: roleModalUser!.user_id, role: role.name });
                    }
                    // Optimistically update the local modal state so the toggle is instant
                    setRoleModalUser(prev => prev ? {
                      ...prev, 
                      roles: hasRole ? prev.roles.filter(r => r !== role.name) : [...prev.roles, role.name]
                    } : null);
                  }}
                >
                  {hasRole ? 'Revoke' : 'Assign'}
                </Button>
              </div>
            );
          })}
        </div>
      </Modal>


      <Card className="overflow-hidden border-bg-border">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-bg-surface border-b border-bg-border">
              <th className="px-6 py-4 text-xs font-bold text-text-subtle uppercase tracking-widest leading-none">User Identity</th>
              <th className="px-6 py-4 text-xs font-bold text-text-subtle uppercase tracking-widest leading-none">Access Roles</th>
              <th className="px-6 py-4 text-xs font-bold text-text-subtle uppercase tracking-widest leading-none">System Status</th>
              <th className="px-6 py-4 text-right"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-bg-border/50">
            {isLoading ? (
               [1,2,3].map(i => <tr key={i}><td colSpan={4}><Card className="h-16 animate-pulse border-none shadow-none bg-bg-surface/50"><div/></Card></td></tr>)
            ) : users?.map((user) => (
              <tr key={user.user_id} className="hover:bg-white/[0.02] transition-colors group">
                <td className="px-6 py-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-bg-surface flex items-center justify-center font-bold text-sm border border-bg-border">
                      {user.username[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-sm leading-none mb-1">{user.username}</p>
                      <p className="text-xs text-text-subtle font-medium leading-none">{user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-5">
                  <div className="flex flex-wrap gap-1.5">
                    {user.roles.map((role) => (
                      <Badge 
                        key={role} 
                        variant={role === 'superadmin' ? 'danger' : role === 'admin' ? 'warning' : 'info'}
                        className="group-hover:ring-1 group-hover:ring-white/10"
                      >
                        {role}
                      </Badge>
                    ))}
                    <button 
                      className="w-6 h-6 rounded-md bg-bg-surface border border-bg-border flex items-center justify-center hover:bg-primary/20 hover:border-primary/50 text-text-subtle hover:text-primary transition-all"
                      onClick={() => setRoleModalUser(user)}
                    >
                      <Shield className="w-3 h-3" />
                    </button>

                  </div>
                </td>
                <td className="px-6 py-5">
                   <div className="flex items-center gap-2">
                     <div className={cn('w-2 h-2 rounded-full', user.status === 'active' ? 'bg-success ring-4 ring-success/20' : 'bg-danger block')}></div>
                     <span className="text-xs font-bold uppercase tracking-wide leading-none">{user.status}</span>
                   </div>
                </td>
                <td className="px-6 py-5 text-right">
                   <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                     <Button variant="ghost" size="sm" className="p-2 h-8 w-8 hover:bg-bg-surface" onClick={() => toggleStatusMutation.mutate({ userId: user.user_id, status: user.status === 'active' ? 'inactive' : 'active' })}>
                       {user.status === 'active' ? <MinusCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4 text-success" />}
                     </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="p-2 h-8 w-8 text-danger/60 hover:bg-danger/10"
                        onClick={() => {
                          if (confirm('Permanently revoke this identity?')) {
                            deleteUserMutation.mutate(user.user_id);
                          }
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                   </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
};
