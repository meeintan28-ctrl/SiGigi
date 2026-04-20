import { useEffect, useState } from 'react';
import { collection, getDocs, query, where, limit, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { 
  Users, 
  Calendar, 
  Activity, 
  TrendingUp, 
  AlertCircle,
  ArrowRight,
  Clock
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  Cell
} from 'recharts';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';
import { format, startOfToday } from 'date-fns';
import { id } from 'date-fns/locale';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalPatients: 0,
    todayVisits: 0,
    avgDmft: 3.2,
    avgOhis: 1.8,
  });
  const [recentAppointments, setRecentAppointments] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const patientsSnap = await getDocs(collection(db, 'patients'));
        const allPatients = patientsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setPatients(allPatients);

        // Fetch today's appointments
        const todayStr = format(startOfToday(), 'yyyy-MM-dd');
        const appointmentsSnap = await getDocs(collection(db, 'appointments'));
        const allAppointments = appointmentsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));
        
        const todayVisits = allAppointments.filter(app => app.date.startsWith(todayStr));
        
        setStats(prev => ({
          ...prev,
          totalPatients: patientsSnap.size,
          todayVisits: todayVisits.length,
        }));

        // Fetch 5 most recent upcoming or today's appointments
        const sortedAppts = allAppointments
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
          .filter(app => new Date(app.date).getTime() >= startOfToday().getTime())
          .slice(0, 5);

        setRecentAppointments(sortedAppts);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const dmftData = [
    { name: 'Jan', value: 3.5 },
    { name: 'Feb', value: 3.2 },
    { name: 'Mar', value: 3.0 },
    { name: 'Apr', value: 2.8 },
    { name: 'Mei', value: 2.5 },
  ];

  const ohisData = [
    { name: 'Baik', value: 45, color: '#10b981' },
    { name: 'Sedang', value: 35, color: '#f59e0b' },
    { name: 'Buruk', value: 20, color: '#ef4444' },
  ];

  const StatCard = ({ title, value, icon: Icon, color, trend }: any) => (
    <motion.div 
      whileHover={{ y: -4 }}
      className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm shadow-slate-200/50 flex items-start justify-between"
    >
      <div>
        <p className="text-sm font-semibold text-slate-500 mb-1">{title}</p>
        <h3 className="text-3xl font-bold text-slate-900 tracking-tight">{value}</h3>
        {trend && (
          <p className="text-xs font-medium text-green-600 mt-2 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            {trend} dari bulan lalu
          </p>
        )}
      </div>
      <div className={cn("p-3 rounded-2xl", color)}>
        <Icon className="w-6 h-6 text-white" />
      </div>
    </motion.div>
  );

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Dashboard Ringkasan</h1>
          <p className="text-slate-500 font-medium">Selamat datang kembali di Sistem DentalCare.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-white border border-slate-200 rounded-2xl text-sm font-semibold text-slate-600 shadow-sm capitalize">
            {format(new Date(), 'EEEE, dd MMMM yyyy', { locale: id })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Pasien" value={stats.totalPatients} icon={Users} color="bg-blue-600" trend="+12%" />
        <StatCard title="Kunjungan Hari Ini" value={stats.todayVisits} icon={Calendar} color="bg-indigo-600" trend="+5%" />
        <StatCard title="Rata-rata DMF-T" value={stats.avgDmft} icon={Activity} color="bg-amber-500" trend="-0.2" />
        <StatCard title="Rata-rata OHI-S" value={stats.avgOhis} icon={TrendingUp} color="bg-emerald-500" trend="-0.1" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* DMF-T Trend */}
        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-bold text-slate-900 text-lg">Tren DMF-T Pasien</h3>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
              <div className="w-3 h-3 rounded-full bg-blue-600" />
              Target Penurunan
            </div>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dmftData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Line type="monotone" dataKey="value" stroke="#2563eb" strokeWidth={4} dot={{ r: 6, fill: '#2563eb', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* OHI-S Distribution */}
        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
          <h3 className="font-bold text-slate-900 text-lg mb-8">Distribusi Status OHI-S</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ohisData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <Tooltip 
                   contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="value" radius={[8, 8, 0, 0]} barSize={60}>
                  {ohisData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Appointments */}
        <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-bold text-slate-900 text-lg">Kunjungan Hari Ini</h3>
            <Link to="/appointments" className="text-sm font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1">
              Lihat Semua <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="space-y-4">
            {recentAppointments.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <p className="text-sm text-slate-500 font-medium">Tidak ada kunjungan hari ini.</p>
              </div>
            ) : (
              recentAppointments.map((app) => {
                const patient = patients.find(p => p.id === app.patientId);
                return (
                  <div key={app.id} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-blue-200 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex flex-col items-center justify-center text-slate-900">
                        <Clock className="w-4 h-4 text-slate-400 mb-0.5" />
                        <span className="text-sm font-bold">{format(new Date(app.date), 'HH:mm')}</span>
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">{patient?.name || 'Pasien Umum'}</p>
                        <p className="text-xs text-slate-500 font-medium">{app.notes || 'Pemeriksaan Rutin'}</p>
                      </div>
                    </div>
                    <div className={cn(
                      "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                      app.status === 'scheduled' ? "bg-blue-100 text-blue-700" :
                      app.status === 'completed' ? "bg-emerald-100 text-emerald-700" :
                      "bg-amber-100 text-amber-700"
                    )}>
                      {app.status}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Notifications/Follow-ups */}
        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
          <h3 className="font-bold text-slate-900 text-lg mb-8">Follow-up Pasien</h3>
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="shrink-0 w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">Siti Aminah</p>
                <p className="text-xs text-slate-500 mt-1">Jadwal scaling 6 bulan sudah jatuh tempo.</p>
                <button className="mt-2 text-xs font-bold text-blue-600 hover:underline">Hubungi Pasien</button>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="shrink-0 w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <Activity className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">Andi Wijaya</p>
                <p className="text-xs text-slate-500 mt-1">Evaluasi pasca root planing hari ke-7.</p>
                <button className="mt-2 text-xs font-bold text-blue-600 hover:underline">Lihat Rekam Medis</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
