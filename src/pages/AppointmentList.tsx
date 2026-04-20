import { useEffect, useState } from 'react';
import { collection, getDocs, addDoc, updateDoc, doc, query, orderBy, where } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Appointment, Patient } from '../types';
import { 
  Calendar as CalendarIcon, 
  Plus, 
  Clock, 
  User, 
  CheckCircle2, 
  XCircle,
  ChevronLeft,
  ChevronRight,
  Search,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format, addDays, startOfToday, isSameDay } from 'date-fns';
import { id } from 'date-fns/locale';
import { cn } from '../lib/utils';

export default function AppointmentList() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(startOfToday());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [newAppointment, setNewAppointment] = useState<Partial<Appointment>>({
    status: 'scheduled',
    date: new Date().toISOString(),
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const aSnap = await getDocs(collection(db, 'appointments'));
      setAppointments(aSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Appointment)));
      
      const pSnap = await getDocs(collection(db, 'patients'));
      setPatients(pSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Patient)));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUpdateStatus = async (appointmentId: string, status: 'completed' | 'cancelled') => {
    setIsProcessing(true);
    try {
      await updateDoc(doc(db, 'appointments', appointmentId), { status });
      await fetchData();
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `appointments/${appointmentId}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAddAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    try {
      await addDoc(collection(db, 'appointments'), {
        ...newAppointment,
        createdAt: new Date().toISOString(),
      });
      setIsModalOpen(false);
      await fetchData();
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'appointments');
    } finally {
      setIsProcessing(false);
    }
  };

  const dayRange = Array.from({ length: 7 }, (_, i) => addDays(startOfToday(), i - 3));

  const filteredAppointments = appointments.filter(a => isSameDay(new Date(a.date), selectedDate));

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Jadwal & Janji Temu</h1>
          <p className="text-slate-500 font-medium">Kelola antrian dan jadwal praktik dokter.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-2xl transition-all shadow-lg shadow-blue-200"
        >
          <Plus className="w-5 h-5" />
          <span>Buat Janji Baru</span>
        </button>
      </div>

      {/* Calendar Strip */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-bold text-slate-900 text-lg">{format(selectedDate, 'MMMM yyyy', { locale: id })}</h3>
          <div className="flex gap-2">
            <button onClick={() => setSelectedDate(addDays(selectedDate, -1))} className="p-2 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors">
              <ChevronLeft className="w-5 h-5 text-slate-600" />
            </button>
            <button onClick={() => setSelectedDate(addDays(selectedDate, 1))} className="p-2 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors">
              <ChevronRight className="w-5 h-5 text-slate-600" />
            </button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-4">
          {dayRange.map((date) => (
            <button
              key={date.toISOString()}
              onClick={() => setSelectedDate(date)}
              className={cn(
                "flex flex-col items-center p-4 rounded-2xl transition-all group",
                isSameDay(date, selectedDate)
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-100"
                  : "bg-slate-50 text-slate-500 hover:bg-slate-100"
              )}
            >
              <span className="text-[10px] font-bold uppercase mb-1">{format(date, 'EEE', { locale: id })}</span>
              <span className="text-xl font-bold">{format(date, 'dd')}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Appointment List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <h3 className="font-bold text-slate-900 text-lg mb-4">Daftar Antrian - {format(selectedDate, 'dd MMMM yyyy', { locale: id })}</h3>
          {loading ? (
            <div className="animate-pulse space-y-4">
              {[1, 2, 3].map(i => <div key={i} className="h-24 bg-slate-200 rounded-3xl" />)}
            </div>
          ) : filteredAppointments.length === 0 ? (
            <div className="bg-white p-12 rounded-3xl border border-dashed border-slate-300 text-center">
              <CalendarIcon className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 font-medium">Tidak ada janji temu untuk hari ini.</p>
            </div>
          ) : (
            filteredAppointments.map((app) => {
              const patient = patients.find(p => p.id === app.patientId);
              return (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={app.id}
                  className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between group hover:border-blue-200 transition-all"
                >
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col items-center justify-center text-slate-900">
                      <Clock className="w-4 h-4 text-slate-400 mb-1" />
                      <span className="text-sm font-bold">{format(new Date(app.date), 'HH:mm')}</span>
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 text-lg">{patient?.name || 'Pasien Umum'}</p>
                      <p className="text-sm text-slate-500 font-medium flex items-center gap-2">
                        <User className="w-3 h-3" />
                        {app.notes || 'Pemeriksaan Gigi'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={cn(
                      "px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider",
                      app.status === 'scheduled' ? "bg-blue-100 text-blue-700" :
                      app.status === 'completed' ? "bg-emerald-100 text-emerald-700" :
                      "bg-red-100 text-red-700"
                    )}>
                      {app.status === 'scheduled' ? 'Terjadwal' : 
                       app.status === 'completed' ? 'Selesai' : 'Batal'}
                    </span>
                    
                    {app.status === 'scheduled' && (
                      <div className="flex items-center gap-1">
                        <button 
                          disabled={isProcessing}
                          onClick={() => handleUpdateStatus(app.id, 'completed')}
                          className="p-2 hover:bg-emerald-50 rounded-xl text-emerald-600 transition-colors disabled:opacity-50"
                          title="Tandai Selesai"
                        >
                          <CheckCircle2 className="w-5 h-5" />
                        </button>
                        <button 
                          disabled={isProcessing}
                          onClick={() => handleUpdateStatus(app.id, 'cancelled')}
                          className="p-2 hover:bg-red-50 rounded-xl text-red-600 transition-colors disabled:opacity-50"
                          title="Batalkan"
                        >
                          <XCircle className="w-5 h-5" />
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })
          )}
        </div>

        {/* Quick Stats/Summary */}
        <div className="space-y-6">
          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
            <h3 className="font-bold text-slate-900 text-lg mb-6">Ringkasan Hari Ini</h3>
            <div className="space-y-6">
              <SummaryItem label="Total Janji" value={filteredAppointments.length} icon={CalendarIcon} color="bg-blue-100 text-blue-600" />
              <SummaryItem label="Selesai" value={filteredAppointments.filter(a => a.status === 'completed').length} icon={CheckCircle2} color="bg-emerald-100 text-emerald-600" />
              <SummaryItem label="Dibatalkan" value={filteredAppointments.filter(a => a.status === 'cancelled').length} icon={XCircle} color="bg-red-100 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Add Appointment Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <h2 className="text-xl font-bold text-slate-900">Buat Janji Temu Baru</h2>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                  <XCircle className="w-5 h-5 text-slate-500" />
                </button>
              </div>

              <form onSubmit={handleAddAppointment} className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Pilih Pasien</label>
                  <select
                    required
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    onChange={(e) => setNewAppointment({ ...newAppointment, patientId: e.target.value })}
                  >
                    <option value="">-- Pilih Pasien --</option>
                    {patients.map(p => <option key={p.id} value={p.id}>{p.name} ({p.medicalRecordNumber})</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Tanggal</label>
                    <input
                      required
                      type="date"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                      onChange={(e) => {
                        const time = newAppointment.date?.split('T')[1] || '09:00:00.000Z';
                        setNewAppointment({ ...newAppointment, date: `${e.target.value}T${time}` });
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Waktu</label>
                    <input
                      required
                      type="time"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                      onChange={(e) => {
                        const date = newAppointment.date?.split('T')[0] || format(new Date(), 'yyyy-MM-dd');
                        setNewAppointment({ ...newAppointment, date: `${date}T${e.target.value}:00.000Z` });
                      }}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Catatan / Keluhan</label>
                  <textarea
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none h-24"
                    onChange={(e) => setNewAppointment({ ...newAppointment, notes: e.target.value })}
                  />
                </div>
                <div className="flex justify-end gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-6 py-3 text-slate-600 font-bold hover:bg-slate-100 rounded-xl transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-8 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
                  >
                    Simpan Janji
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

const SummaryItem = ({ label, value, icon: Icon, color }: any) => (
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-3">
      <div className={cn("p-2 rounded-lg", color)}>
        <Icon className="w-4 h-4" />
      </div>
      <span className="text-sm font-semibold text-slate-600">{label}</span>
    </div>
    <span className="text-lg font-bold text-slate-900">{value}</span>
  </div>
);
