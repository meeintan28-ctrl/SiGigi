import { useEffect, useState } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { Patient, MedicalRecord } from '../types';
import { 
  FileText, 
  Download, 
  Printer, 
  Filter, 
  BarChart3, 
  PieChart as PieChartIcon,
  Table as TableIcon,
  ChevronRight,
  Activity
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

export default function ReportList() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const pSnap = await getDocs(collection(db, 'patients'));
        setPatients(pSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Patient)));
        
        // In a real app, we'd query all records across all patients
        // For this demo, we'll mock some aggregate data
        setLoading(false);
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();
  }, []);

  const diagnosisData = [
    { name: 'Karies Gigi', value: 45 },
    { name: 'Gingivitis', value: 30 },
    { name: 'Periodontitis', value: 15 },
    { name: 'Halitosis', value: 10 },
  ];

  const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444'];

  const reportTypes = [
    { id: 'individual', name: 'Laporan Riwayat Pasien', description: 'Rekam medis lengkap per individu.', icon: FileText },
    { id: 'aggregate', name: 'Laporan Agregat Bulanan', description: 'Statistik penyakit dan kunjungan.', icon: BarChart3 },
    { id: 'epidemiology', name: 'Laporan Epidemiologi', description: 'Prevalensi DMF-T dan OHI-S populasi.', icon: Activity },
  ];

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Modul Pelaporan</h1>
          <p className="text-slate-500 font-medium">Analisis data kesehatan gigi dan mulut terstandar.</p>
        </div>
        <div className="flex items-center gap-3">
           <button className="px-6 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors flex items-center gap-2">
             <Filter className="w-4 h-4" />
             Filter Periode
           </button>
           <button className="px-6 py-3 bg-blue-600 text-white rounded-2xl text-sm font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 flex items-center gap-2">
             <Download className="w-4 h-4" />
             Export PDF/Excel
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Report Selection */}
        <div className="space-y-4">
          <h3 className="font-bold text-slate-900 text-lg mb-4">Jenis Laporan</h3>
          {reportTypes.map((report) => (
            <button
              key={report.id}
              className="w-full text-left p-6 bg-white rounded-3xl border border-slate-100 shadow-sm hover:border-blue-200 hover:shadow-md transition-all group"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-blue-50 rounded-2xl text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <report.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">{report.name}</p>
                    <p className="text-xs text-slate-500 mt-1 font-medium leading-relaxed">{report.description}</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-blue-600 transition-colors" />
              </div>
            </button>
          ))}
        </div>

        {/* Analytics Preview */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
            <h3 className="font-bold text-slate-900 text-lg mb-8 flex items-center gap-2">
              <PieChartIcon className="w-5 h-5 text-blue-600" />
              Prevalensi Diagnosa Terbanyak
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={diagnosisData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {diagnosisData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-4">
                {diagnosisData.map((item, index) => (
                  <div key={item.name} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index] }} />
                      <span className="text-sm font-bold text-slate-700">{item.name}</span>
                    </div>
                    <span className="text-sm font-bold text-slate-900">{item.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between mb-8">
              <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                <TableIcon className="w-5 h-5 text-blue-600" />
                Ringkasan Kunjungan Bulanan
              </h3>
              <button className="text-sm font-bold text-blue-600 hover:underline">Lihat Detail</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Bulan</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Total Pasien</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Rata-rata DMF-T</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {[
                    { month: 'Maret 2026', total: 145, dmft: 3.2, status: 'Meningkat' },
                    { month: 'Februari 2026', total: 132, dmft: 3.4, status: 'Stabil' },
                    { month: 'Januari 2026', total: 120, dmft: 3.5, status: 'Menurun' },
                  ].map((row, i) => (
                    <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-900">{row.month}</td>
                      <td className="px-6 py-4 text-sm text-slate-600 font-medium">{row.total}</td>
                      <td className="px-6 py-4 text-sm text-slate-600 font-bold">{row.dmft}</td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                          row.status === 'Meningkat' ? "bg-red-100 text-red-700" :
                          row.status === 'Menurun' ? "bg-emerald-100 text-emerald-700" :
                          "bg-blue-100 text-blue-700"
                        )}>
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
