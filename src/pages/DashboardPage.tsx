import { useQuery } from '@tanstack/react-query';
import { BarChart3, Clock, AlertCircle, CheckCircle2, TrendingUp } from 'lucide-react';
import api from '../api/client';
import { Card } from '../components/ui/Card';
import { formatDate } from '../lib/utils';

export const DashboardPage = () => {
  const { data: stats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => (await api.get('/api/v1/admin/dashboard')).data,
    initialData: { kpi: { total_tickets: 0, open_tickets: 0, avg_res_time: '0m' } }
  });

  const kpis = [
    { label: 'Total Tickets', value: stats.kpi.total_tickets, icon: BarChart3, color: 'text-primary' },
    { label: 'Open Tickets',  value: stats.kpi.open_tickets,  icon: Clock,     color: 'text-warning' },
    { label: 'Resolution',    value: stats.kpi.avg_res_time, icon: TrendingUp, color: 'text-success' },
  ];

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between">
        <div>
           <h1 className="text-4xl font-black tracking-tightest mb-2">Systems Overview</h1>
           <p className="text-text-subtle font-medium">Monitoring platform health and ticket metrics</p>
        </div>
        <div className="text-right">
           <p className="text-xs font-bold text-text-subtle uppercase tracking-widest mb-1">Live Update</p>
           <p className="text-sm font-bold">{formatDate(new Date())}</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-3 gap-6">
        {kpis.map((kpi) => (
          <Card key={kpi.label} className="p-8 flex items-center justify-between group hover:border-primary/30 transition-all">
            <div>
              <p className="text-sm font-bold text-text-subtle uppercase tracking-wider mb-2">{kpi.label}</p>
              <p className="text-4xl font-black">{kpi.value}</p>
            </div>
            <div className={cn('p-4 rounded-2xl bg-white/5 group-hover:bg-primary/10 transition-colors', kpi.color)}>
              <kpi.icon className="w-8 h-8" />
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-8">
         <Card className="p-8 h-80 flex items-center justify-center">
            <p className="text-text-subtle font-bold italic tracking-wider">Operational Integrity — AI Active</p>
         </Card>
         <Card className="p-8 h-80 flex flex-col">
            <h3 className="font-bold mb-6 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-warning" /> Critical Alerts
            </h3>
            <div className="flex-1 border-t border-bg-border pt-6">
               <div className="flex items-start gap-4 p-4 rounded-xl bg-bg-surface border border-bg-border">
                  <div className="p-2 bg-success/10 rounded-lg"><CheckCircle2 className="w-4 h-4 text-success"/></div>
                  <div>
                    <p className="text-sm font-bold">Infrastucture Nominal</p>
                    <p className="text-xs text-text-subtle font-medium mt-0.5">PostgreSQL Cloud Cluster synchronized</p>
                  </div>
               </div>
            </div>
         </Card>
      </div>
    </div>
  );
};

// Internal utility helper to avoid import loops since Page and Layout are separate files
const cn = (...inputs: any[]) => inputs.filter(Boolean).join(' ');
