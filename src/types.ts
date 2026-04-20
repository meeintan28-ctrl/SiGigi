export type UserRole = 'admin' | 'dentist' | 'therapist' | 'staff';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  createdAt: string;
}

export interface Patient {
  id: string;
  name: string;
  nik: string;
  medicalRecordNumber: string;
  birthDate: string;
  birthPlace?: string;
  gender: 'L' | 'P';
  religion?: string;
  nationality?: string;
  bloodType?: string;
  address: string;
  phone: string;
  dependents?: {
    children: number;
    others: number;
  };
  weight?: number;
  height?: number;
  insurance: string;
  occupation: string;
  education: string;
  maritalStatus: string;
  incomeRange?: string;
  hobbies?: string;
  dentistInfo?: {
    name: string;
    phone: string;
    address: string;
  };
  doctorInfo?: {
    name: string;
    phone: string;
    address: string;
  };
  referralSource?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MedicalRecord {
  id: string;
  patientId: string;
  visitDate: string;
  visitNumber: number;
  
  // A. PENGKAJIAN
  vitalSigns: {
    bloodPressure: string;
    pulse: number;
    respiration: number;
  };

  healthHistory: {
    medicalHistory: {
      isHealthy: boolean;
      seriousIllness5Years: string;
      bloodDisorder: string;
      allergies: {
        food: string;
        drugs: string;
        anesthesia: string;
        weather: string;
        others: string;
      };
    };
    socialHistory: string;
    pharmacologicalHistory: {
      takingMeds: boolean;
      medNamePurpose: string;
      sideEffects: string;
      positiveEffects: string;
      dosageIssues: string;
      regularConsumption: boolean;
    };
  };

  dentalHistory: {
    bagian1: {
      reason: string;
      concerns: string[];
      xrayLast2Years: boolean;
      xrayType?: string;
      previousComplications: string;
      previousVisitOpinion: string;
      generalHealthImpact: string;
      symptoms: string[];
      teethGrinding: boolean;
      biteGuard: boolean;
      appearanceConcerns: string[];
      injuryHistory: string;
      previousTreatments: string[];
    };
    bagian2: {
      toolsUsed: string[];
      toothpasteBenefits: string[];
      brushingDuration: number;
      flossingDuration: number;
      brushingFrequency: string;
      flossingFrequency: string;
      difficultyScheduling: boolean;
      difficultyCleaning: string[];
      monthlyCancerCheck: boolean;
      habits: string[];
    };
    bagian3: {
      snacks: { [key: string]: string }; // e.g. "Permen mint": "Sering"
    };
    bagian4: {
      cavityRiskOpinion: string;
      preventionImportance: string;
      beliefCanMaintain: boolean;
      currentHealthOpinion: string;
    };
  };

  clinicalExam: {
    extraOral: { [key: string]: 'Normal' | 'Other' };
    intraOral: { [key: string]: 'Normal' | 'Other' };
    notes: string;
  };

  oralHygiene: {
    ohis: {
      debrisIndex: { [tooth: string]: number };
      calculusIndex: { [tooth: string]: number };
      totalDI: number;
      totalCI: number;
      score: number;
      category: string;
    };
    plaqueControl: {
      teeth: { [tooth: string]: { buccal: boolean; lingual: boolean; mesial: boolean; distal: boolean } };
      score: number;
      category: string;
    };
  };

  odontogram: OdontogramData;

  periodontalCalculus: {
    bleedingOnProbing: { [tooth: string]: boolean };
    attachmentLoss: { [tooth: string]: boolean };
    pocketDepth4mm: { [tooth: string]: boolean };
    extrinsicStains: { [tooth: string]: boolean };
    calculusScore: { [tooth: string]: number };
    totalCalculusScore: number;
  };

  // B. DIAGNOSIS, PLANNING, IMPLEMENTATION, EVALUATION
  diagnosisAskesgilut: {
    needs: string[];
    causes: string;
    signs: string;
  };

  planning: {
    goals: string;
    interventions: string;
  };

  evaluation: string;
  nextVisitDate: string;
  recommendations: string;

  informedConsent: {
    patientSigned: boolean;
    parentSigned: boolean;
    witnessSigned: boolean;
    operatorSigned: boolean;
    patientSignature?: string;
    guardianSignature?: string;
    operatorSignature?: string;
  };

  operatorId: string;
}

export interface OdontogramData {
  [toothNumber: string]: ToothData;
}

export interface ToothData {
  status: string; // WHO Code or standard abbreviation (e.g., '0', '1', '2', or 'sou', 'car', 'fis')
  surfaces?: {
    occlusal?: string;
    mesial?: string;
    distal?: string;
    buccal?: string;
    lingual?: string;
  };
  notes?: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  dentistId: string;
  date: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  notes: string;
}

export const DENTAL_DIAGNOSIS_GUIDELINES = [
  {
    id: 'protection_risk',
    title: 'Tidak terpenuhinya kebutuhan akan perlindungan dari resiko kesehatan',
    causes: [
      'Partisipasi dalam olahraga/kegiatan/pekerjaan yang beresiko menimbulkan cedera/gangguan kesehatan',
      'Penggunaan produk kesehatan gigi dan mulut yang tidak tepat',
      'Kurangnya pendidikan atau pengetahuan',
      'Parestesia, anestesia',
      'Kebiasaan buruk',
      'Potensi terjadinya infeksi',
      'Potensi terjadinya cedera mulut',
      'Kekhawatiran pada pengalaman negatif tentang pengendalian infeksi, keamanan radiasi, keamanan fluoride dan sejenisnya',
      'Perilaku atau gaya hidup yang berisiko terhadap kesehatan.'
    ],
    signs: [
      'Bukti adanya rujukan segera atau konsultasi dengan seorang dokter mengenai penyakit yang tidak terkontrol',
      'Bukti adanya kebutuhan untuk premedikasi antibiotik',
      'Bukti bahwa klien berisiko terjadinya cedera pada mulut',
      'Bukti bahwa klien berisiko untuk penyakit gigi dan mulut atau penyakit sistemik',
      'Bukti bahwa klien berada dalam situasi yang mengancam hidupnya.'
    ]
  },
  {
    id: 'fear_stress',
    title: 'Tidak terpenuhinya kebutuhan akan bebas dari ketakutan dan atau stress',
    causes: [
      'Pengalaman negatif perawatan sebelumnya',
      'Takut akan hal yang tidak/belum diketahuinya',
      'Kekurangan biaya/sumber keuangan',
      'Takut akan mahalnya biaya perawatan.'
    ],
    signs: [
      'Klien merasa ketakutan',
      'Kekhawatiran klien tentang kerahasiaan, biaya perawatan, penularan penyakit, keracunan fluoride, keracunan merkuri, paparan radiasi, atau pada asuhan kesehatan gigi dan mulut yang direncanakan.'
    ]
  },
  {
    id: 'facial_image',
    title: 'Tidak terpenuhinya kebutuhan akan kesan wajah yang sehat',
    causes: [
      'Menggunakan atau membutuhkan prostesis gigi dan mulut',
      'Penyakit atau gangguan gigi dan mulut yang terlihat',
      'Bau mulut (halitosis)',
      'Maloklusi',
      'Pengguna atau orang yang membutuhkan peralatan ortodontik.'
    ],
    signs: [
      'Klien melaporkan ketidakpuasan dengan penampilan giginya',
      'Klien melaporkan ketidakpuasan dengan penampilan gusi/jaringan periodontalnya',
      'Klien melaporkan ketidakpuasan dengan penampilan profil wajahnya',
      'Klien melaporkan ketidakpuasan dengan penampilan prostesis giginya',
      'Klien melaporkan ketidakpuasan dengan aroma napasnya.'
    ]
  },
  {
    id: 'biological_function',
    title: 'Tidak terpenuhinya kondisi biologis dan fungsi gigi-geligi yang baik',
    causes: [
      'Infeksi Streptococcus mutans',
      'Nutrisi dan diet yang kurang',
      'Faktor-faktor risiko yang dapat berubah dan tidak dapat diubah',
      'Kurangnya pendidikan kesehatan gigi dan mulut',
      'Kurang pemeliharaan kesehatan gigi dan mulut',
      'Kurang melakukan perawatan/pemeriksaan gigi regular.'
    ],
    signs: [
      'Gigi dengan tanda-tanda penyakit',
      'Gigi yang hilang',
      'Rusaknya restorasi',
      'Gigi dengan abrasi atau erosi',
      'Gigi dengan tanda-tanda trauma',
      'Peralatan prostetik yang tidak pas',
      'Kesulitan mengunyah.'
    ]
  },
  {
    id: 'mucosa_integrity',
    title: 'Tidak terpenuhinya keutuhan kulit dan membran mukosa pada kepala dan leher',
    causes: [
      'Infeksi mikroba dan respon inang',
      'Perilaku pemeliharaan kesehatan gigi dan mulut yang tidak memadai',
      'Nutrisi yang tidak memadai',
      'Faktor-faktor risiko yang dapat berubah dan tidak dapat diubah',
      'Penggunaan tembakau',
      'Penyakit sistemik yang tidak terkontrol',
      'Kurang melakukan pemeriksaan/perawatan gigi reguler.'
    ],
    signs: [
      'Adanya lesi ekstraoral atau intraoral, nyeri jika ditekan, atau ada pembengkakan; peradangan gingiva',
      'Perdarahan saat probing; poket dalam atau kehilangan attachment 4 mm; masalah mucogingival',
      'Terdapat xerostomia',
      'Manifestasi oral dari defisiensi nutrisi.'
    ]
  },
  {
    id: 'pain_free',
    title: 'Tidak terpenuhinya kebutuhan terbebas dari nyeri pada kepala dan leher',
    causes: [
      'Ketidaknyamanan sendi rahang/Temporomandibular Joint (TMJ)',
      'Prosedur bedah mulut, prosedur tindakan medis gigi, prosedur asuhan kesehatan gigi dan mulut',
      'Penyakit gigi yang tidak diobati',
      'Akses yang tidak memadai ke fasilitas perawatan atau kurang rutinnya perawatan gigi.'
    ],
    signs: [
      'Rasa sakit atau sensitivitas ekstraoral atau intraoral sebelum perawatan kebersihan gigi',
      'Lunak pada palpasi ketika pemeriksaan ekstraoral atau intraoral',
      'Ketidaknyamanan selama perawatan kebersihan gigi.'
    ]
  },
  {
    id: 'conceptualization',
    title: 'Tidak terpenuhinya konseptualisasi dan pemecahan masalah',
    causes: [
      'Defisit pengetahuan',
      'Kurangnya pemaparan informasi.'
    ],
    signs: [
      'Klien memiliki pertanyaan, kesalahpahaman, atau kurangnya pengetahuan tentang penyakit gigi dan mulut',
      'Klien tidak memahami alasan untuk memelihara kesehatan gigi dan mulutnya sendiri',
      'Klien tidak memahami hubungan antara beberapa penyakit sistemik dan penyakit gigi dan mulut',
      'Klien salah menafsirkan informasi.'
    ]
  },
  {
    id: 'responsibility',
    title: 'Tidak terpenuhinya tanggung jawab untuk kesehatan mulut',
    causes: [
      'Ketidakpatuhan atau ketidaktaatan',
      'Menggunakan alat bantu atau produk perawatan gigi dan mulut yang tidak tepat',
      'Perlu pengawasan orang tua terhadap kebersihan gigi dan mulutnya',
      'Kurang mampu memelihara kesehatan gigi dan mulutnya sendiri',
      'Tidak dapat memelihara kesehatan gigi dan mulutnya sendiri',
      'Kurangnya keterampilan',
      'Gangguan fisik dan kemampuan kognitif',
      'Perilaku pemeliharaan kesehatan mulut yang tidak memadai',
      'Kekurangan sumber keuangan.'
    ],
    signs: [
      'Kontrol plak yang tidak memadai',
      'Kurang pengawasan orang tua (wali) terhadap pemeliharaan kebersihan gigi dan mulut anak sehari-hari',
      'Kurangnya pemantauan status kesehatan diri',
      'Tidak melakukan pemeriksaan gigi dalam 2 tahun terakhir.'
    ]
  }
];
