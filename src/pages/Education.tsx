import { motion } from 'motion/react';
import { Play, BookOpen, Share2, Heart, Search } from 'lucide-react';
import { useState } from 'react';

const videos = [
  {
    id: '-sbCmdHEEs4',
    title: 'Cara Menyikat Gigi yang Benar',
    description: 'Panduan lengkap langkah demi langkah menyikat gigi untuk kesehatan optimal.',
    category: 'Kebersihan Mulut',
    duration: '3:45'
  },
  {
    id: '-XNiBpA1n18',
    title: 'Pentingnya Flossing Setiap Hari',
    description: 'Mengapa menyikat gigi saja tidak cukup? Pelajari teknik flossing yang benar.',
    category: 'Kebersihan Mulut',
    duration: '2:30'
  },
  {
    id: 'Gkxh6uZSbOo',
    title: 'Makanan yang Baik untuk Gigi',
    description: 'Daftar makanan dan minuman yang membantu memperkuat email gigi Anda.',
    category: 'Nutrisi',
    duration: '4:15'
  },
  {
    id: 'DdVTN0bU7gI',
    title: 'Mengenal Karies Gigi dan Pencegahannya',
    description: 'Apa itu karies? Bagaimana cara mencegahnya sebelum menjadi parah?',
    category: 'Penyakit Gigi',
    duration: '5:20'
  },
  {
    id: 'k5Kz3xQzqF0',
    title: 'Tips Menjaga Kesehatan Gigi Anak',
    description: 'Edukasi khusus untuk orang tua dalam merawat gigi susu si kecil.',
    category: 'Kesehatan Anak',
    duration: '6:10'
  }
];

export default function Education() {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredVideos = videos.filter(v => 
    v.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Edukasi & Promosi Kesehatan</h1>
          <p className="text-slate-500 font-medium">Materi edukasi interaktif untuk pasien dan tenaga kesehatan.</p>
        </div>
        <div className="relative w-full md:w-72">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari materi..."
            className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredVideos.map((video, index) => (
          <motion.div
            key={video.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden group hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300"
          >
            <div className="relative aspect-video bg-slate-100">
              <iframe
                className="w-full h-full"
                src={`https://www.youtube.com/embed/${video.id}`}
                title={video.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
              <div className="absolute top-4 left-4">
                <span className="px-3 py-1 bg-white/90 backdrop-blur-sm text-blue-600 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm">
                  {video.category}
                </span>
              </div>
              <div className="absolute bottom-4 right-4">
                <span className="px-2 py-1 bg-black/60 backdrop-blur-sm text-white rounded-lg text-[10px] font-bold">
                  {video.duration}
                </span>
              </div>
            </div>
            <div className="p-6">
              <h3 className="font-bold text-slate-900 text-lg mb-2 group-hover:text-blue-600 transition-colors">
                {video.title}
              </h3>
              <p className="text-sm text-slate-500 leading-relaxed mb-6">
                {video.description}
              </p>
              <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                <div className="flex items-center gap-4">
                  <button className="flex items-center gap-1.5 text-slate-400 hover:text-red-500 transition-colors">
                    <Heart className="w-4 h-4" />
                    <span className="text-xs font-bold">Suka</span>
                  </button>
                  <button className="flex items-center gap-1.5 text-slate-400 hover:text-blue-600 transition-colors">
                    <Share2 className="w-4 h-4" />
                    <span className="text-xs font-bold">Bagikan</span>
                  </button>
                </div>
                <button className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all">
                  <Play className="w-4 h-4 fill-current" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Promotion Banner */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[40px] p-8 md:p-12 text-white relative overflow-hidden shadow-2xl shadow-blue-500/20"
      >
        <div className="relative z-10 max-w-2xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-white/20 backdrop-blur-md rounded-xl">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <span className="font-bold uppercase tracking-widest text-xs text-blue-100">Program Promosi</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-6 leading-tight">
            Tingkatkan Kesadaran Kesehatan Gigi di Masyarakat
          </h2>
          <p className="text-blue-100 text-lg mb-8 leading-relaxed">
            Gunakan materi edukasi ini untuk presentasi di sekolah, puskesmas, atau dibagikan langsung ke pasien melalui WhatsApp.
          </p>
          <div className="flex flex-wrap gap-4">
            <button className="px-8 py-4 bg-white text-blue-600 rounded-2xl font-bold hover:bg-blue-50 transition-all shadow-lg">
              Unduh Semua Materi
            </button>
            <button className="px-8 py-4 bg-blue-500/30 backdrop-blur-md text-white border border-white/20 rounded-2xl font-bold hover:bg-white/10 transition-all">
              Jadwalkan Penyuluhan
            </button>
          </div>
        </div>
        
        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-400/20 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl" />
      </motion.div>
    </div>
  );
}
