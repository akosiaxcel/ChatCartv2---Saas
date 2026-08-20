import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getBusinessProfile, updateBusinessProfile } from '../firebase/firestore';
import { BusinessProfile } from '../types';
import { PAYMENT_CONFIG, PRICING_CONFIG } from '../lib/constants';
import { 
  Sparkles, 
  Check, 
  Copy, 
  CreditCard, 
  ShieldCheck, 
  Send, 
  Receipt, 
  ArrowRight, 
  Store, 
  CheckCircle2, 
  ArrowLeft, 
  MessageSquare,
  Utensils,
  Zap,
  HelpCircle,
  UserPlus,
  AlertCircle
} from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Logo } from '../components/Logo';

export default function UpgradePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const urlStoreName = searchParams.get('store') || searchParams.get('name') || '';
  const urlEmail = searchParams.get('email') || '';
  const urlReturn = searchParams.get('returnUrl') || searchParams.get('ref') || '';
  const landingPageUrl = urlReturn || import.meta.env.VITE_LANDING_PAGE_URL || 'https://chatcart-home.wapdev.xyz';

  const [copiedGcash, setCopiedGcash] = useState(false);
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [storeName, setStoreName] = useState(urlStoreName);
  const [ownerContact, setOwnerContact] = useState(urlEmail);
  const [refNumber, setRefNumber] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load existing profile if user is logged in
  useEffect(() => {
    async function loadData() {
      if (user?.uid) {
        try {
          const data = await getBusinessProfile(user.uid);
          if (data) {
            setProfile(data);
            if (!storeName && data.businessName) setStoreName(data.businessName);
            if (!ownerContact && (data.email || user.email)) setOwnerContact(data.email || user.email || '');
          }
        } catch (err) {
          console.warn('Failed to load profile for upgrade page', err);
        }
      }
      setLoadingProfile(false);
    }
    loadData();
  }, [user]);

  const handleCopyGcash = () => {
    navigator.clipboard.writeText(PAYMENT_CONFIG.gcashNumber);
    setCopiedGcash(true);
    setTimeout(() => setCopiedGcash(false), 2000);
  };

  const getUpgradeText = (ref: string, nameToUse?: string, contactToUse?: string) => {
    const finalStoreName = (nameToUse || storeName || profile?.businessName || 'My Restaurant').trim();
    const finalContact = (contactToUse || ownerContact || user?.email || 'N/A').trim();
    const storeSlug = profile?.slug || 'new-store';
    const now = new Date().toLocaleString('en-PH', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    });

    return `
⭐ CHATCART PRO UPGRADE REQUEST ⭐
---------------------------
Store Name: ${finalStoreName}
Store URL: chatcart.wapdev.xyz/${storeSlug}
Owner/Contact: ${finalContact}
Plan: Pro Business (₱499 / mo)
GCash Ref: ${ref.trim()}
Amount: ₱499.00
GCash Recipient: ${PAYMENT_CONFIG.gcashNumber} (${PAYMENT_CONFIG.gcashAccountName})
Date: ${now}
---------------------------
Hi WapDev! I have submitted my GCash payment details for "${finalStoreName}". Please verify and activate my Pro features.
`.trim();
  };

  const handleCopyUpgradeSummary = (refToUse?: string, nameToUse?: string, contactToUse?: string) => {
    const text = getUpgradeText(refToUse || refNumber || 'PENDING', nameToUse || storeName, contactToUse || ownerContact);
    try {
      navigator.clipboard.writeText(text);
      setCopiedSummary(true);
      setTimeout(() => setCopiedSummary(false), 2500);
    } catch (err) {
      console.warn('Failed to copy', err);
    }
  };

  const handleOpenMessenger = (refToUse?: string, nameToUse?: string, contactToUse?: string) => {
    const text = getUpgradeText(refToUse || refNumber || 'PENDING', nameToUse || storeName, contactToUse || ownerContact);
    handleCopyUpgradeSummary(refToUse, nameToUse, contactToUse);

    const encodedText = encodeURIComponent(text);
    const messengerUrl = `${PAYMENT_CONFIG.messengerUrl}?ref=${encodedText}`;
    window.open(messengerUrl, '_blank', 'noopener,noreferrer');
  };

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!storeName.trim()) {
      setError('Please enter your store or restaurant name');
      return;
    }

    if (!ownerContact.trim()) {
      setError('Please enter your owner email or contact number');
      return;
    }

    if (!refNumber.trim()) {
      setError('Please enter your GCash Reference Number');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      // If logged in, update their Firestore profile with pending payment status
      if (user?.uid) {
        await updateBusinessProfile(user.uid, {
          businessName: storeName.trim(),
          planStatus: 'pending_payment',
          paymentReference: refNumber.trim(),
          paymentDate: Date.now(),
          paymentAmount: PAYMENT_CONFIG.amount
        });
      }

      setSubmitted(true);
      handleCopyUpgradeSummary(refNumber.trim(), storeName.trim(), ownerContact.trim());
    } catch (err: any) {
      console.error('Submit payment error:', err);
      setError(err.message || 'Failed to submit payment details.');
    } finally {
      setSubmitting(false);
    }
  };

  const signupRedirectUrl = `/login?mode=signup&businessName=${encodeURIComponent(storeName.trim())}&email=${encodeURIComponent(ownerContact.trim())}&paymentRef=${encodeURIComponent(refNumber.trim())}`;

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col justify-between">
      {/* Top Navbar */}
      <header className="bg-white border-b border-zinc-100 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shadow-xs border border-zinc-200 p-0.5 overflow-hidden">
              <Logo size={34} />
            </div>
            <span className="font-extrabold text-zinc-900 text-lg tracking-tight">ChatCart</span>
            <span className="bg-amber-100 text-amber-900 text-[10px] font-black uppercase px-2 py-0.5 rounded-md tracking-wider">
              PRO
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              to="/demo"
              className="text-xs font-bold text-zinc-600 hover:text-zinc-900 px-3 py-1.5 rounded-lg hover:bg-zinc-100 transition-colors hidden sm:inline-block"
            >
              Live Demo
            </Link>

            <a
              href={landingPageUrl}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-600 hover:text-zinc-900 bg-zinc-100 hover:bg-zinc-200 px-3.5 py-2 rounded-xl transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Home
            </a>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 flex-1 w-full">
        {/* Hero Section */}
        <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-12 space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            ChatCart Pro Business
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-zinc-900 tracking-tight">
            Upgrade Your Restaurant to Pro
          </h1>

          <p className="text-sm sm:text-base text-zinc-600 leading-relaxed">
            Get unlimited dishes, custom branding, bestseller highlighting, and direct Messenger order routing for only <strong className="text-zinc-900 font-bold">₱499 / month</strong>.
          </p>
        </div>

        {/* 2-Column Grid on Desktop / Single-Column on Mobile */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Pro Value & Comparison */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-gradient-to-br from-emerald-700 via-emerald-800 to-teal-900 rounded-3xl p-6 sm:p-7 text-white shadow-[4px_4px_0px_0px_rgba(24,24,27,1)] border-2 border-zinc-900 relative overflow-hidden">
              <div className="absolute -right-8 -bottom-8 w-44 h-44 bg-white/10 rounded-full blur-2xl pointer-events-none" />
              
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-black uppercase tracking-wider text-emerald-200">
                  Subscription Plan
                </span>
                <span className="text-2xl font-black font-mono">₱499<span className="text-xs font-medium text-emerald-200">/mo</span></span>
              </div>

              <h2 className="text-xl font-black mb-4">Everything Included in Pro:</h2>

              <ul className="space-y-3 text-xs sm:text-sm">
                {PRICING_CONFIG.pro.features.map((feat, idx) => (
                  <li key={idx} className="flex items-center gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-emerald-500/40 text-emerald-100 flex items-center justify-center shrink-0 border border-emerald-300/40">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                    <span className="font-medium text-emerald-50">{feat}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-6 pt-4 border-t border-emerald-500/40 flex items-center justify-between text-xs text-emerald-100">
                <span>Monthly Billing Cycle</span>
                <span className="font-bold bg-emerald-500/30 px-2 py-0.5 rounded border border-emerald-300/30">5-Day Grace Period</span>
              </div>
            </div>

            {/* Quick reassurance */}
            <div className="bg-white rounded-2xl p-5 border-2 border-zinc-900 shadow-[2px_2px_0px_0px_rgba(24,24,27,1)] space-y-2 text-xs text-zinc-700">
              <div className="font-bold text-zinc-900 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-700" />
                Direct WapDev Verification
              </div>
              <p className="leading-relaxed font-medium">
                Payments are verified manually by our admin team. Once you create your store account, our team activates Pro directly on your store.
              </p>
            </div>
          </div>

          {/* Right Column: Interactive Upgrade Checkout Card */}
          <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 shadow-[4px_4px_0px_0px_rgba(24,24,27,1)] border-2 border-zinc-900">
            {submitted ? (
              <div className="space-y-6">
                <div className="text-center space-y-2">
                  <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto border-2 border-zinc-900 shadow-[2px_2px_0px_0px_rgba(24,24,27,1)]">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h2 className="text-2xl font-bold text-zinc-900">Payment Submitted!</h2>
                  <p className="text-xs sm:text-sm text-zinc-600 max-w-sm mx-auto leading-relaxed font-medium">
                    Pro request for <strong className="text-zinc-900">{storeName}</strong> is logged with GCash Ref <span className="font-mono font-bold text-emerald-800">#{refNumber}</span>.
                  </p>
                </div>

                {/* Auto-Generated Summary Receipt Card */}
                <div className="bg-zinc-50 border-2 border-dashed border-zinc-900 rounded-2xl p-4 sm:p-5 font-mono text-xs space-y-2.5">
                  <div className="flex items-center justify-between text-zinc-600 font-bold uppercase tracking-widest text-[10px] pb-2 border-b border-zinc-200">
                    <span className="flex items-center gap-1.5 text-zinc-900 font-black">
                      <Receipt className="w-4 h-4 text-zinc-800" /> Payment Summary
                    </span>
                    <span className="text-emerald-700 font-black">READY TO VERIFY</span>
                  </div>

                  <div className="space-y-1.5 text-zinc-800 text-xs leading-relaxed pt-1 font-medium">
                    <div><strong className="text-zinc-900 font-bold">Store:</strong> {storeName}</div>
                    {ownerContact && <div><strong className="text-zinc-900 font-bold">Owner Contact:</strong> {ownerContact}</div>}
                    <div><strong className="text-zinc-900 font-bold">Plan:</strong> Pro Business (₱499 / mo)</div>
                    <div><strong className="text-zinc-900 font-bold">GCash Ref:</strong> <span className="text-emerald-800 font-bold">#{refNumber}</span></div>
                    <div><strong className="text-zinc-900 font-bold">Amount:</strong> ₱499.00</div>
                    <div><strong className="text-zinc-900 font-bold">Recipient:</strong> {PAYMENT_CONFIG.gcashNumber}</div>
                  </div>
                </div>

                {/* REQUIRED STEP 3 FOR NEW USERS: Create Store Account */}
                {!user ? (
                  <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-zinc-900 rounded-2xl p-5 space-y-3.5 shadow-[3px_3px_0px_0px_rgba(24,24,27,1)]">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-zinc-900 text-white flex items-center justify-center shrink-0 border-2 border-zinc-950 font-black">
                        3
                      </div>
                      <div>
                        <h3 className="font-black text-zinc-900 text-sm sm:text-base flex items-center gap-1.5">
                          Required: Create Your Starter Store Account
                        </h3>
                        <p className="text-xs text-zinc-700 mt-0.5 leading-relaxed font-medium">
                          Create your store account now so we can link your payment and instantly activate your Pro menu.
                        </p>
                      </div>
                    </div>

                    <Link
                      to={signupRedirectUrl}
                      className="w-full min-h-[50px] py-3.5 px-5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black text-sm sm:text-base border-2 border-zinc-950 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center justify-center gap-2 active:translate-x-[1px] active:translate-y-[1px]"
                    >
                      <UserPlus className="w-5 h-5" />
                      Create Store Account & Claim Pro →
                    </Link>
                  </div>
                ) : (
                  <div className="bg-emerald-50 border-2 border-zinc-900 rounded-2xl p-4 flex items-center gap-3 shadow-[2px_2px_0px_0px_rgba(24,24,27,1)]">
                    <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
                    <div className="text-xs text-emerald-950 font-medium">
                      <strong className="font-bold">Store Account Linked!</strong> Your logged-in store <strong className="text-zinc-900 font-bold">({profile?.businessName || storeName})</strong> is in the verification queue.
                    </div>
                  </div>
                )}

                {/* Secondary Messenger & Copy Buttons */}
                <div className="space-y-2.5 pt-1">
                  <button
                    type="button"
                    onClick={() => handleOpenMessenger(refNumber, storeName, ownerContact)}
                    className="w-full min-h-[46px] py-3 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 border-2 border-zinc-950 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] cursor-pointer"
                  >
                    <MessageSquare className="w-4 h-4 text-yellow-400" />
                    Send Confirmation to WapDev Messenger
                  </button>

                  <button
                    type="button"
                    onClick={() => handleCopyUpgradeSummary(refNumber, storeName, ownerContact)}
                    className="w-full min-h-[42px] py-2.5 px-4 bg-white hover:bg-zinc-100 text-zinc-900 rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-2 border-2 border-zinc-900 shadow-[2px_2px_0px_0px_rgba(24,24,27,1)] active:translate-x-[1px] active:translate-y-[1px] cursor-pointer"
                  >
                    {copiedSummary ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-700" />
                        <span className="text-emerald-800 font-bold">Copied to Clipboard!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Copy Summary Text
                      </>
                    )}
                  </button>

                  {user && (
                    <Link
                      to="/dashboard"
                      className="block text-center w-full py-2.5 text-xs font-bold text-zinc-700 hover:text-zinc-950 rounded-xl transition-colors hover:underline"
                    >
                      Return to Dashboard
                    </Link>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Step 1: GCash Payment */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-zinc-900 font-black text-sm">
                    <span className="w-6 h-6 rounded-full bg-zinc-900 text-white text-xs flex items-center justify-center font-black border border-zinc-900">1</span>
                    Step 1: Send ₱499 via GCash
                  </div>

                  <div className="bg-emerald-50/70 border-2 border-zinc-900 rounded-2xl p-4 sm:p-5 flex items-center justify-between gap-3 shadow-[3px_3px_0px_0px_rgba(24,24,27,1)]">
                    <div className="min-w-0">
                      <div className="text-[10px] text-zinc-600 font-bold uppercase tracking-wider">GCash Account Number</div>
                      <div className="font-mono text-lg sm:text-xl font-black text-zinc-900">{PAYMENT_CONFIG.gcashNumber}</div>
                      <div className="text-xs text-emerald-900 font-bold">{PAYMENT_CONFIG.gcashAccountName}</div>
                    </div>

                    <button
                      type="button"
                      onClick={handleCopyGcash}
                      className="min-h-[44px] px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 border-2 border-zinc-950 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] cursor-pointer"
                    >
                      {copiedGcash ? (
                        <>
                          <Check className="w-4 h-4 text-emerald-400" /> Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" /> Copy Number
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Step 2: Verification Details */}
                <form onSubmit={handleSubmitPayment} className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-zinc-900 font-black text-sm">
                      <span className="w-6 h-6 rounded-full bg-zinc-900 text-white text-xs flex items-center justify-center font-black border border-zinc-900">2</span>
                      Step 2: Enter Store & GCash Reference
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-800 mb-1.5 flex items-center gap-1.5">
                        <Store className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Store / Restaurant Name <span className="text-rose-500 font-bold">*</span></span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Patty Bros Burger & Cafe"
                        value={storeName}
                        onChange={(e) => setStoreName(e.target.value)}
                        required
                        className="w-full min-h-[48px] px-4 py-3 bg-zinc-50 border-2 border-zinc-900 rounded-xl text-zinc-900 text-sm font-semibold focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden transition-all shadow-[2px_2px_0px_0px_rgba(24,24,27,1)]"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-800 mb-1.5 flex items-center gap-1.5">
                        <UserPlus className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Owner Email or Contact Number <span className="text-rose-500 font-bold">*</span></span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. owner@email.com or 0917XXXXXXX"
                        value={ownerContact}
                        onChange={(e) => setOwnerContact(e.target.value)}
                        required
                        className="w-full min-h-[48px] px-4 py-3 bg-zinc-50 border-2 border-zinc-900 rounded-xl text-zinc-900 text-sm font-semibold focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden transition-all shadow-[2px_2px_0px_0px_rgba(24,24,27,1)]"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-800 mb-1.5 flex items-center gap-1.5">
                        <CreditCard className="w-3.5 h-3.5 text-emerald-700" />
                        <span>GCash Reference Number <span className="text-rose-500 font-bold">*</span></span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 1002 8392 9281"
                        value={refNumber}
                        onChange={(e) => setRefNumber(e.target.value)}
                        required
                        className="w-full min-h-[48px] px-4 py-3 bg-zinc-50 border-2 border-zinc-900 rounded-xl text-zinc-900 text-sm font-mono font-bold focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden transition-all shadow-[2px_2px_0px_0px_rgba(24,24,27,1)]"
                      />
                    </div>
                  </div>

                  {error && (
                    <div className="p-3 bg-red-50 text-red-700 text-xs font-bold rounded-xl border-2 border-red-600">
                      {error}
                    </div>
                  )}

                  <div className="space-y-2.5 pt-2">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full min-h-[50px] py-3.5 px-4 bg-zinc-900 hover:bg-zinc-800 disabled:opacity-50 text-white rounded-xl font-bold text-sm sm:text-base border-2 border-zinc-950 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center justify-center gap-2 active:translate-x-[1px] active:translate-y-[1px] cursor-pointer"
                    >
                      {submitting ? 'Verifying Details...' : 'Continue to Account Setup →'}
                      <Send className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center justify-center gap-1.5 text-[11px] text-zinc-500 text-center pt-2 font-medium">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                    Step 1: GCash → Step 2: Reference # → Step 3: Create Account
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-zinc-100 py-6 text-center text-xs text-zinc-400">
        <p>© {new Date().getFullYear()} ChatCart by WapDev. All rights reserved.</p>
      </footer>
    </div>
  );
}
