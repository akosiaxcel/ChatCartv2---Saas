import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Check, 
  Copy, 
  CheckCircle2, 
  X, 
  MessageSquare, 
  CreditCard, 
  ShieldCheck, 
  Send,
  Receipt,
  ArrowRight,
  Store
} from 'lucide-react';
import { PAYMENT_CONFIG, PRICING_CONFIG } from '../lib/constants';
import { updateBusinessProfile } from '../firebase/firestore';
import { BusinessProfile } from '../types';

interface ProUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: BusinessProfile | null;
  featureReason?: string;
  onSuccess?: () => void;
}

export const ProUpgradeModal: React.FC<ProUpgradeModalProps> = ({
  isOpen,
  onClose,
  profile,
  featureReason,
  onSuccess
}) => {
  const [copiedGcash, setCopiedGcash] = useState(false);
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [storeName, setStoreName] = useState('');
  const [refNumber, setRefNumber] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (profile?.businessName) {
      setStoreName(profile.businessName);
    }
  }, [profile?.businessName]);

  if (!isOpen) return null;

  const handleCopyGcash = () => {
    navigator.clipboard.writeText(PAYMENT_CONFIG.gcashNumber);
    setCopiedGcash(true);
    setTimeout(() => setCopiedGcash(false), 2000);
  };

  const getUpgradeText = (ref: string, nameToUse?: string) => {
    const finalStoreName = (nameToUse || storeName || profile?.businessName || 'My Restaurant').trim();
    const storeSlug = profile?.slug || 'store';
    const ownerEmail = profile?.email || 'N/A';
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
Owner: ${ownerEmail}
Plan: Pro Business (₱499 / mo)
GCash Ref: ${ref.trim()}
Amount: ₱499.00
GCash Recipient: ${PAYMENT_CONFIG.gcashNumber} (${PAYMENT_CONFIG.gcashAccountName})
Date: ${now}
---------------------------
Hi WapDev! I have submitted my GCash payment details for "${finalStoreName}". Please verify and activate my Pro features.
`.trim();
  };

  const handleCopyUpgradeSummary = (refToUse?: string, nameToUse?: string) => {
    const text = getUpgradeText(refToUse || refNumber || 'PENDING', nameToUse || storeName);
    try {
      navigator.clipboard.writeText(text);
      setCopiedSummary(true);
      setTimeout(() => setCopiedSummary(false), 2500);
    } catch (err) {
      console.warn('Failed to copy', err);
    }
  };

  const handleOpenMessenger = (refToUse?: string, nameToUse?: string) => {
    const text = getUpgradeText(refToUse || refNumber || 'PENDING', nameToUse || storeName);
    handleCopyUpgradeSummary(refToUse, nameToUse);

    const encodedText = encodeURIComponent(text);
    const messengerUrl = `${PAYMENT_CONFIG.messengerUrl}?ref=${encodedText}`;
    window.open(messengerUrl, '_blank', 'noopener,noreferrer');
  };

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.uid) return;

    if (!storeName.trim()) {
      setError('Please enter your store / business name');
      return;
    }

    if (!refNumber.trim()) {
      setError('Please enter your GCash Reference Number');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await updateBusinessProfile(profile.uid, {
        businessName: storeName.trim(),
        planStatus: 'pending_payment',
        paymentReference: refNumber.trim(),
        paymentDate: Date.now(),
        paymentAmount: PAYMENT_CONFIG.amount
      });
      setSubmitted(true);
      handleCopyUpgradeSummary(refNumber.trim(), storeName.trim());
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to submit payment details.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-zinc-950/60 backdrop-blur-xs animate-fade-in">
      {/* Backdrop click */}
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative z-10 bg-white w-full sm:max-w-lg rounded-t-[32px] sm:rounded-[32px] shadow-2xl border border-zinc-100 overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[88vh] animate-in slide-in-from-bottom sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200">
        
        {/* Mobile pull handle */}
        <div className="w-12 h-1.5 bg-zinc-300 rounded-full mx-auto my-2.5 sm:hidden shrink-0" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors z-20"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Scrollable Container */}
        <div className="overflow-y-auto overscroll-contain flex-1">
          {/* Hero Banner */}
          <div className="bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 p-5 sm:p-7 text-white relative overflow-hidden shrink-0">
            <div className="absolute -right-8 -bottom-8 w-36 h-36 bg-white/10 rounded-full blur-2xl pointer-events-none" />
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/30 border border-emerald-400/30 text-emerald-100 text-[11px] font-bold uppercase tracking-wider mb-2.5">
              <Sparkles className="w-3.5 h-3.5 text-yellow-300 shrink-0" />
              {featureReason ? 'Pro Feature Discovered' : 'Upgrade to Pro Business'}
            </div>

            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
              {featureReason ? "Unlock the Full Power of ChatCart" : "Go Pro for only ₱499/mo"}
            </h2>

            <p className="mt-1.5 text-emerald-100 text-xs sm:text-sm leading-relaxed">
              {featureReason || "Supercharge your restaurant sales with unlimited dishes, custom branding, and direct Messenger acceleration."}
            </p>
          </div>

          <div className="p-5 sm:p-7 space-y-5">
            {submitted ? (
              <div className="space-y-4">
                <div className="text-center space-y-2">
                  <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-zinc-900">Upgrade Request Generated!</h3>
                  <p className="text-xs sm:text-sm text-zinc-600 max-w-sm mx-auto leading-relaxed">
                    Details generated for <strong className="text-zinc-900">{storeName || profile?.businessName}</strong>. Send them to WapDev on Messenger for instant verification.
                  </p>
                </div>

                {/* Auto-Generated Summary Receipt Card */}
                <div className="bg-zinc-50 border border-dashed border-zinc-300 rounded-2xl p-4 font-mono text-xs space-y-2 relative">
                  <div className="flex items-center justify-between text-zinc-400 font-bold uppercase tracking-widest text-[10px] pb-1 border-b border-zinc-200">
                    <span className="flex items-center gap-1">
                      <Receipt className="w-3.5 h-3.5" /> Auto-Generated Summary
                    </span>
                    <span className="text-emerald-600 font-bold">READY TO SEND</span>
                  </div>

                  <div className="space-y-1 text-zinc-700 text-[11px] leading-relaxed pt-1">
                    <div><strong className="text-zinc-900">Store:</strong> {storeName || profile?.businessName}</div>
                    <div><strong className="text-zinc-900">Plan:</strong> Pro Business (₱499 / mo)</div>
                    <div><strong className="text-zinc-900">GCash Ref:</strong> <span className="text-emerald-700 font-bold">{refNumber}</span></div>
                    <div><strong className="text-zinc-900">Amount:</strong> ₱499.00</div>
                    <div><strong className="text-zinc-900">Recipient:</strong> {PAYMENT_CONFIG.gcashNumber}</div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2.5 pt-1">
                  <button
                    type="button"
                    onClick={() => handleOpenMessenger(refNumber, storeName)}
                    className="w-full min-h-[48px] py-3.5 px-5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
                  >
                    <MessageSquare className="w-4 h-4" />
                    Send Details to WapDev Messenger
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleCopyUpgradeSummary(refNumber, storeName)}
                    className="w-full min-h-[44px] py-2.5 px-4 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-2 active:scale-[0.98]"
                  >
                    {copiedSummary ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-600">Copied to Clipboard!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        Copy Details Summary
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={onClose}
                    className="w-full min-h-[40px] py-2 text-xs font-bold text-zinc-500 hover:text-zinc-800 rounded-xl hover:bg-zinc-50 transition-colors"
                  >
                    Done & Return to Dashboard
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Features List */}
                <div className="space-y-2 bg-zinc-50 p-4 rounded-2xl border border-zinc-100">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
                    What you get with Pro Business (₱499/mo):
                  </p>
                  {PRICING_CONFIG.pro.features.map((feat, idx) => (
                    <div key={idx} className="flex items-center gap-2.5 text-xs sm:text-sm text-zinc-700">
                      <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3" />
                      </div>
                      <span className="font-medium">{feat}</span>
                    </div>
                  ))}
                </div>

                {/* Step 1: GCash Details */}
                <div className="border border-emerald-100 bg-emerald-50/50 rounded-2xl p-4 space-y-2.5">
                  <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs sm:text-sm">
                    <CreditCard className="w-4 h-4 text-emerald-600 shrink-0" />
                    Step 1: Send ₱499 via GCash
                  </div>
                  
                  <div className="bg-white p-3.5 rounded-xl border border-emerald-200 flex items-center justify-between shadow-2xs gap-2">
                    <div className="min-w-0">
                      <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">GCash Account</div>
                      <div className="font-mono text-sm sm:text-base font-black text-zinc-900 truncate">{PAYMENT_CONFIG.gcashNumber}</div>
                      <div className="text-[11px] text-emerald-700 font-semibold">{PAYMENT_CONFIG.gcashAccountName}</div>
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyGcash}
                      className="min-h-[40px] px-3.5 py-2 rounded-xl bg-emerald-100 text-emerald-700 hover:bg-emerald-200 text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 active:scale-95"
                    >
                      {copiedGcash ? (
                        <>
                          <Check className="w-3.5 h-3.5" /> Copied
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" /> Copy
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Step 2: Verification Details Form */}
                <form onSubmit={handleSubmitPayment} className="space-y-4">
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-700 mb-1.5 flex items-center gap-1.5">
                        <Store className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Step 2: Store / Business Name <span className="text-rose-500 font-bold">*</span></span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Patty Bros Burger & Cafe"
                        value={storeName}
                        onChange={(e) => setStoreName(e.target.value)}
                        required
                        className="w-full min-h-[46px] px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 text-sm font-medium focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-700 mb-1.5 flex items-center gap-1.5">
                        <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Step 3: GCash Reference Number <span className="text-rose-500 font-bold">*</span></span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 1002 8392 9281"
                        value={refNumber}
                        onChange={(e) => setRefNumber(e.target.value)}
                        required
                        className="w-full min-h-[46px] px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 text-sm font-mono focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden transition-all"
                      />
                    </div>
                  </div>

                  {error && <p className="text-xs text-rose-500 font-medium">{error}</p>}

                  <div className="space-y-2 pt-1">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full min-h-[48px] py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl font-bold text-sm shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
                    >
                      {submitting ? 'Submitting...' : 'Submit & Generate Upgrade Message'}
                      <Send className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenMessenger(refNumber, storeName)}
                      className="w-full min-h-[44px] py-2.5 px-4 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 active:scale-[0.98]"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
                      Chat with WapDev Support
                    </button>
                  </div>

                  <div className="flex items-center justify-center gap-1.5 text-[10px] text-zinc-400 text-center pt-1 pb-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    Auto-formatted details • 1-Click copy & send
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
