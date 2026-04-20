import { useEffect, useState } from 'react';
import { collection, getDocs, addDoc, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { Patient } from '../types';
import { 
  Search, 
  Plus, 
  UserPlus, 
  MoreVertical, 
  Filter,
  ChevronRight,
  User
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';

export default function PatientList() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newPatient, setNewPatient] = useState<Partial<Patient>>({
    gender: 'L',
    maritalStatus: 'Belum Menikah',
  });

  const fetchPatients = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'patients'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      setPatients(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Patient)));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  const handleAddPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const patientData = {
        ...newPatient,
        medicalRecordNumber: `RM-${Date.now().toString().slice(-6)}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await addDoc(collection(db, 'patients'), patientData);
      setIsModalOpen(false);
      fetchPatients();
    } catch (err) {
      console.error(err);
    }
  };

  const filteredPatients = patients.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.nik.includes(search) ||
    p.medicalRecordNumber.includes(search)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Data Master Pasien</h1>
          <p className="text-slate-500 font-medium">Kelola identitas dan rekam medis pasien.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-2xl transition-all shadow-lg shadow-blue-200"
        >
          <UserPlus className="w-5 h-5" />
          <span>Tambah Pasien Baru</span>
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Cari Nama, NIK, atau No. RM..."
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-600 font-semibold hover:bg-slate-100 transition-colors">
            <Filter className="w-5 h-5" />
            <span>Filter</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Pasien</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">No. RM / NIK</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Gender / Umur</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Kontak</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  </td>
                </tr>
              ) : filteredPatients.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500 font-medium">
                    Tidak ada data pasien ditemukan.
                  </td>
                </tr>
              ) : (
                filteredPatients.map((patient) => (
                  <tr key={patient.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold border border-blue-100">
                          {patient.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{patient.name}</p>
                          <p className="text-xs text-slate-500 font-medium">{patient.occupation}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-slate-700">{patient.medicalRecordNumber}</p>
                      <p className="text-xs text-slate-400 font-medium">{patient.nik}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                          patient.gender === 'L' ? "bg-blue-100 text-blue-700" : "bg-pink-100 text-pink-700"
                        )}>
                          {patient.gender === 'L' ? 'Laki-laki' : 'Perempuan'}
                        </span>
                        <span className="text-sm text-slate-600 font-medium">
                          {new Date().getFullYear() - new Date(patient.birthDate).getFullYear()} Thn
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-slate-700 font-medium">{patient.phone}</p>
                      <p className="text-xs text-slate-400 truncate max-w-[150px]">{patient.address}</p>
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        to={`/patients/${patient.id}`}
                        className="inline-flex items-center gap-1 px-4 py-2 bg-blue-50 text-blue-700 rounded-xl text-sm font-bold hover:bg-blue-600 hover:text-white transition-all"
                      >
                        Detail <ChevronRight className="w-4 h-4" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Patient Modal */}
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
              className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <h2 className="text-xl font-bold text-slate-900">Tambah Pasien Baru</h2>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>

              <form onSubmit={handleAddPatient} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Nama Lengkap</label>
                    <input
                      required
                      type="text"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                      onChange={(e) => setNewPatient({ ...newPatient, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">NIK</label>
                    <input
                      required
                      type="text"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                      onChange={(e) => setNewPatient({ ...newPatient, nik: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Tempat Lahir</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                      onChange={(e) => setNewPatient({ ...newPatient, birthPlace: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Tanggal Lahir</label>
                    <input
                      required
                      type="date"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                      onChange={(e) => setNewPatient({ ...newPatient, birthDate: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Jenis Kelamin</label>
                    <select
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                      onChange={(e) => setNewPatient({ ...newPatient, gender: e.target.value as 'L' | 'P' })}
                    >
                      <option value="L">Laki-laki</option>
                      <option value="P">Perempuan</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Agama</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                      onChange={(e) => setNewPatient({ ...newPatient, religion: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Bangsa</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                      onChange={(e) => setNewPatient({ ...newPatient, nationality: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Golongan Darah</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                      onChange={(e) => setNewPatient({ ...newPatient, bloodType: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">No. HP</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                      onChange={(e) => setNewPatient({ ...newPatient, phone: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Pekerjaan</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                      onChange={(e) => setNewPatient({ ...newPatient, occupation: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Pendidikan</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                      onChange={(e) => setNewPatient({ ...newPatient, education: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Status Pernikahan</label>
                    <select
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                      onChange={(e) => setNewPatient({ ...newPatient, maritalStatus: e.target.value })}
                    >
                      <option value="Belum Menikah">Belum Menikah</option>
                      <option value="Menikah">Menikah</option>
                      <option value="Cerai">Cerai</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Berat Badan (kg)</label>
                    <input
                      type="number"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                      onChange={(e) => setNewPatient({ ...newPatient, weight: parseFloat(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Tinggi Badan (cm)</label>
                    <input
                      type="number"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                      onChange={(e) => setNewPatient({ ...newPatient, height: parseFloat(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Range Pendapatan</label>
                    <select
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                      onChange={(e) => setNewPatient({ ...newPatient, incomeRange: e.target.value })}
                    >
                      <option value="">Pilih Range Pendapatan</option>
                      <option value="< 1 Juta">{'<'} 1 Juta</option>
                      <option value="1 - 3 Juta">1 - 3 Juta</option>
                      <option value="3 - 5 Juta">3 - 5 Juta</option>
                      <option value="5 - 10 Juta">5 - 10 Juta</option>
                      <option value="> 10 Juta">{'>'} 10 Juta</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Hobi / Aktivitas Rekreasi</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="Contoh: Membaca, Berenang"
                      onChange={(e) => setNewPatient({ ...newPatient, hobbies: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Alamat Lengkap</label>
                  <textarea
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none h-24"
                    onChange={(e) => setNewPatient({ ...newPatient, address: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Asuransi Kesehatan</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                      onChange={(e) => setNewPatient({ ...newPatient, insurance: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Sumber Rujukan</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                      onChange={(e) => setNewPatient({ ...newPatient, referralSource: e.target.value })}
                    />
                  </div>
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
                    Simpan Pasien
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

function X(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
  );
}
