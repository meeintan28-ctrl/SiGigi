import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, getDocs, addDoc, updateDoc, setDoc, query, orderBy } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Patient, MedicalRecord, OdontogramData, UserProfile, DENTAL_DIAGNOSIS_GUIDELINES } from '../types';
import { 
  ArrowLeft, 
  User, 
  History, 
  Stethoscope, 
  Plus, 
  Save, 
  Activity, 
  ClipboardCheck,
  BookOpen,
  ChevronRight,
  ChevronDown,
  Info,
  AlertCircle,
  Printer,
  ShieldCheck,
  Sparkles,
  RefreshCw,
  Eraser
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { GoogleGenAI, Type } from "@google/genai";
import SignatureCanvas from 'react-signature-canvas';

interface PatientDetailProps {
  user: UserProfile;
}

export default function PatientDetail({ user }: PatientDetailProps) {
  const { id: patientId } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [odontogram, setOdontogram] = useState<OdontogramData>({});
  const [activeTab, setActiveTab] = useState<'history' | 'new_record' | 'odontogram'>('history');
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const patientSigPad = useRef<any>(null);
  const guardianSigPad = useRef<any>(null);
  const operatorSigPad = useRef<any>(null);

  const generateAIDiagnosis = async () => {
    setIsGeneratingAI(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      const prompt = `Sebagai Terapis Gigi dan Mulut (TGM), berikan analisis diagnosis dental hygiene berdasarkan data berikut:
      - Keluhan: ${newRecord.dentalHistory?.bagian1.reason || 'Tidak ada'}
      - OHI-S Score: ${newRecord.oralHygiene?.ohis.score || 0}
      - Debris Index: ${newRecord.oralHygiene?.ohis.totalDI || 0}
      - Calculus Index: ${newRecord.oralHygiene?.ohis.totalCI || 0}
      - Plaque Score: ${newRecord.oralHygiene?.plaqueControl.score || 0}%
      
      Berikan output dalam format JSON dengan field:
      - needs: array of strings (kebutuhan pasien)
      - causes: string (sebab/etiologi)
      - signs: string (tanda dan gejala)
      
      Gunakan bahasa Indonesia yang profesional.`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              needs: { type: Type.ARRAY, items: { type: Type.STRING } },
              causes: { type: Type.STRING },
              signs: { type: Type.STRING }
            },
            required: ["needs", "causes", "signs"]
          }
        }
      });

      const result = JSON.parse(response.text || '{}');
      setNewRecord(prev => ({
        ...prev,
        diagnosisAskesgilut: {
          needs: result.needs || [],
          causes: result.causes || '',
          signs: result.signs || ''
        }
      }));
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const generateAIIntervention = async () => {
    setIsGeneratingAI(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      const prompt = `Sebagai Terapis Gigi dan Mulut (TGM), buatkan rencana intervensi SOAPIE berdasarkan diagnosis berikut:
      - Kebutuhan: ${newRecord.diagnosisAskesgilut?.needs.join(', ')}
      - Sebab: ${newRecord.diagnosisAskesgilut?.causes}
      - Tanda/Gejala: ${newRecord.diagnosisAskesgilut?.signs}
      
      Berikan output dalam format JSON dengan field:
      - goals: string (tujuan intervensi)
      - interventions: string (rencana intervensi oleh TGM)
      
      Gunakan bahasa Indonesia yang profesional.`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              goals: { type: Type.STRING },
              interventions: { type: Type.STRING }
            },
            required: ["goals", "interventions"]
          }
        }
      });

      const result = JSON.parse(response.text || '{}');
      setNewRecord(prev => ({
        ...prev,
        planning: {
          goals: result.goals || '',
          interventions: result.interventions || ''
        }
      }));
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  // New Record State
  const [newRecord, setNewRecord] = useState<Partial<MedicalRecord>>({
    visitNumber: 1,
    vitalSigns: { bloodPressure: '', pulse: 0, respiration: 0 },
    healthHistory: {
      medicalHistory: {
        isHealthy: true,
        seriousIllness5Years: '',
        bloodDisorder: '',
        allergies: { food: '', drugs: '', anesthesia: '', weather: '', others: '' }
      },
      socialHistory: '',
      pharmacologicalHistory: {
        takingMeds: false,
        medNamePurpose: '',
        sideEffects: '',
        positiveEffects: '',
        dosageIssues: '',
        regularConsumption: false
      }
    },
    dentalHistory: {
      bagian1: {
        reason: '', concerns: [], xrayLast2Years: false, previousComplications: '',
        previousVisitOpinion: '', generalHealthImpact: '', symptoms: [],
        teethGrinding: false, biteGuard: false, appearanceConcerns: [],
        injuryHistory: '', previousTreatments: []
      },
      bagian2: {
        toolsUsed: [], toothpasteBenefits: [], brushingDuration: 0, flossingDuration: 0,
        brushingFrequency: '', flossingFrequency: '', difficultyScheduling: false,
        difficultyCleaning: [], monthlyCancerCheck: false, habits: []
      },
      bagian3: { snacks: {} },
      bagian4: { cavityRiskOpinion: '', preventionImportance: '', beliefCanMaintain: true, currentHealthOpinion: '' }
    },
    clinicalExam: { extraOral: {}, intraOral: {}, notes: '' },
    oralHygiene: {
      ohis: { debrisIndex: {}, calculusIndex: {}, totalDI: 0, totalCI: 0, score: 0, category: '' },
      plaqueControl: { teeth: {}, score: 0, category: '' }
    },
    odontogram: {},
    periodontalCalculus: {
      bleedingOnProbing: {}, attachmentLoss: {}, pocketDepth4mm: {}, extrinsicStains: {},
      calculusScore: {}, totalCalculusScore: 0
    },
    diagnosisAskesgilut: { needs: [], causes: '', signs: '' },
    planning: { goals: '', interventions: '' },
    evaluation: '',
    nextVisitDate: '',
    recommendations: '',
    informedConsent: { 
      patientSigned: false, 
      parentSigned: false, 
      witnessSigned: false, 
      operatorSigned: false,
      patientSignature: '',
      guardianSignature: '',
      operatorSignature: ''
    }
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!patientId) return;
      try {
        const pSnap = await getDoc(doc(db, 'patients', patientId));
        if (pSnap.exists()) {
          setPatient({ id: pSnap.id, ...pSnap.data() } as Patient);
        }

        const rSnap = await getDocs(query(collection(db, 'patients', patientId, 'medical_records'), orderBy('visitDate', 'desc')));
        setRecords(rSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as MedicalRecord)));

        const oSnap = await getDoc(doc(db, 'patients', patientId, 'odontogram', 'current'));
        if (oSnap.exists()) {
          setOdontogram(oSnap.data().toothData as OdontogramData);
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, `patients/${patientId}`);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [patientId]);

  const updateTooth = (num: number, s: string, surface?: string) => {
    setOdontogram(prev => {
      const tooth = prev[num] || { status: 'sou' };
      if (surface) {
        return { ...prev, [num]: { ...tooth, surfaces: { ...tooth.surfaces, [surface]: s } } };
      }
      return { ...prev, [num]: { ...tooth, status: s } };
    });
  };

  const handleSaveRecord = async () => {
    if (!patientId || !user) return;
    setIsSaving(true);
    try {
      const recordData = {
        ...newRecord,
        patientId,
        visitDate: new Date().toISOString(),
        operatorId: user.uid,
      };
      await addDoc(collection(db, 'patients', patientId, 'medical_records'), recordData);
      
      // Update odontogram if changed
      await setDoc(doc(db, 'patients', patientId, 'odontogram', 'current'), {
        patientId,
        toothData: odontogram,
        updatedAt: new Date().toISOString()
      });

      // Reset record form
      setNewRecord({
        visitNumber: (recordData.visitNumber || 1) + 1,
        vitalSigns: { bloodPressure: '', pulse: 0, respiration: 0 },
        healthHistory: {
          medicalHistory: {
            isHealthy: true,
            seriousIllness5Years: '',
            bloodDisorder: '',
            allergies: { food: '', drugs: '', anesthesia: '', weather: '', others: '' }
          },
          socialHistory: '',
          pharmacologicalHistory: {
            takingMeds: false,
            medNamePurpose: '',
            sideEffects: '',
            positiveEffects: '',
            dosageIssues: '',
            regularConsumption: false
          }
        },
        dentalHistory: {
          bagian1: {
            reason: '', concerns: [], xrayLast2Years: false, previousComplications: '',
            previousVisitOpinion: '', generalHealthImpact: '', symptoms: [],
            teethGrinding: false, biteGuard: false, appearanceConcerns: [],
            injuryHistory: '', previousTreatments: []
          },
          bagian2: {
            toolsUsed: [], toothpasteBenefits: [], brushingDuration: 0, flossingDuration: 0,
            brushingFrequency: '', flossingFrequency: '', difficultyScheduling: false,
            difficultyCleaning: [], monthlyCancerCheck: false, habits: []
          },
          bagian3: { snacks: {} },
          bagian4: { cavityRiskOpinion: '', preventionImportance: '', beliefCanMaintain: true, currentHealthOpinion: '' }
        },
        clinicalExam: { extraOral: {}, intraOral: {}, notes: '' },
        oralHygiene: {
          ohis: { debrisIndex: {}, calculusIndex: {}, totalDI: 0, totalCI: 0, score: 0, category: '' },
          plaqueControl: { teeth: {}, score: 0, category: '' }
        },
        odontogram: {},
        periodontalCalculus: {
          bleedingOnProbing: {}, attachmentLoss: {}, pocketDepth4mm: {}, extrinsicStains: {},
          calculusScore: {}, totalCalculusScore: 0
        },
        diagnosisAskesgilut: { needs: [], causes: '', signs: '' },
        planning: { goals: '', interventions: '' },
        evaluation: '',
        nextVisitDate: '',
        recommendations: '',
        informedConsent: { 
          patientSigned: false, 
          parentSigned: false, 
          witnessSigned: false, 
          operatorSigned: false,
          patientSignature: '',
          guardianSignature: '',
          operatorSignature: ''
        }
      });

      // Clear signature pads
      patientSigPad.current?.clear();
      guardianSigPad.current?.clear();
      operatorSigPad.current?.clear();

      setActiveTab('history');
      // Refresh records
      const rSnap = await getDocs(query(collection(db, 'patients', patientId, 'medical_records'), orderBy('visitDate', 'desc')));
      setRecords(rSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as MedicalRecord)));
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `patients/${patientId}/medical_records`);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;
  if (!patient) return <div>Pasien tidak ditemukan.</div>;

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/patients')} className="p-3 hover:bg-white rounded-2xl border border-transparent hover:border-slate-200 transition-all">
            <ArrowLeft className="w-6 h-6 text-slate-600" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{patient.name}</h1>
            <p className="text-slate-500 font-medium flex items-center gap-2">
              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-[10px] font-bold uppercase">{patient.medicalRecordNumber}</span>
              • {patient.nik} • {new Date().getFullYear() - new Date(patient.birthDate).getFullYear()} Tahun
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
           <button className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors">
             Edit Profil
           </button>
           <button 
             onClick={() => setActiveTab('new_record')}
             className="px-6 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 flex items-center gap-2"
           >
             <Plus className="w-4 h-4" />
             Kunjungan Baru
           </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 bg-slate-200/50 rounded-2xl w-fit">
        {[
          { id: 'history', label: 'Riwayat Kunjungan', icon: History },
          { id: 'odontogram', label: 'Odontogram', icon: Activity },
          { id: 'new_record', label: 'Pemeriksaan Baru', icon: Stethoscope },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all",
              activeTab === tab.id 
                ? "bg-white text-blue-700 shadow-sm" 
                : "text-slate-500 hover:text-slate-700"
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Patient Info Summary */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-blue-600" />
              Info Pasien
            </h3>
            <div className="space-y-4 text-sm">
              <InfoRow label="NIK" value={patient.nik} />
              <InfoRow label="Tgl Lahir" value={format(new Date(patient.birthDate), 'dd MMMM yyyy', { locale: id })} />
              <InfoRow label="Gender" value={patient.gender === 'L' ? 'Laki-laki' : 'Perempuan'} />
              <InfoRow label="Pekerjaan" value={patient.occupation} />
              <InfoRow label="Pendidikan" value={patient.education} />
              <InfoRow label="Status" value={patient.maritalStatus} />
              <InfoRow label="Asuransi" value={patient.insurance || '-'} />
              <div className="pt-4 border-t border-slate-100">
                <p className="text-xs font-bold text-slate-400 uppercase mb-1">Alamat</p>
                <p className="text-slate-700 leading-relaxed">{patient.address}</p>
              </div>
            </div>
          </div>

          <div className="bg-amber-50 p-6 rounded-3xl border border-amber-100">
            <h3 className="font-bold text-amber-900 mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-600" />
              Peringatan Medis
            </h3>
            <div className="space-y-2">
              <div className="p-3 bg-white/60 rounded-xl text-sm font-medium text-amber-800 border border-amber-200">
                Alergi: {records[0]?.healthHistory.medicalHistory.allergies.food || 'Tidak ada data'}
              </div>
              <div className="p-3 bg-white/60 rounded-xl text-sm font-medium text-amber-800 border border-amber-200">
                Penyakit: {records[0]?.healthHistory.medicalHistory.seriousIllness5Years || 'Tidak ada data'}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Tab Content */}
        <div className="lg:col-span-2">
          <AnimatePresence mode="wait">
            {activeTab === 'history' && (
              <motion.div
                key="history"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                {records.length === 0 ? (
                  <div className="bg-white p-12 rounded-3xl border border-dashed border-slate-300 text-center">
                    <History className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500 font-medium">Belum ada riwayat kunjungan.</p>
                    <button 
                      onClick={() => setActiveTab('new_record')}
                      className="mt-4 text-blue-600 font-bold hover:underline"
                    >
                      Buat Kunjungan Pertama
                    </button>
                  </div>
                ) : (
                  records.map((record) => (
                    <div key={record.id} className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden group">
                      <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex flex-col items-center justify-center">
                            <span className="text-[10px] font-bold text-slate-400 uppercase">{format(new Date(record.visitDate), 'MMM')}</span>
                            <span className="text-lg font-bold text-slate-900">{format(new Date(record.visitDate), 'dd')}</span>
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">Kunjungan {format(new Date(record.visitDate), 'HH:mm')}</p>
                            <p className="text-xs text-slate-500 font-medium">Kunjungan Ke-{record.visitNumber || 1}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button className="p-2 hover:bg-slate-200 rounded-xl transition-colors">
                            <Printer className="w-5 h-5 text-slate-400" />
                          </button>
                        </div>
                      </div>
                      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                          <h4 className="text-xs font-bold text-slate-400 uppercase mb-3 tracking-wider">Tanda-tanda Vital</h4>
                          <div className="grid grid-cols-3 gap-2 mb-4">
                            <div className="p-2 bg-slate-50 rounded-xl">
                              <p className="text-[8px] font-bold text-slate-400 uppercase">TD</p>
                              <p className="text-xs font-bold text-slate-700">{record.vitalSigns?.bloodPressure || '-'}</p>
                            </div>
                            <div className="p-2 bg-slate-50 rounded-xl">
                              <p className="text-[8px] font-bold text-slate-400 uppercase">Nadi</p>
                              <p className="text-xs font-bold text-slate-700">{record.vitalSigns?.pulse || '-'} BPM</p>
                            </div>
                            <div className="p-2 bg-slate-50 rounded-xl">
                              <p className="text-[8px] font-bold text-slate-400 uppercase">Resp</p>
                              <p className="text-xs font-bold text-slate-700">{record.vitalSigns?.respiration || '-'} RPM</p>
                            </div>
                          </div>
                          
                          <h4 className="text-xs font-bold text-slate-400 uppercase mb-3 tracking-wider">Diagnosis Askesgilut</h4>
                          <p className="text-sm font-bold text-slate-800 mb-1">Kebutuhan:</p>
                          <p className="text-sm text-slate-600 mb-2">{record.diagnosisAskesgilut?.needs.join(', ') || '-'}</p>
                          <p className="text-sm font-bold text-slate-800 mb-1">Penyebab:</p>
                          <p className="text-sm text-slate-600">{record.diagnosisAskesgilut?.causes || '-'}</p>
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-400 uppercase mb-3 tracking-wider">Perencanaan & Evaluasi</h4>
                          <p className="text-sm font-bold text-slate-800 mb-1">Tujuan:</p>
                          <p className="text-sm text-slate-600 mb-2">{record.planning?.goals || '-'}</p>
                          <p className="text-sm font-bold text-slate-800 mb-1">Intervensi:</p>
                          <p className="text-sm text-slate-600 mb-2">{record.planning?.interventions || '-'}</p>
                          <p className="text-sm font-bold text-slate-800 mb-1">Evaluasi:</p>
                          <p className="text-sm text-slate-600">{record.evaluation || '-'}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </motion.div>
            )}

            {activeTab === 'odontogram' && (
              <motion.div
                key="odontogram"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm"
              >
                <div className="flex items-center justify-between mb-8">
                  <h3 className="font-bold text-slate-900 text-lg">Pemeriksaan Jaringan Keras Gigi (Odontogram)</h3>
                  <div className="flex flex-wrap gap-3 max-w-2xl justify-end">
                    {WHO_CODES.map((c) => (
                      <div key={c.code} className="flex items-center gap-1.5">
                        <div className={cn("w-3 h-3 rounded-sm border border-slate-200", c.color)} />
                        <span className="text-[9px] font-bold text-slate-500 uppercase">{c.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Summary Tables (Matching PDF Page 4) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                  <div className="space-y-4">
                    <h4 className="text-sm font-bold text-slate-700 border-b pb-2 uppercase tracking-wider">Rahang Atas (Upper)</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <table className="w-full text-[10px] border-collapse">
                        <tbody>
                          {[11, 12, 13, 14, 15, 16, 17, 18].map(num => (
                            <tr key={num} className="border-b border-slate-100">
                              <td className="py-1 font-bold text-slate-500">{num} {num <= 15 ? `[${50 + (num - 10)}]` : ''}</td>
                              <td className="py-1">
                                <input 
                                  type="text" 
                                  className="w-full bg-transparent outline-none font-bold text-blue-600 uppercase"
                                  value={odontogram[num]?.status || ''}
                                  onChange={(e) => setOdontogram(prev => ({ ...prev, [num]: { ...prev[num], status: e.target.value } }))}
                                  placeholder="..."
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <table className="w-full text-[10px] border-collapse">
                        <tbody>
                          {[21, 22, 23, 24, 25, 26, 27, 28].map(num => (
                            <tr key={num} className="border-b border-slate-100">
                              <td className="py-1 text-right">
                                <input 
                                  type="text" 
                                  className="w-full bg-transparent outline-none font-bold text-blue-600 uppercase text-right"
                                  value={odontogram[num]?.status || ''}
                                  onChange={(e) => setOdontogram(prev => ({ ...prev, [num]: { ...prev[num], status: e.target.value } }))}
                                  placeholder="..."
                                />
                              </td>
                              <td className="py-1 font-bold text-slate-500 text-right">{num <= 25 ? `[${60 + (num - 20)}]` : ''} {num}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-sm font-bold text-slate-700 border-b pb-2 uppercase tracking-wider">Rahang Bawah (Lower)</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <table className="w-full text-[10px] border-collapse">
                        <tbody>
                          {[48, 47, 46, 45, 44, 43, 42, 41].map(num => (
                            <tr key={num} className="border-b border-slate-100">
                              <td className="py-1 font-bold text-slate-500">{num} {num <= 45 ? `[${80 + (num - 40)}]` : ''}</td>
                              <td className="py-1">
                                <input 
                                  type="text" 
                                  className="w-full bg-transparent outline-none font-bold text-blue-600 uppercase"
                                  value={odontogram[num]?.status || ''}
                                  onChange={(e) => setOdontogram(prev => ({ ...prev, [num]: { ...prev[num], status: e.target.value } }))}
                                  placeholder="..."
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <table className="w-full text-[10px] border-collapse">
                        <tbody>
                          {[38, 37, 36, 35, 34, 33, 32, 31].map(num => (
                            <tr key={num} className="border-b border-slate-100">
                              <td className="py-1 text-right">
                                <input 
                                  type="text" 
                                  className="w-full bg-transparent outline-none font-bold text-blue-600 uppercase text-right"
                                  value={odontogram[num]?.status || ''}
                                  onChange={(e) => setOdontogram(prev => ({ ...prev, [num]: { ...prev[num], status: e.target.value } }))}
                                  placeholder="..."
                                />
                              </td>
                              <td className="py-1 font-bold text-slate-500 text-right">{num <= 35 ? `[${70 + (num - 30)}]` : ''} {num}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-16 py-12 bg-slate-50/50 rounded-3xl border border-slate-100">
                  {/* Upper Jaws */}
                  <div className="space-y-4">
                    <div className="flex justify-center gap-1">
                      {/* Quadrant 1 (18-11) */}
                      <div className="flex gap-1 border-r-2 border-slate-300 pr-2">
                        {[18, 17, 16, 15, 14, 13, 12, 11].map(num => (
                          <Tooth key={num} num={num} data={odontogram[num]} onClick={(s, surf) => updateTooth(num, s, surf)} />
                        ))}
                      </div>
                      {/* Quadrant 2 (21-28) */}
                      <div className="flex gap-1 pl-2">
                        {[21, 22, 23, 24, 25, 26, 27, 28].map(num => (
                          <Tooth key={num} num={num} data={odontogram[num]} onClick={(s, surf) => updateTooth(num, s, surf)} />
                        ))}
                      </div>
                    </div>

                    <div className="flex justify-center gap-1 opacity-80">
                      {/* Quadrant 5 (55-51) */}
                      <div className="flex gap-1 border-r-2 border-slate-300 pr-2">
                        {[55, 54, 53, 52, 51].map(num => (
                          <Tooth key={num} num={num} data={odontogram[num]} onClick={(s, surf) => updateTooth(num, s, surf)} />
                        ))}
                      </div>
                      {/* Quadrant 6 (61-65) */}
                      <div className="flex gap-1 pl-2">
                        {[61, 62, 63, 64, 65].map(num => (
                          <Tooth key={num} num={num} data={odontogram[num]} onClick={(s, surf) => updateTooth(num, s, surf)} />
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="w-full h-px bg-slate-300 relative">
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-slate-300 rounded-full" />
                  </div>

                  {/* Lower Jaws */}
                  <div className="space-y-4">
                    <div className="flex justify-center gap-1 opacity-80">
                      {/* Quadrant 8 (85-81) */}
                      <div className="flex gap-1 border-r-2 border-slate-300 pr-2">
                        {[85, 84, 83, 82, 81].map(num => (
                          <Tooth key={num} num={num} data={odontogram[num]} onClick={(s, surf) => updateTooth(num, s, surf)} />
                        ))}
                      </div>
                      {/* Quadrant 7 (71-75) */}
                      <div className="flex gap-1 pl-2">
                        {[71, 72, 73, 74, 75].map(num => (
                          <Tooth key={num} num={num} data={odontogram[num]} onClick={(s, surf) => updateTooth(num, s, surf)} />
                        ))}
                      </div>
                    </div>

                    <div className="flex justify-center gap-1">
                      {/* Quadrant 4 (48-41) */}
                      <div className="flex gap-1 border-r-2 border-slate-300 pr-2">
                        {[48, 47, 46, 45, 44, 43, 42, 41].map(num => (
                          <Tooth key={num} num={num} data={odontogram[num]} onClick={(s, surf) => updateTooth(num, s, surf)} />
                        ))}
                      </div>
                      {/* Quadrant 3 (31-38) */}
                      <div className="flex gap-1 pl-2">
                        {[31, 32, 33, 34, 35, 36, 37, 38].map(num => (
                          <Tooth key={num} num={num} data={odontogram[num]} onClick={(s, surf) => updateTooth(num, s, surf)} />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-10 pt-6 border-t border-slate-100 flex justify-end">
                   <button 
                     onClick={async () => {
                       setIsSaving(true);
                       await setDoc(doc(db, 'patients', patientId!, 'odontogram', 'current'), {
                         patientId,
                         toothData: odontogram,
                         updatedAt: new Date().toISOString()
                       });
                       setIsSaving(false);
                     }}
                     className="px-8 py-3 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 flex items-center gap-2"
                   >
                     <Save className="w-5 h-5" />
                     Simpan Odontogram
                   </button>
                </div>
              </motion.div>
            )}

            {activeTab === 'new_record' && (
              <motion.div
                key="new_record"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                {/* 1. Tanda-tanda Vital */}
                <Section title="1. Tanda-tanda Vital" icon={Activity}>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <InputGroup label="Tekanan Darah" value={newRecord.vitalSigns?.bloodPressure} onChange={(v) => setNewRecord(prev => ({ ...prev, vitalSigns: { ...prev.vitalSigns!, bloodPressure: v } }))} />
                    <NumberInput label="Denyut Nadi (BPM)" value={newRecord.vitalSigns?.pulse} onChange={(v) => setNewRecord(prev => ({ ...prev, vitalSigns: { ...prev.vitalSigns!, pulse: v } }))} />
                    <NumberInput label="Pernafasan (RPM)" value={newRecord.vitalSigns?.respiration} onChange={(v) => setNewRecord(prev => ({ ...prev, vitalSigns: { ...prev.vitalSigns!, respiration: v } }))} />
                  </div>
                </Section>

                {/* 2. Riwayat Kesehatan */}
                <Section title="2. Riwayat Kesehatan" icon={ClipboardCheck}>
                  <div className="space-y-8">
                    {/* Medical History */}
                    <div className="space-y-4">
                      <h4 className="font-bold text-slate-800 text-sm border-b border-slate-100 pb-2">a. Riwayat Medis (Medical History)</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="flex items-center gap-2">
                          <input type="checkbox" checked={newRecord.healthHistory?.medicalHistory.isHealthy} onChange={(e) => setNewRecord(prev => ({ ...prev, healthHistory: { ...prev.healthHistory!, medicalHistory: { ...prev.healthHistory!.medicalHistory, isHealthy: e.target.checked } } }))} />
                          <label className="text-sm font-medium text-slate-700">Pasien merasa dalam keadaan sehat</label>
                        </div>
                        <InputGroup label="Penyakit Serius/Operasi (5 Thn Terakhir)" value={newRecord.healthHistory?.medicalHistory.seriousIllness5Years} onChange={(v) => setNewRecord(prev => ({ ...prev, healthHistory: { ...prev.healthHistory!, medicalHistory: { ...prev.healthHistory!.medicalHistory, seriousIllness5Years: v } } }))} />
                        <InputGroup label="Kelainan Pembekuan Darah" value={newRecord.healthHistory?.medicalHistory.bloodDisorder} onChange={(v) => setNewRecord(prev => ({ ...prev, healthHistory: { ...prev.healthHistory!, medicalHistory: { ...prev.healthHistory!.medicalHistory, bloodDisorder: v } } }))} />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <InputGroup label="Alergi Makanan" value={newRecord.healthHistory?.medicalHistory.allergies.food} onChange={(v) => setNewRecord(prev => ({ ...prev, healthHistory: { ...prev.healthHistory!, medicalHistory: { ...prev.healthHistory!.medicalHistory, allergies: { ...prev.healthHistory!.medicalHistory.allergies, food: v } } } }))} />
                        <InputGroup label="Alergi Obat" value={newRecord.healthHistory?.medicalHistory.allergies.drugs} onChange={(v) => setNewRecord(prev => ({ ...prev, healthHistory: { ...prev.healthHistory!, medicalHistory: { ...prev.healthHistory!.medicalHistory, allergies: { ...prev.healthHistory!.medicalHistory.allergies, drugs: v } } } }))} />
                        <InputGroup label="Alergi Obat Bius" value={newRecord.healthHistory?.medicalHistory.allergies.anesthesia} onChange={(v) => setNewRecord(prev => ({ ...prev, healthHistory: { ...prev.healthHistory!, medicalHistory: { ...prev.healthHistory!.medicalHistory, allergies: { ...prev.healthHistory!.medicalHistory.allergies, anesthesia: v } } } }))} />
                        <InputGroup label="Alergi Cuaca/Lainnya" value={newRecord.healthHistory?.medicalHistory.allergies.weather} onChange={(v) => setNewRecord(prev => ({ ...prev, healthHistory: { ...prev.healthHistory!, medicalHistory: { ...prev.healthHistory!.medicalHistory, allergies: { ...prev.healthHistory!.medicalHistory.allergies, weather: v } } } }))} />
                      </div>
                    </div>

                    {/* Pharmacological History */}
                    <div className="space-y-4">
                      <h4 className="font-bold text-slate-800 text-sm border-b border-slate-100 pb-2">c. Pharmacological History</h4>
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <input type="checkbox" checked={newRecord.healthHistory?.pharmacologicalHistory.takingMeds} onChange={(e) => setNewRecord(prev => ({ ...prev, healthHistory: { ...prev.healthHistory!, pharmacologicalHistory: { ...prev.healthHistory!.pharmacologicalHistory, takingMeds: e.target.checked } } }))} />
                          <label className="text-sm font-medium text-slate-700">Sedang/pernah mengkonsumsi obat-obatan?</label>
                        </div>
                        <InputGroup label="Nama Obat & Tujuan" value={newRecord.healthHistory?.pharmacologicalHistory.medNamePurpose} onChange={(v) => setNewRecord(prev => ({ ...prev, healthHistory: { ...prev.healthHistory!, pharmacologicalHistory: { ...prev.healthHistory!.pharmacologicalHistory, medNamePurpose: v } } }))} />
                        <InputGroup label="Efek Samping" value={newRecord.healthHistory?.pharmacologicalHistory.sideEffects} onChange={(v) => setNewRecord(prev => ({ ...prev, healthHistory: { ...prev.healthHistory!, pharmacologicalHistory: { ...prev.healthHistory!.pharmacologicalHistory, sideEffects: v } } }))} />
                        <InputGroup label="Pengaruh Positif" value={newRecord.healthHistory?.pharmacologicalHistory.positiveEffects} onChange={(v) => setNewRecord(prev => ({ ...prev, healthHistory: { ...prev.healthHistory!, pharmacologicalHistory: { ...prev.healthHistory!.pharmacologicalHistory, positiveEffects: v } } }))} />
                        <InputGroup label="Masalah Dosis" value={newRecord.healthHistory?.pharmacologicalHistory.dosageIssues} onChange={(v) => setNewRecord(prev => ({ ...prev, healthHistory: { ...prev.healthHistory!, pharmacologicalHistory: { ...prev.healthHistory!.pharmacologicalHistory, dosageIssues: v } } }))} />
                        <div className="flex items-center gap-2">
                          <input type="checkbox" checked={newRecord.healthHistory?.pharmacologicalHistory.regularConsumption} onChange={(e) => setNewRecord(prev => ({ ...prev, healthHistory: { ...prev.healthHistory!, pharmacologicalHistory: { ...prev.healthHistory!.pharmacologicalHistory, regularConsumption: e.target.checked } } }))} />
                          <label className="text-sm font-medium text-slate-700">Mengkonsumsi obat secara teratur?</label>
                        </div>
                      </div>
                    </div>
                  </div>
                </Section>

                {/* 3. Dental History */}
                <Section title="3. Dental History" icon={History}>
                  <div className="space-y-8">
                    <div className="space-y-4">
                      <h4 className="font-bold text-slate-800 text-sm border-b border-slate-100 pb-2">Bagian I : Pengalaman & Gejala</h4>
                      <InputGroup label="Alasan Utama Kunjungan" value={newRecord.dentalHistory?.bagian1.reason} onChange={(v) => setNewRecord(prev => ({ ...prev, dentalHistory: { ...prev.dentalHistory!, bagian1: { ...prev.dentalHistory!.bagian1, reason: v } } }))} />
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center gap-2">
                          <input type="checkbox" checked={newRecord.dentalHistory?.bagian1.xrayLast2Years} onChange={(e) => setNewRecord(prev => ({ ...prev, dentalHistory: { ...prev.dentalHistory!, bagian1: { ...prev.dentalHistory!.bagian1, xrayLast2Years: e.target.checked } } }))} />
                          <label className="text-sm font-medium text-slate-700">Rontgen Gigi (2 Thn Terakhir)</label>
                        </div>
                        <InputGroup label="Tipe Rontgen" value={newRecord.dentalHistory?.bagian1.xrayType} onChange={(v) => setNewRecord(prev => ({ ...prev, dentalHistory: { ...prev.dentalHistory!, bagian1: { ...prev.dentalHistory!.bagian1, xrayType: v } } }))} />
                      </div>
                    </div>
                    {/* Add more Bagian II-IV if needed, or keep it simple for now */}
                  </div>
                </Section>

                {/* 4. Extra dan Intra Oral */}
                <Section title="4. Extra dan Intra Oral" icon={Stethoscope}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <h4 className="font-bold text-slate-800 text-sm border-b border-slate-100 pb-2">EXTRAORAL</h4>
                      {['Skin - Face', 'Skin - Neck', 'Vermilion Borders', 'Parotid Glands', 'Lymph Nodes', 'Anterior Cervical', 'Posterior Cervical', 'Submental', 'Submandibular', 'Supraclavicular'].map(item => (
                        <div key={item} className="flex items-center justify-between">
                          <span className="text-sm text-slate-700">{item}</span>
                          <select 
                            className="text-xs p-1 border rounded"
                            value={newRecord.clinicalExam?.extraOral[item] || 'Normal'}
                            onChange={(e) => setNewRecord(prev => ({ ...prev, clinicalExam: { ...prev.clinicalExam!, extraOral: { ...prev.clinicalExam!.extraOral, [item]: e.target.value as any } } }))}
                          >
                            <option value="Normal">Normal</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                      ))}
                    </div>
                    <div className="space-y-4">
                      <h4 className="font-bold text-slate-800 text-sm border-b border-slate-100 pb-2">INTRAORAL</h4>
                      {['Labial Mucosa', 'Labial Vestibules', 'Anterior Gingivae', 'Buccal Vestibules', 'Buccal Gingivae', 'Tongue - Dorsal', 'Tongue - Ventral', 'Tongue - Lateral', 'Lingual Tonsils', 'Floor of Mouth', 'Lingual Gingivae', 'Tonsillar Pillars', 'Pharyngeal Wall', 'Soft Palate', 'Uvula', 'Hard Palate', 'Palatal Gingivae', 'Submandibular Glands'].map(item => (
                        <div key={item} className="flex items-center justify-between">
                          <span className="text-sm text-slate-700">{item}</span>
                          <select 
                            className="text-xs p-1 border rounded"
                            value={newRecord.clinicalExam?.intraOral[item] || 'Normal'}
                            onChange={(e) => setNewRecord(prev => ({ ...prev, clinicalExam: { ...prev.clinicalExam!, intraOral: { ...prev.clinicalExam!.intraOral, [item]: e.target.value as any } } }))}
                          >
                            <option value="Normal">Normal</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                      ))}
                    </div>
                  </div>
                </Section>

                {/* 5. Pemeriksaan Oral Hygiene */}
                <Section title="5. Pemeriksaan Oral Hygiene" icon={Activity}>
                  <div className="space-y-8">
                    {/* OHI-S */}
                    <div className="space-y-4">
                      <h4 className="font-bold text-slate-800 text-sm border-b border-slate-100 pb-2">OHI-S (Oral Hygiene Index Simplified)</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                          <p className="text-xs font-bold text-slate-400 uppercase mb-4">Debris Index (DI)</p>
                          <div className="grid grid-cols-3 gap-2">
                            {[16, 11, 26, 36, 31, 46].map(tooth => (
                              <div key={tooth} className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-500">{tooth}</label>
                                <select 
                                  className="w-full text-xs p-1 border rounded"
                                  value={newRecord.oralHygiene?.ohis.debrisIndex[tooth] || 0}
                                  onChange={(e) => {
                                    const val = parseInt(e.target.value);
                                    setNewRecord(prev => {
                                      const newDI = { ...prev.oralHygiene!.ohis.debrisIndex, [tooth]: val };
                                      const total = Object.values(newDI).reduce((a, b) => (a as number) + (b as number), 0) as number;
                                      const currentCI = prev.oralHygiene!.ohis.totalCI as number;
                                      return { ...prev, oralHygiene: { ...prev.oralHygiene!, ohis: { ...prev.oralHygiene!.ohis, debrisIndex: newDI, totalDI: total, score: (total + currentCI) / 6 } } };
                                    });
                                  }}
                                >
                                  {[0, 1, 2, 3].map(v => <option key={v} value={v}>{v}</option>)}
                                </select>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-400 uppercase mb-4">Calculus Index (CI)</p>
                          <div className="grid grid-cols-3 gap-2">
                            {[16, 11, 26, 36, 31, 46].map(tooth => (
                              <div key={tooth} className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-500">{tooth}</label>
                                <select 
                                  className="w-full text-xs p-1 border rounded"
                                  value={newRecord.oralHygiene?.ohis.calculusIndex[tooth] || 0}
                                  onChange={(e) => {
                                    const val = parseInt(e.target.value);
                                    setNewRecord(prev => {
                                      const newCI = { ...prev.oralHygiene!.ohis.calculusIndex, [tooth]: val };
                                      const total = Object.values(newCI).reduce((a, b) => (a as number) + (b as number), 0) as number;
                                      const currentDI = prev.oralHygiene!.ohis.totalDI as number;
                                      return { ...prev, oralHygiene: { ...prev.oralHygiene!, ohis: { ...prev.oralHygiene!.ohis, calculusIndex: newCI, totalCI: total, score: (currentDI + total) / 6 } } };
                                    });
                                  }}
                                >
                                  {[0, 1, 2, 3].map(v => <option key={v} value={v}>{v}</option>)}
                                </select>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 p-4 bg-blue-50 rounded-2xl flex justify-between items-center">
                        <div>
                          <p className="text-xs font-bold text-blue-400 uppercase">Skor OHI-S</p>
                          <p className="text-2xl font-black text-blue-700">{newRecord.oralHygiene?.ohis.score.toFixed(2)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-bold text-blue-400 uppercase">Kategori</p>
                          <p className="text-lg font-bold text-blue-700">
                            {newRecord.oralHygiene?.ohis.score! <= 1.2 ? 'Baik' : newRecord.oralHygiene?.ohis.score! <= 3.0 ? 'Sedang' : 'Buruk'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Plaque Control */}
                    <div className="space-y-4 pt-8 border-t border-slate-100">
                      <h4 className="font-bold text-slate-800 text-sm border-b border-slate-100 pb-2">Plaque Control Record (PCR)</h4>
                      <p className="text-xs text-slate-500 italic mb-4">Klik pada permukaan gigi yang terdapat plak (4 permukaan per gigi)</p>
                      <div className="grid grid-cols-8 md:grid-cols-16 gap-2">
                        {[18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28].map(tooth => (
                          <div key={tooth} className="flex flex-col items-center gap-1">
                            <span className="text-[8px] font-bold text-slate-400">{tooth}</span>
                            <div className="grid grid-cols-2 gap-0.5">
                              {['buccal', 'lingual', 'mesial', 'distal'].map(surface => (
                                <button
                                  key={surface}
                                  onClick={() => {
                                    setNewRecord(prev => {
                                      const newTeeth = { ...prev.oralHygiene!.plaqueControl.teeth } as { [tooth: string]: { buccal: boolean; lingual: boolean; mesial: boolean; distal: boolean } };
                                      if (!newTeeth[tooth]) newTeeth[tooth] = { buccal: false, lingual: false, mesial: false, distal: false };
                                      newTeeth[tooth] = { ...newTeeth[tooth], [surface as 'buccal' | 'lingual' | 'mesial' | 'distal']: !newTeeth[tooth][surface as 'buccal' | 'lingual' | 'mesial' | 'distal'] };
                                      
                                      // Calculate score
                                      let totalSurfaces = 0;
                                      let plaqueSurfaces = 0;
                                      Object.values(newTeeth).forEach(t => {
                                        totalSurfaces += 4;
                                        if (t.buccal) plaqueSurfaces++;
                                        if (t.lingual) plaqueSurfaces++;
                                        if (t.mesial) plaqueSurfaces++;
                                        if (t.distal) plaqueSurfaces++;
                                      });
                                      const score = totalSurfaces > 0 ? (plaqueSurfaces / totalSurfaces) * 100 : 0;
                                      
                                      return { ...prev, oralHygiene: { ...prev.oralHygiene!, plaqueControl: { ...prev.oralHygiene!.plaqueControl, teeth: newTeeth, score } } };
                                    });
                                  }}
                                  className={cn(
                                    "w-3 h-3 border border-slate-200 rounded-sm",
                                    newRecord.oralHygiene?.plaqueControl.teeth[tooth]?.[surface as keyof typeof newRecord.oralHygiene.plaqueControl.teeth[number]] ? "bg-red-500 border-red-600" : "bg-white"
                                  )}
                                />
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-4 p-4 bg-red-50 rounded-2xl flex justify-between items-center">
                        <div>
                          <p className="text-xs font-bold text-red-400 uppercase">Skor Plak</p>
                          <p className="text-2xl font-black text-red-700">{newRecord.oralHygiene?.plaqueControl.score.toFixed(1)}%</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-bold text-red-400 uppercase">Kategori</p>
                          <p className="text-lg font-bold text-red-700">
                            {newRecord.oralHygiene?.plaqueControl.score! <= 10 ? 'Sangat Baik' : newRecord.oralHygiene?.plaqueControl.score! <= 20 ? 'Baik' : 'Buruk'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </Section>
                {/* 6. Diagnosis & Planning (Page 5) */}
                <Section title="6. Diagnosis & Perencanaan" icon={BookOpen}>
                  <div className="space-y-6">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                      <h4 className="font-bold text-slate-800">Diagnosis Askesgilut</h4>
                      <button 
                        onClick={generateAIDiagnosis}
                        disabled={isGeneratingAI}
                        className="flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-xl text-xs font-bold hover:bg-purple-200 transition-all disabled:opacity-50"
                      >
                        <Sparkles className="w-4 h-4" />
                        Generate AI Analysis
                      </button>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">Kebutuhan Pasien (Needs)</label>
                        <div className="flex flex-wrap gap-2 mb-2">
                          {['Kebutuhan akan integritas jaringan kulit dan mukosa', 'Kebutuhan akan bebas dari rasa sakit', 'Kebutuhan akan kebersihan gigi dan mulut', 'Kebutuhan akan pengetahuan'].map(need => (
                            <button
                              key={need}
                              type="button"
                              onClick={() => {
                                const current = newRecord.diagnosisAskesgilut?.needs || [];
                                const next = current.includes(need) ? current.filter(n => n !== need) : [...current, need];
                                setNewRecord(prev => ({ ...prev, diagnosisAskesgilut: { ...prev.diagnosisAskesgilut!, needs: next } }));
                              }}
                              className={cn(
                                "px-3 py-1.5 rounded-lg text-xs font-bold transition-all border",
                                newRecord.diagnosisAskesgilut?.needs?.includes(need)
                                  ? "bg-blue-600 border-blue-600 text-white"
                                  : "bg-white border-slate-200 text-slate-600 hover:border-blue-300"
                              )}
                            >
                              {need}
                            </button>
                          ))}
                        </div>
                        <textarea 
                          className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl h-24"
                          placeholder="Kebutuhan lainnya..."
                          value={newRecord.diagnosisAskesgilut?.needs?.join('\n')}
                          onChange={(e) => setNewRecord(prev => ({ ...prev, diagnosisAskesgilut: { ...prev.diagnosisAskesgilut!, needs: e.target.value.split('\n') } }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">Penyebab</label>
                        <textarea 
                          className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl h-24"
                          value={newRecord.diagnosisAskesgilut?.causes}
                          onChange={(e) => setNewRecord(prev => ({ ...prev, diagnosisAskesgilut: { ...prev.diagnosisAskesgilut!, causes: e.target.value } }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">Tanda & Gejala (Signs & Symptoms)</label>
                        <textarea 
                          className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl h-24"
                          value={newRecord.diagnosisAskesgilut?.signs}
                          onChange={(e) => setNewRecord(prev => ({ ...prev, diagnosisAskesgilut: { ...prev.diagnosisAskesgilut!, signs: e.target.value } }))}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-b border-slate-100 pb-4 pt-4">
                      <h4 className="font-bold text-slate-800">Perencanaan Intervensi (SOAPIE)</h4>
                      <button 
                        onClick={generateAIIntervention}
                        disabled={isGeneratingAI || !newRecord.diagnosisAskesgilut?.causes}
                        className="flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-xl text-xs font-bold hover:bg-purple-200 transition-all disabled:opacity-50"
                      >
                        <Sparkles className="w-4 h-4" />
                        Generate AI Plan
                      </button>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700">Tujuan (Client-Centered Goals)</label>
                      <textarea 
                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl h-24"
                        value={newRecord.planning?.goals}
                        onChange={(e) => setNewRecord(prev => ({ ...prev, planning: { ...prev.planning!, goals: e.target.value } }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700">Intervensi Askesgilut</label>
                      <textarea 
                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl h-24"
                        value={newRecord.planning?.interventions}
                        onChange={(e) => setNewRecord(prev => ({ ...prev, planning: { ...prev.planning!, interventions: e.target.value } }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700">Pernyataan Evaluatif</label>
                      <textarea 
                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl h-24"
                        value={newRecord.evaluation}
                        onChange={(e) => setNewRecord(prev => ({ ...prev, evaluation: e.target.value }))}
                      />
                    </div>
                  </div>
                </Section>

                {/* Informed Consent */}
                <Section title="Informed Consent" icon={ShieldCheck}>
                   <div className="space-y-8">
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                       {/* Patient Signature */}
                       <div className="space-y-4">
                         <div className="flex items-center justify-between">
                           <div className="flex items-center gap-2">
                             <input 
                               type="checkbox" 
                               checked={newRecord.informedConsent?.patientSigned} 
                               onChange={(e) => setNewRecord(prev => ({ ...prev, informedConsent: { ...prev.informedConsent!, patientSigned: e.target.checked } }))} 
                             />
                             <label className="text-sm font-bold text-slate-700">Tanda Tangan Pasien</label>
                           </div>
                           <button 
                             onClick={() => patientSigPad.current?.clear()}
                             className="p-1.5 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-all"
                             title="Bersihkan"
                           >
                             <Eraser className="w-3 h-3" />
                           </button>
                         </div>
                         <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl overflow-hidden h-40 relative">
                           <SignatureCanvas 
                             ref={patientSigPad}
                             penColor='black'
                             canvasProps={{ className: 'w-full h-full cursor-crosshair' }}
                             onEnd={() => {
                               if (patientSigPad.current) {
                                 setNewRecord(prev => ({
                                   ...prev,
                                   informedConsent: {
                                     ...prev.informedConsent!,
                                     patientSignature: patientSigPad.current.toDataURL()
                                   }
                                 }));
                               }
                             }}
                           />
                           {!newRecord.informedConsent?.patientSignature && (
                             <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-slate-400 text-[10px] font-medium">
                               Tanda tangan pasien
                             </div>
                           )}
                         </div>
                       </div>

                       {/* Guardian Signature */}
                       <div className="space-y-4">
                         <div className="flex items-center justify-between">
                           <div className="flex items-center gap-2">
                             <input 
                               type="checkbox" 
                               checked={newRecord.informedConsent?.parentSigned} 
                               onChange={(e) => setNewRecord(prev => ({ ...prev, informedConsent: { ...prev.informedConsent!, parentSigned: e.target.checked } }))} 
                             />
                             <label className="text-sm font-bold text-slate-700">Tanda Tangan Wali</label>
                           </div>
                           <button 
                             onClick={() => guardianSigPad.current?.clear()}
                             className="p-1.5 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-all"
                             title="Bersihkan"
                           >
                             <Eraser className="w-3 h-3" />
                           </button>
                         </div>
                         <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl overflow-hidden h-40 relative">
                           <SignatureCanvas 
                             ref={guardianSigPad}
                             penColor='black'
                             canvasProps={{ className: 'w-full h-full cursor-crosshair' }}
                             onEnd={() => {
                               if (guardianSigPad.current) {
                                 setNewRecord(prev => ({
                                   ...prev,
                                   informedConsent: {
                                     ...prev.informedConsent!,
                                     guardianSignature: guardianSigPad.current.toDataURL()
                                   }
                                 }));
                               }
                             }}
                           />
                           {!newRecord.informedConsent?.guardianSignature && (
                             <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-slate-400 text-[10px] font-medium">
                               Tanda tangan wali (jika ada)
                             </div>
                           )}
                         </div>
                       </div>

                       {/* Operator Signature */}
                       <div className="space-y-4">
                         <div className="flex items-center justify-between">
                           <div className="flex items-center gap-2">
                             <input 
                               type="checkbox" 
                               checked={newRecord.informedConsent?.operatorSigned} 
                               onChange={(e) => setNewRecord(prev => ({ ...prev, informedConsent: { ...prev.informedConsent!, operatorSigned: e.target.checked } }))} 
                             />
                             <label className="text-sm font-bold text-slate-700">Tanda Tangan Petugas</label>
                           </div>
                           <button 
                             onClick={() => operatorSigPad.current?.clear()}
                             className="p-1.5 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-all"
                             title="Bersihkan"
                           >
                             <Eraser className="w-3 h-3" />
                           </button>
                         </div>
                         <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl overflow-hidden h-40 relative">
                           <SignatureCanvas 
                             ref={operatorSigPad}
                             penColor='black'
                             canvasProps={{ className: 'w-full h-full cursor-crosshair' }}
                             onEnd={() => {
                               if (operatorSigPad.current) {
                                 setNewRecord(prev => ({
                                   ...prev,
                                   informedConsent: {
                                     ...prev.informedConsent!,
                                     operatorSignature: operatorSigPad.current.toDataURL()
                                   }
                                 }));
                               }
                             }}
                           />
                           {!newRecord.informedConsent?.operatorSignature && (
                             <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-slate-400 text-[10px] font-medium">
                               Tanda tangan petugas
                             </div>
                           )}
                         </div>
                       </div>
                     </div>
                   </div>
                </Section>

                {/* Save Button */}
                <div className="flex justify-end pt-6">
                  <button
                    onClick={handleSaveRecord}
                    disabled={isSaving}
                    className="px-10 py-4 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-200 flex items-center gap-3 disabled:opacity-50"
                  >
                    {isSaving ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    ) : (
                      <>
                        <Save className="w-6 h-6" />
                        <span>Simpan Rekam Medis</span>
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

// Helper Components
const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex justify-between items-center gap-4">
    <span className="text-xs font-bold text-slate-400 uppercase">{label}</span>
    <span className="text-sm font-semibold text-slate-700 text-right">{value}</span>
  </div>
);

const IndexBox = ({ label, value, color }: { label: string; value: number; color: string }) => (
  <div className={cn("p-3 rounded-2xl border border-transparent", color)}>
    <p className="text-[10px] font-bold uppercase opacity-70">{label}</p>
    <p className="text-lg font-bold">{value}</p>
  </div>
);

const Section = ({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) => (
  <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
    <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
      <div className="p-2 bg-blue-100 rounded-lg">
        <Icon className="w-5 h-5 text-blue-600" />
      </div>
      <h3 className="font-bold text-slate-900">{title}</h3>
    </div>
    <div className="p-8">{children}</div>
  </div>
);

const InputGroup = ({ label, value, onChange }: { label: string; value: string | undefined; onChange: (v: string) => void }) => (
  <div className="space-y-1">
    <label className="text-xs font-bold text-slate-500 uppercase ml-1">{label}</label>
    <input 
      type="text"
      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  </div>
);

const NumberInput = ({ label, value, onChange }: { label: string; value: number | undefined; onChange: (v: number) => void }) => (
  <div className="space-y-1">
    <label className="text-xs font-bold text-slate-500 uppercase ml-1">{label}</label>
    <input 
      type="number"
      step="0.1"
      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-bold"
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
    />
  </div>
);

const WHO_CODES = [
  { code: 'sou', label: 'Sound (Sehat)', color: 'bg-white' },
  { code: 'car', label: 'Caries (Karies)', color: 'bg-red-500' },
  { code: 'amf', label: 'Amalgam Filling', color: 'bg-slate-700' },
  { code: 'cof', label: 'Composite Filling', color: 'bg-blue-500' },
  { code: 'fis', label: 'Fissure Sealant', color: 'bg-green-500' },
  { code: 'mis', label: 'Missing (Hilang)', color: 'bg-slate-400' },
  { code: 'une', label: 'Unerupted (Belum Tumbuh)', color: 'bg-slate-100' },
  { code: 'pre', label: 'Prepared (Preparasi)', color: 'bg-amber-500' },
  { code: 'bridge', label: 'Bridge (Jembatan)', color: 'bg-yellow-500' },
  { code: 'crown', label: 'Crown (Mahkota)', color: 'bg-orange-500' },
  { code: 'non', label: 'Non-Vital (Non-Vital)', color: 'bg-slate-900' },
];

const Tooth = ({ num, data, onClick }: { num: number; data?: any; onClick: (s: string, surface?: string) => void }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeSurface, setActiveSurface] = useState<string | undefined>(undefined);
  const status = data?.status || 'sou';
  const surfaces = data?.surfaces || {};

  const getSurfaceColor = (sCode: string) => {
    const found = WHO_CODES.find(c => c.code === sCode);
    return found ? found.color : 'bg-white';
  };

  return (
    <div className="relative group/tooth flex flex-col items-center">
      <span className="text-[8px] font-bold text-slate-400 mb-0.5">{num}</span>
      <div className="relative w-8 h-8 border border-slate-300 bg-white">
        {/* Top Surface (Buccal/Labial) */}
        <button 
          onClick={() => { setActiveSurface('buccal'); setIsOpen(true); }}
          className={cn("absolute top-0 left-0 w-full h-[30%] border-b border-slate-100 transition-colors", getSurfaceColor(surfaces.buccal || status))}
          style={{ clipPath: 'polygon(0 0, 100% 0, 70% 100%, 30% 100%)' }}
        />
        {/* Bottom Surface (Lingual/Palatal) */}
        <button 
          onClick={() => { setActiveSurface('lingual'); setIsOpen(true); }}
          className={cn("absolute bottom-0 left-0 w-full h-[30%] border-t border-slate-100 transition-colors", getSurfaceColor(surfaces.lingual || status))}
          style={{ clipPath: 'polygon(30% 0, 70% 0, 100% 100%, 0 100%)' }}
        />
        {/* Left Surface (Mesial) */}
        <button 
          onClick={() => { setActiveSurface('mesial'); setIsOpen(true); }}
          className={cn("absolute top-0 left-0 h-full w-[30%] border-r border-slate-100 transition-colors", getSurfaceColor(surfaces.mesial || status))}
          style={{ clipPath: 'polygon(0 0, 100% 30%, 100% 70%, 0 100%)' }}
        />
        {/* Right Surface (Distal) */}
        <button 
          onClick={() => { setActiveSurface('distal'); setIsOpen(true); }}
          className={cn("absolute top-0 right-0 h-full w-[30%] border-l border-slate-100 transition-colors", getSurfaceColor(surfaces.distal || status))}
          style={{ clipPath: 'polygon(0 30%, 100% 0, 100% 100%, 0 70%)' }}
        />
        {/* Center Surface (Occlusal/Incisal) */}
        <button 
          onClick={() => { setActiveSurface('occlusal'); setIsOpen(true); }}
          className={cn("absolute top-[30%] left-[30%] w-[40%] h-[40%] border border-slate-100 transition-colors", getSurfaceColor(surfaces.occlusal || status))}
        />
        
        {/* Status Overlays */}
        {status === 'mis' && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-full h-0.5 bg-slate-600 rotate-45 absolute" />
            <div className="w-full h-0.5 bg-slate-600 -rotate-45 absolute" />
          </div>
        )}
        {status === 'une' && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-6 h-6 border border-slate-400 rounded-full" />
          </div>
        )}
      </div>
      <button 
        onClick={() => { setActiveSurface(undefined); setIsOpen(true); }}
        className="text-[7px] font-bold text-blue-600 hover:underline mt-0.5"
      >
        Set
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-[100]" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              className="fixed z-[101] w-48 bg-white rounded-2xl shadow-2xl border border-slate-100 p-3 overflow-hidden"
              style={{ left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}
            >
              <div className="mb-2 pb-2 border-b border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase">
                  {activeSurface ? `Surface: ${activeSurface}` : `Tooth: ${num}`}
                </p>
              </div>
              <div className="grid grid-cols-1 gap-1 max-h-64 overflow-y-auto pr-1">
                {WHO_CODES.map((c) => (
                  <button
                    key={c.code}
                    onClick={() => {
                      onClick(c.code, activeSurface);
                      setIsOpen(false);
                    }}
                    className={cn(
                      "w-full px-3 py-2 rounded-lg text-[10px] font-bold uppercase text-left transition-colors flex items-center gap-2",
                      (activeSurface ? surfaces[activeSurface] === c.code : status === c.code) ? "bg-blue-50 text-blue-700" : "hover:bg-slate-50 text-slate-500"
                    )}
                  >
                    <div className={cn("w-3 h-3 rounded-sm border border-slate-200", c.color)} />
                    {c.label}
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

function Check(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
  );
}
