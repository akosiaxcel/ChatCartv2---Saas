import React, { useState, useEffect } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '../firebase/config';
import { useAuth } from '../context/AuthContext';
import { updateBusinessProfile, getBusinessProfile, generateUniqueSlug } from '../firebase/firestore';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Mail, Lock, ArrowRight, Loader2, Store, ArrowLeft, Sparkles, CreditCard } from 'lucide-react';
import { Logo } from '../components/Logo';

export default function Login() {
  const { user: currentUser, loading: authLoading } = useAuth();
  const [searchParams] = useSearchParams();
  
  // Detect if coming from landing page with signup intent or prefilled values
  const urlMode = searchParams.get('mode');
  const urlEmail = searchParams.get('email') || '';
  const urlBusinessName = searchParams.get('businessName') || searchParams.get('name') || '';
  const urlPlan = searchParams.get('plan') || '';
  const urlPaymentRef = searchParams.get('paymentRef') || searchParams.get('refNumber') || '';
  const urlReturn = searchParams.get('returnUrl') || searchParams.get('ref') || '';
  const landingPageUrl = urlReturn || import.meta.env.VITE_LANDING_PAGE_URL || 'https://chatcart-home.wapdev.xyz';

  const [isLogin, setIsLogin] = useState(urlMode !== 'signup' && urlMode !== 'register');
  const [email, setEmail] = useState(urlEmail);
  const [password, setPassword] = useState('');
  const [businessName, setBusinessName] = useState(urlBusinessName);
  const [gcashRef, setGcashRef] = useState(urlPaymentRef);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Auto redirect if already logged in
  useEffect(() => {
    if (!authLoading && currentUser) {
      if (currentUser.email === 'axceljohnpatriarca@gmail.com') {
        navigate('/superadmin/dashboard', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    }
  }, [currentUser, authLoading, navigate]);

  // Update form if URL params change
  useEffect(() => {
    if (urlMode === 'signup' || urlMode === 'register') {
      setIsLogin(false);
    }
    if (urlEmail) setEmail(urlEmail);
    if (urlBusinessName) setBusinessName(urlBusinessName);
    if (urlPaymentRef) setGcashRef(urlPaymentRef);
  }, [urlMode, urlEmail, urlBusinessName, urlPaymentRef]);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      // If Super Admin logs in via Google
      if (user.email === 'axceljohnpatriarca@gmail.com') {
        navigate('/superadmin/dashboard');
        return;
      }

      const activeRef = (gcashRef || urlPaymentRef || '').trim();

      // Check if profile exists, if not initialize it
      const profile = await getBusinessProfile(user.uid);
      if (!profile) {
        const name = businessName.trim() || user.displayName || 'My Business';
        const cleanSlug = await generateUniqueSlug(name, user.uid);
        const newProfileData: any = {
          businessName: name,
          slug: cleanSlug,
          messengerPageUsername: '',
          email: user.email || '',
          status: 'pending',
          plan: 'starter',
          createdAt: Date.now()
        };

        if (activeRef) {
          newProfileData.planStatus = 'pending_payment';
          newProfileData.paymentReference = activeRef;
          newProfileData.paymentDate = Date.now();
          newProfileData.paymentAmount = 499;
        }

        await updateBusinessProfile(user.uid, newProfileData);
      } else if (activeRef && !profile.paymentReference) {
        await updateBusinessProfile(user.uid, {
          planStatus: 'pending_payment',
          paymentReference: activeRef,
          paymentDate: Date.now(),
          paymentAmount: 499
        });
      }
      navigate('/dashboard');
    } catch (err: any) {
      console.error("Google Auth Error:", err);
      setError(err.message || "Failed to sign in with Google.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        // Block Super Admin from standard password login here
        if (email.trim().toLowerCase() === 'axceljohnpatriarca@gmail.com') {
          navigate('/superadmin');
          return;
        }
        await signInWithEmailAndPassword(auth, email.trim(), password);
      } else {
        if (email.trim().toLowerCase() === 'axceljohnpatriarca@gmail.com') {
          throw new Error("This email is reserved for Super Admin.");
        }
        const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
        const user = userCredential.user;
        
        try {
          const name = businessName.trim() || 'My Business';
          const cleanSlug = await generateUniqueSlug(name, user.uid);
          const activeRef = (gcashRef || urlPaymentRef || '').trim();
          
          const profileData: any = {
            businessName: name,
            slug: cleanSlug,
            messengerPageUsername: '',
            email: user.email || email.trim(),
            status: 'pending',
            plan: 'starter',
            createdAt: Date.now()
          };

          if (activeRef) {
            profileData.planStatus = 'pending_payment';
            profileData.paymentReference = activeRef;
            profileData.paymentDate = Date.now();
            profileData.paymentAmount = 499;
          }

          // Initialize business profile
          await updateBusinessProfile(user.uid, profileData);
        } catch (dbErr: any) {
          console.error("Firestore Error:", dbErr);
          if (dbErr.code === 'permission-denied') {
            throw new Error("Account created, but profile setup failed due to permission rules. Please ensure your Firestore rules allow writes to /users/{uid}.");
          }
          throw dbErr;
        }
      }
      navigate('/dashboard');
    } catch (err: any) {
      console.error("Auth/Login Error:", err);
      setError(err.message || "An unexpected error occurred. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center p-6 relative">
      {/* Landing page link / Back button */}
      <div className="w-full max-w-md mb-4 flex items-center justify-between">
        <Link
          to="/upgrade"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-full border border-emerald-200/60 transition-colors shadow-2xs"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
          Go Pro (₱499/mo)
        </Link>
        
        <a
          href={landingPageUrl}
          className="inline-flex items-center gap-1 text-xs font-semibold text-zinc-500 hover:text-zinc-800 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to ChatCart
        </a>
      </div>

      <div className="w-full max-w-md bg-white rounded-[32px] shadow-xl shadow-zinc-200/50 p-8 md:p-10 border border-zinc-100">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-22 h-22 rounded-[28px] mb-4 shadow-lg bg-white flex items-center justify-center shadow-emerald-500/10 border border-zinc-100 p-1.5 overflow-hidden">
            <Logo size={76} />
          </div>
          <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">
            {isLogin ? 'Welcome Back' : 'Create Store'}
          </h1>
          <p className="text-zinc-500 text-sm mt-1.5">
            {isLogin ? 'Sign in to manage your digital menu' : 'Launch your contactless QR menu in minutes'}
          </p>
          {urlPlan && !isLogin && (
            <div className="mt-3 px-3 py-1 bg-emerald-50 border border-emerald-100 rounded-full text-emerald-700 text-xs font-bold uppercase tracking-wider">
              Selected Plan: {urlPlan}
            </div>
          )}
        </div>

        <div className="space-y-5">
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-4 py-3.5 bg-white border border-zinc-200 rounded-2xl font-bold text-sm text-zinc-700 hover:bg-zinc-50 active:scale-[0.98] transition-all disabled:opacity-50 shadow-xs"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-4 h-4" alt="Google" />
            {isLogin ? 'Sign in with Google' : 'Sign up with Google'}
          </button>

          <div className="relative my-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-zinc-100"></div>
            </div>
            <div className="relative flex justify-center text-[10px] uppercase">
              <span className="bg-white px-3 text-zinc-400 font-bold tracking-widest">Or with email</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-700 ml-1">Business / Restaurant Name</label>
                <div className="relative">
                  <Store className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <input
                    type="text"
                    required
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-zinc-50 border border-zinc-100 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                    placeholder="e.g. ChatCart Bistro"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-700 ml-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-zinc-50 border border-zinc-100 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                  placeholder="name@business.com"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-700 ml-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-zinc-50 border border-zinc-100 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {!isLogin && (
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-zinc-700 ml-1 flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                    Paid via GCash? GCash Ref # (Optional)
                  </label>
                  <span className="text-[10px] font-bold text-amber-600 uppercase">For Pro ₱499</span>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    value={gcashRef}
                    onChange={(e) => setGcashRef(e.target.value)}
                    className="w-full px-4 py-2.5 bg-emerald-50/40 border border-emerald-200/70 rounded-xl text-xs font-mono font-bold text-zinc-900 focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all placeholder:font-sans placeholder:font-normal placeholder:text-zinc-400"
                    placeholder="e.g. 1029 3847 5610 (if already paid)"
                  />
                </div>
                <p className="text-[10px] text-zinc-400 leading-tight pl-1">
                  Transferred ₱499 via GCash? Paste your reference number here so our team can immediately activate your Pro plan.
                </p>
              </div>
            )}

            {error && (
              <div className="p-3 bg-red-50 text-red-600 text-xs font-semibold rounded-xl border border-red-100">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-zinc-900 text-white py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-zinc-800 active:scale-[0.98] transition-all disabled:opacity-50 shadow-md mt-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                <>
                  {isLogin ? 'Sign In to Dashboard' : 'Register Store'}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
            }}
            className="text-xs text-zinc-500 hover:text-zinc-900 font-semibold transition-colors"
          >
            {isLogin ? "Don't have an account yet? Create one" : "Already registered? Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
}
