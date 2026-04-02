import { useQuery } from '@tanstack/react-query';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { ShieldAlert, Zap, Lock } from 'lucide-react';
import api from '../api/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Trash2, ShieldPlus, Edit3 } from 'lucide-react';

interface Role {
  id: string;
  name: string;
  description: string;
  is_system: boolean;
  permissions: string[];
}

export const RolesPage = () => {
  const queryClient = useQueryClient();
  const { data: roles, isLoading } = useQuery<Role[]>({
    queryKey: ['roles'],
    queryFn: async () => (await api.get('/api/v1/roles')).data.roles,
  });

  const { data: availablePermissions } = useQuery<{ id: string; slug: string; resource: string }[]>({
    queryKey: ['permissions'],
    queryFn: async () => (await api.get('/api/v1/permissions')).data.permissions,
  });


  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
  const [formData, setFormData] = useState<{ name: string; description: string; permissions: string[] }>({ name: '', description: '', permissions: [] });

  const createRoleMutation = useMutation({
    mutationFn: async (data: typeof formData) => api.post('/api/v1/roles', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      setIsModalOpen(false);
      setFormData({ name: '', description: '', permissions: [] });
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: async (data: typeof formData & { id: string }) => api.put(`/api/v1/roles/${data.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      setIsModalOpen(false);
      setEditingRoleId(null);
      setFormData({ name: '', description: '', permissions: [] });
    },
  });

  const deleteRoleMutation = useMutation({
    mutationFn: async (roleId: string) => api.delete(`/api/v1/roles/${roleId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['roles'] }),
  });

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black tracking-tightest mb-2">Security Architecture</h1>
          <p className="text-text-subtle font-medium">Fine-grained permission mapping across system roles</p>
        </div>
        <Button className="gap-2" onClick={() => {
           setEditingRoleId(null);
           setFormData({ name: '', description: '', permissions: [] });
           setIsModalOpen(true);
        }}>
           <ShieldPlus className="w-4 h-4" /> Create Security Role
        </Button>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingRoleId(null); }} title={editingRoleId ? "Engine Config: Edit Role" : "Engine Config: New Role"}>
        <form className="space-y-6" onSubmit={(e) => { 
           e.preventDefault(); 
           if (editingRoleId) {
              updateRoleMutation.mutate({ ...formData, id: editingRoleId });
           } else {
              createRoleMutation.mutate(formData); 
           }
        }}>
           <div className="space-y-4">
              <div className="space-y-2">
                 <label className="text-xs font-bold text-text-subtle uppercase tracking-widest">Internal Identifier</label>
                 <Input 
                   placeholder="e.g. security_auditor" 
                   value={formData.name}
                   onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                   required
                   disabled={!!editingRoleId}
                 />
              </div>
              <div className="space-y-2">
                 <label className="text-xs font-bold text-text-subtle uppercase tracking-widest">Purpose Description</label>
                 <Input 
                   placeholder="Full audit visibility over logs..." 
                   value={formData.description}
                   onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                   required
                 />
              </div>
              
              <div className="space-y-4 max-h-[40vh] overflow-y-auto mt-4 pr-2">
                 <label className="text-xs font-bold text-text-subtle uppercase tracking-widest block sticky top-0 bg-bg-surface z-10 py-2">Attach Capabilities</label>
                 {availablePermissions?.map(perm => (
                   <label key={perm.slug} className="flex items-center gap-3 p-3 border border-bg-border rounded-xl cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-colors">
                     <input 
                       type="checkbox" 
                       className="w-4 h-4 rounded appearance-none border border-bg-border bg-bg-surface checked:bg-primary checked:border-primary focus:ring-1 focus:ring-primary focus:ring-offset-1 focus:ring-offset-[#0f111a] transition-colors relative checked:after:content-['✓'] checked:after:absolute checked:after:text-white checked:after:text-[10px] checked:after:font-bold checked:after:left-[3px] checked:after:-top-[1px]"
                       checked={formData.permissions.includes(perm.slug)}
                       onChange={(e) => {
                         if (e.target.checked) {
                           setFormData({ ...formData, permissions: [...formData.permissions, perm.slug] });
                         } else {
                           setFormData({ ...formData, permissions: formData.permissions.filter(p => p !== perm.slug) });
                         }
                       }}
                     />
                     <div>
                       <p className="font-bold text-sm tracking-tight">{perm.slug.replace(':', ' → ').replace(':', ' → ')}</p>
                       <p className="text-xs text-text-subtle capitalize">{perm.resource} scope execution</p>
                     </div>
                   </label>
                 ))}
              </div>
           </div>
           <div className="flex gap-4 pt-4">
             <Button variant="ghost" className="flex-1" type="button" onClick={() => { setIsModalOpen(false); setEditingRoleId(null); }}>Abort</Button>
             <Button className="flex-1" type="submit" isLoading={createRoleMutation.isPending || updateRoleMutation.isPending}>Commit Protocol</Button>
           </div>
        </form>
      </Modal>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          [1,2,3].map(i => <Card key={i} className="h-64 animate-pulse"><div/></Card>)
        ) : roles?.map((role) => (
          <Card key={role.id} className="p-8 group hover:border-primary/40 transition-all flex flex-col">
             <div className="flex items-start justify-between mb-6">
                <div className="p-3 bg-primary/10 rounded-2xl text-primary ring-1 ring-primary/20">
                  {role.name === 'superadmin' ? <ShieldAlert className="w-6 h-6" /> : <Lock className="w-6 h-6" />}
                </div>
                <div className="flex gap-2">
                  {!role.is_system && (
                    <>
                      <Button 
                        variant="ghost" 
                        className="p-2 h-8 w-8 text-text-subtle hover:bg-white/10 rounded-xl"
                        onClick={() => {
                          setEditingRoleId(role.id);
                          setFormData({ name: role.name, description: role.description, permissions: role.permissions || [] });
                          setIsModalOpen(true);
                        }}
                      >
                        <Edit3 className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        className="p-2 h-8 w-8 text-danger hover:bg-danger/10 rounded-xl"
                        onClick={() => { if (confirm(`Decommission ${role.name}?`)) deleteRoleMutation.mutate(role.id); }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                  <Badge variant={role.name === 'superadmin' ? 'danger' : 'info'}>{role.name}</Badge>
                </div>
             </div>
            
            <h3 className="text-xl font-bold mb-2 capitalize">{role.name} Entity</h3>
            <p className="text-sm text-text-subtle font-medium leading-relaxed mb-6">{role.description}</p>
            
            <div className="mt-auto space-y-4">
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest text-text-subtle">
                <span>Core Capabilities</span>
                <span className="text-primary">{(role.permissions || []).length} nodes</span>
              </div>
              <div className="flex flex-wrap gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                {(role.permissions || []).slice(0, 6).map(perm => (
                  <div key={perm} className="px-2 py-1 rounded-md bg-white/5 border border-white/5 text-[10px] font-bold tracking-tight">
                    {perm.replace(':', ' → ')}
                  </div>
                ))}
                {(role.permissions || []).length > 6 && (
                   <div className="px-2 py-1 rounded-md bg-primary/10 text-primary text-[10px] font-black italic">
                     +{(role.permissions || []).length - 6} more
                   </div>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-10 border-dashed border-2 border-bg-border flex flex-col items-center justify-center text-center">
         <div className="p-4 bg-accent/10 rounded-full mb-4 text-accent ring-8 ring-accent/5">
           <Zap className="w-6 h-6" />
         </div>
         <h4 className="font-bold text-lg mb-1">Advanced Policy Engine</h4>
         <p className="text-text-subtle text-sm max-w-md">Propagate custom security policies across the microservice mesh using the additive RBAC engine.</p>
      </Card>
    </div>
  );
};
