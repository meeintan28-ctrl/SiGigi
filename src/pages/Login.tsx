import { useState, useEffect } from 'react';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth, db, isDbConnected } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { ShieldCheck, LogIn, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

const ADMIN_EMAILS = ['mee.intan28@gmail.com'];

export default function Login() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [captcha, setCaptcha] = useState('');
  const [captchaInput, setCaptchaInput] = useState('');
  const [dbStatus, setDbStatus] = useState(isDbConnected);

  const generateCaptcha = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCaptcha(result);
  };

  const [isIframe, setIsIframe] = useState(false);

  useEffect(() => {
    generateCaptcha();
    setIsIframe(window.self !== window.top);
    
    const interval = setInterval(() => {
      setDbStatus(isDbConnected);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleGoogleLogin = async () => {
    if (captchaInput.toUpperCase() !== captcha) {
      setError('Captcha tidak valid. Silakan coba lagi.');
      generateCaptcha();
      setCaptchaInput('');
      return;
    }

    setLoading(true);
    setError(null);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const isAdminEmail = user.email ? ADMIN_EMAILS.includes(user.email) : false;

      // Check if user profile exists
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (!userDoc.exists()) {
        // Create default profile
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || 'User',
          role: isAdminEmail ? 'admin' : 'staff',
          createdAt: new Date().toISOString(),
        });
      } else if (isAdminEmail && userDoc.data().role !== 'admin') {
        // Ensure role is admin if it's the special email but doc says otherwise
        await setDoc(doc(db, 'users', user.uid), {
          ...userDoc.data(),
          role: 'admin'
        }, { merge: true });
      }
    } catch (err: any) {
      console.error('Auth Error:', err);
      if (err.code === 'auth/popup-blocked') {
        setError('Popup terblokir oleh browser. Silakan izinkan popup untuk situs ini.');
      } else if (err.code === 'auth/cancelled-popup-request') {
        setError('Proses masuk dibatalkan.');
      } else if (window.self !== window.top) {
        setError('Proses masuk mungkin terblokir karena aplikasi dijalankan di dalam iframe. Silakan buka aplikasi di tab baru.');
      } else {
        setError(`Gagal masuk: ${err.message || 'Silakan coba lagi.'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-3xl shadow-xl shadow-slate-200/50 p-10 border border-slate-100"
      >
        <div className="flex flex-col items-center mb-10">
          <div className="bg-blue-600 p-4 rounded-2xl mb-6 shadow-lg shadow-blue-200">
            <ShieldCheck className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">DentalCare</h1>
          <p className="text-slate-500 text-center font-medium">Sistem Informasi Asuhan Kesehatan Gigi & Mulut</p>
        </div>

        <div className="mb-6 flex justify-center">
          <div className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all",
            dbStatus ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-red-50 text-red-600 border border-red-100"
          )}>
            <div className={cn("w-2 h-2 rounded-full", dbStatus ? "bg-emerald-500 animate-pulse" : "bg-red-500")} />
            {dbStatus ? "Database Terhubung" : "Menghubungkan Database..."}
          </div>
        </div>

        {isIframe && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-100 text-amber-700 rounded-xl text-xs font-medium flex gap-3">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p>
              Anda sedang membuka aplikasi di dalam iFrame. Jika login gagal, silakan gunakan tombol <strong>"Buka di tab baru"</strong> di pojok kanan atas.
            </p>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm font-medium">
            {error}
          </div>
        )}

        <div className="space-y-6 mb-8">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase ml-1">Verifikasi Keamanan</label>
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-slate-100 h-14 rounded-2xl flex items-center justify-center font-mono text-2xl font-black tracking-[0.5em] text-slate-400 select-none border-2 border-dashed border-slate-200 italic">
                {captcha}
              </div>
              <button 
                onClick={generateCaptcha}
                className="p-4 bg-slate-50 hover:bg-slate-100 rounded-2xl border border-slate-200 transition-colors"
                title="Refresh Captcha"
              >
                <RefreshCw className="w-5 h-5 text-slate-500" />
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <input
              type="text"
              placeholder="Masukkan kode di atas"
              className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-bold text-center uppercase tracking-widest"
              value={captchaInput}
              onChange={(e) => setCaptchaInput(e.target.value)}
            />
          </div>
        </div>

        <button
          onClick={handleGoogleLogin}
          disabled={loading || !captchaInput}
          className="w-full flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-2xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-200 group"
        >
          {loading ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
          ) : (
            <>
              <LogIn className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              <span>Masuk dengan Google</span>
            </>
          )}
        </button>

        <div className="mt-10 text-center">
          <p className="text-xs text-slate-400 font-medium">
            Sesuai Standar Kemenkes RI & WHO
          </p>
        </div>
      </motion.div>
      
      <p className="mt-8 text-sm text-slate-400 font-medium">
        © 2026 DentalCare System. All rights reserved.
      </p>
    </div>
  );
}
