import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { auth, db } from './firebase';
import { UserProfile } from './types';

// Pages
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import PatientList from './pages/PatientList';
import PatientDetail from './pages/PatientDetail';
import AppointmentList from './pages/AppointmentList';
import ReportList from './pages/ReportList';
import Education from './pages/Education';
import Layout from './components/Layout';

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (userDoc.exists()) {
          setUser(userDoc.data() as UserProfile);
        } else {
          // Fallback if user doc doesn't exist yet
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email || '',
            displayName: firebaseUser.displayName || 'User',
            role: 'staff', // Default role
            createdAt: new Date().toISOString(),
          });
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
        
        <Route element={user ? <Layout user={user} /> : <Navigate to="/login" />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/patients" element={<PatientList />} />
          <Route path="/patients/:id" element={<PatientDetail user={user} />} />
          <Route path="/appointments" element={<AppointmentList />} />
          <Route path="/reports" element={<ReportList />} />
          <Route path="/education" element={<Education />} />
        </Route>

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}
