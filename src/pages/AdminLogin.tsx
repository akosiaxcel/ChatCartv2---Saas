import React, { useState, useEffect } from 'react';
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '../firebase/config';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, Mail, Lock, ArrowRight, Loader2 } from 'lucide-react';
import { Logo } from '../components/Logo';

export default function AdminLogin() {
  const { user: currentUser, loading: authLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && currentUser && currentUser.email === 'axceljohnpatriarca@gmail.com') {
      navigate('/superadmin/dashboard', { replace: true });
    }
  }, [currentUser, authLoading, navigate]);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      // Restrict access to the specific Super Admin email
      if (user.email !== 'axceljohnpatriarca@gmail.com') {
        throw new Error(`Unauthorized (${user.email}): This Google account does not have Super Admin privileges.`);
      }
      
      navigate('/superadmin/dashboard');
    } catch (err: any) {
      console.error("Admin Google Auth Error:", err);
      setError(err.message || 'Failed to sign in with Google.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
      const user = userCredential.user;
      
      if (user.email !== 'axceljohnpatriarca@gmail.com') {
        throw new Error('Unauthorized: This account does not have Super Admin privileges.');
      }
      
      navigate('/superadmin/dashboard');
    } catch (err: any) {
      console.error("Admin Login Error:", err);
      setError(err.message || 'Invalid admin credentials or unauthorized access.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-900 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-zinc-800 rounded-[32px] shadow-2xl p-8 md:p-10 border border-zinc-700">
        <div className="flex flex-col items-center text-center mb-10">
          <div className="w-24 h-24 rounded-[32px] mb-4 shadow-2xl bg-white flex items-center justify-center border border-zinc-700/50 p-1.5 overflow-hidden">
            <Logo size={86} />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-2 justify-center">
            <ShieldCheck className="w-7 h-7 text-emerald-400" />
            Super Admin
          </h1>
          <p className="text-zinc-400 mt-2 text-sm">
            Master control for platform management & business approvals
          </p>
        </div>

        <div className="space-y-6">
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-4 py-4 bg-white border border-transparent rounded-2xl font-bold text-zinc-900 hover:bg-zinc-100 active:scale-[0.98] transition-all disabled:opacity-50 shadow-lg"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" />
            Sign in with Google
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-zinc-700"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-zinc-800 px-4 text-zinc-500 font-bold tracking-widest">Or use password</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-zinc-300 ml-1">Admin Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-zinc-900 border-zinc-700 text-white rounded-2xl focus:ring-2 focus:ring-emerald-500 transition-all placeholder:text-zinc-600"
                  placeholder="axceljohnpatriarca@gmail.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-zinc-300 ml-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-zinc-900 border-zinc-700 text-white rounded-2xl focus:ring-2 focus:ring-emerald-500 transition-all placeholder:text-zinc-600"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl text-center">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-500 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-emerald-600 active:scale-[0.98] transition-all disabled:opacity-50 shadow-lg shadow-emerald-500/20"
            >
              {loading ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <>
                  Login to Admin
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          <div className="text-center pt-2">
            <Link to="/login" className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
              Looking for regular business login? Click here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
