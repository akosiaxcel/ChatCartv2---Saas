import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { collection, getDocs } from 'firebase/firestore';
import { db, auth } from '../firebase/config';
import { sendPasswordResetEmail } from 'firebase/auth';
import { setBusinessStatus, deleteBusiness, updateBusinessProfile } from '../firebase/firestore';
import AdminLayout from '../components/AdminLayout';
import { BusinessProfile } from '../types';
import { 
  Users, 
  ExternalLink, 
  Loader2, 
  CheckCircle, 
  XCircle, 
  Trash2, 
  Clock, 
  Search, 
  Shield, 
  RefreshCw, 
  AlertTriangle,
  Sparkles,
  CreditCard,
  Copy,
  Check,
  MessageSquare,
  Calendar,
  AlertCircle,
  Bell,
  CheckCircle2,
  CalendarCheck,
  ChevronDown,
  ChevronUp,
  UserCheck,
  UserX,
  Edit3,
  Plus,
  KeyRound,
  MessageCircle,
  Lock,
  X
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';
import { PAYMENT_CONFIG, PRICING_CONFIG } from '../lib/constants';

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
const FIVE_DAYS_MS = 5 * 24 * 60 * 60 * 1000;

interface EditRefModalData {
  uid: string;
  businessName: string;
  refNumber: string;
  amount: number;
}

export default function SuperAdmin() {
  const { user } = useAuth();
  const [businesses, setBusinesses] = useState<BusinessProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [deletingBiz, setDeletingBiz] = useState<BusinessProfile | null>(null);
  const [editingRefBiz, setEditingRefBiz] = useState<EditRefModalData | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'pending_payment' | 'pro' | 'grace_period' | 'overdue' | 'starter'>('all');
  const [copiedRef, setCopiedRef] = useState<string | null>(null);
  const [expandedBilling, setExpandedBilling] = useState<Record<string, boolean>>({});
  
  // Password Reset & Messenger Recovery modal state
  const [resetModalBiz, setResetModalBiz] = useState<BusinessProfile | null>(null);
  const [resetEmailSending, setResetEmailSending] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [resetModalError, setResetModalError] = useState<string | null>(null);
  const [copiedMessenger, setCopiedMessenger] = useState(false);

  const isSuperAdmin = user?.email === 'axceljohnpatriarca@gmail.com';

  const fetchBusinesses = async () => {
    if (!isSuperAdmin) {
      setError("Unauthorized: Access restricted to Super Admin (axceljohnpatriarca@gmail.com).");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const querySnapshot = await getDocs(collection(db, 'users'));
      const list = querySnapshot.docs.map(doc => {
        const data = doc.data() as BusinessProfile;
        return {
          ...data,
          uid: doc.id,
          status: data.status || 'pending',
          plan: data.plan || 'starter',
          planStatus: data.planStatus || 'active',
          proStartedAt: data.proStartedAt || (data.plan === 'pro' ? (data.createdAt || Date.now()) : undefined),
          createdAt: data.createdAt || 0,
          businessName: data.businessName || 'Unnamed Business',
          messengerPageUsername: data.messengerPageUsername || '',
          slug: data.slug || ''
        };
      });
      
      // Sort: Pending GCash references first, then pending store signups, then newest
      list.sort((a, b) => {
        if (a.planStatus === 'pending_payment' && b.planStatus !== 'pending_payment') return -1;
        if (a.planStatus !== 'pending_payment' && b.planStatus === 'pending_payment') return 1;
        if (a.status === 'pending' && b.status !== 'pending') return -1;
        if (a.status !== 'pending' && b.status === 'pending') return 1;
        return (b.createdAt || 0) - (a.createdAt || 0);
      });
      
      setBusinesses(list);
    } catch (err: any) {
      console.error("Error fetching businesses:", err);
      setError(err.message || "Failed to fetch registrations.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBusinesses();
  }, [user]);

  // Subscription helpers
  const getBillingStatus = (biz: BusinessProfile) => {
    if (biz.plan !== 'pro') return { type: 'starter', label: 'Starter (Free)', daysLeft: null, dueDate: null };
    
    const startedAt = biz.proStartedAt || biz.createdAt || Date.now();
    const dueDate = startedAt + THIRTY_DAYS_MS;
    const gracePeriodEnd = dueDate + FIVE_DAYS_MS;
    const now = Date.now();

    if (now <= dueDate) {
      const daysLeft = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));
      return { type: 'active', label: `Active (${daysLeft}d left)`, daysLeft, dueDate, gracePeriodEnd };
    } else if (now <= gracePeriodEnd) {
      const daysLeftInGrace = Math.ceil((gracePeriodEnd - now) / (1000 * 60 * 60 * 24));
      return { type: 'grace_period', label: `Grace Period (${daysLeftInGrace}d left)`, daysLeft: daysLeftInGrace, dueDate, gracePeriodEnd };
    } else {
      const daysOverdue = Math.floor((now - gracePeriodEnd) / (1000 * 60 * 60 * 24));
      return { type: 'overdue', label: `Overdue (${daysOverdue}d)`, daysLeft: -daysOverdue, dueDate, gracePeriodEnd };
    }
  };

  // Toggle Plan between Starter and Pro
  const handleTogglePlan = async (biz: BusinessProfile) => {
    const isCurrentlyPro = biz.plan === 'pro';
    const newPlan = isCurrentlyPro ? 'starter' : 'pro';
    const now = Date.now();
    
    setActionLoading(prev => ({ ...prev, [biz.uid]: true }));
    try {
      const updateData: Partial<BusinessProfile> = {
        plan: newPlan,
        planStatus: 'active'
      };

      if (newPlan === 'pro') {
        updateData.proStartedAt = biz.proStartedAt || now;
      }

      await updateBusinessProfile(biz.uid, updateData);
      
      setSuccessMessage(`Store "${biz.businessName}" is now ${newPlan === 'pro' ? 'PRO (₱499/mo)' : 'STARTER (Free)'}`);
      setTimeout(() => setSuccessMessage(null), 3000);
      
      setBusinesses(prev => prev.map(b => b.uid === biz.uid ? { 
        ...b, 
        plan: newPlan, 
        planStatus: 'active',
        proStartedAt: newPlan === 'pro' ? (b.proStartedAt || now) : b.proStartedAt
      } : b));
    } catch (err: any) {
      console.error("Plan toggle error:", err);
      setError(`Failed to toggle plan: ${err.message}`);
    } finally {
      setActionLoading(prev => ({ ...prev, [biz.uid]: false }));
    }
  };

  // Manual Pro Approval from GCash Reference
  const handleApproveProPayment = async (biz: BusinessProfile) => {
    const now = Date.now();
    setActionLoading(prev => ({ ...prev, [biz.uid]: true }));
    try {
      await updateBusinessProfile(biz.uid, {
        plan: 'pro',
        planStatus: 'active',
        status: 'active',
        proStartedAt: now
      });
      setSuccessMessage(`GCash Payment verified for ${biz.businessName}! Pro activated for 30 days.`);
      setTimeout(() => setSuccessMessage(null), 3500);
      setBusinesses(prev => prev.map(b => b.uid === biz.uid ? { 
        ...b, 
        plan: 'pro', 
        planStatus: 'active', 
        status: 'active',
        proStartedAt: now
      } : b));
    } catch (err: any) {
      console.error("Verification error:", err);
      setError(`Failed to verify payment: ${err.message}`);
    } finally {
      setActionLoading(prev => ({ ...prev, [biz.uid]: false }));
    }
  };

  // Save / Update GCash Reference Manually
  const handleSaveGcashRef = async (activateProDirectly: boolean) => {
    if (!editingRefBiz) return;
    const { uid, businessName, refNumber, amount } = editingRefBiz;
    const now = Date.now();

    setActionLoading(prev => ({ ...prev, [uid]: true }));
    setError(null);
    try {
      const updateData: Partial<BusinessProfile> = {
        paymentReference: refNumber.trim(),
        paymentAmount: amount || 499,
        paymentDate: now
      };

      if (activateProDirectly) {
        updateData.plan = 'pro';
        updateData.planStatus = 'active';
        updateData.status = 'active';
        updateData.proStartedAt = now;
      } else {
        updateData.planStatus = 'pending_payment';
      }

      await updateBusinessProfile(uid, updateData);

      setSuccessMessage(
        activateProDirectly
          ? `GCash Ref #${refNumber.trim()} attached & Pro activated for ${businessName}!`
          : `GCash Ref #${refNumber.trim()} saved for ${businessName}.`
      );
      setTimeout(() => setSuccessMessage(null), 3500);

      setBusinesses(prev => prev.map(b => b.uid === uid ? {
        ...b,
        paymentReference: refNumber.trim(),
        paymentAmount: amount || 499,
        paymentDate: now,
        ...(activateProDirectly ? { plan: 'pro', planStatus: 'active', status: 'active', proStartedAt: now } : { planStatus: 'pending_payment' })
      } : b));

      setEditingRefBiz(null);
    } catch (err: any) {
      console.error("Save Ref error:", err);
      setError(`Failed to save reference: ${err.message}`);
    } finally {
      setActionLoading(prev => ({ ...prev, [uid]: false }));
    }
  };

  // Store status change (active / rejected)
  const handleStatusChange = async (uid: string, status: 'active' | 'rejected') => {
    setActionLoading(prev => ({ ...prev, [uid]: true }));
    setSuccessMessage(null);
    setError(null);
    try {
      await setBusinessStatus(uid, status);
      setSuccessMessage(`Store marked as ${status.toUpperCase()} successfully.`);
      setTimeout(() => setSuccessMessage(null), 3000);
      setBusinesses(prev => prev.map(b => b.uid === uid ? { ...b, status } : b));
    } catch (err: any) {
      console.error("Action Error:", err);
      setError(`Failed to update status: ${err.message}`);
    } finally {
      setActionLoading(prev => ({ ...prev, [uid]: false }));
    }
  };

  // Dispatch password reset email on behalf of client
  const handleSendResetEmailFromAdmin = async (biz: BusinessProfile) => {
    if (!biz.email) {
      setResetModalError("This client does not have a registered email address on file.");
      return;
    }
    setResetEmailSending(true);
    setResetModalError(null);
    try {
      await sendPasswordResetEmail(auth, biz.email);
      setResetEmailSent(true);
      setTimeout(() => setResetEmailSent(false), 5000);
    } catch (err: any) {
      console.error("Admin reset email error:", err);
      setResetModalError(err.message || "Failed to dispatch reset email.");
    } finally {
      setResetEmailSending(false);
    }
  };

  // Copy ready-to-send Messenger reply for client recovery
  const handleCopyMessengerReply = (biz: BusinessProfile) => {
    const loginUrl = `${window.location.origin}/login`;
    const text = `Hi ${biz.businessName || 'there'}! 👋

Here is your ChatCart account information:
🔗 Login Page: ${loginUrl}
📧 Registered Email: ${biz.email || 'Your registered email'}

If you forgot your password, I have dispatched a password reset link to your email, or you can click "Forgot Password?" directly on the login page anytime.

Let me know once you are able to sign in!`;

    navigator.clipboard.writeText(text);
    setCopiedMessenger(true);
    setTimeout(() => setCopiedMessenger(false), 3000);
  };

  // Update Pro Upgrade Date manually
  const handleUpdateUpgradeDate = async (biz: BusinessProfile, newDateStr: string) => {
    if (!newDateStr) return;
    const newTimestamp = new Date(newDateStr).getTime();
    if (isNaN(newTimestamp)) return;

    setActionLoading(prev => ({ ...prev, [biz.uid]: true }));
    try {
      await updateBusinessProfile(biz.uid, {
        proStartedAt: newTimestamp,
        plan: 'pro',
        planStatus: 'active'
      });
      setSuccessMessage(`Updated upgrade date for ${biz.businessName}.`);
      setTimeout(() => setSuccessMessage(null), 2500);
      setBusinesses(prev => prev.map(b => b.uid === biz.uid ? { ...b, proStartedAt: newTimestamp, plan: 'pro', planStatus: 'active' } : b));
    } catch (err: any) {
      setError(`Failed to update date: ${err.message}`);
    } finally {
      setActionLoading(prev => ({ ...prev, [biz.uid]: false }));
    }
  };

  // Renew for +30 Days
  const handleRenewThirtyDays = async (biz: BusinessProfile) => {
    const now = Date.now();
    setActionLoading(prev => ({ ...prev, [biz.uid]: true }));
    try {
      await updateBusinessProfile(biz.uid, {
        proStartedAt: now,
        plan: 'pro',
        planStatus: 'active',
        paymentDate: now
      });
      setSuccessMessage(`Renewed Pro for ${biz.businessName} (+30 Days from today).`);
      setTimeout(() => setSuccessMessage(null), 3000);
      setBusinesses(prev => prev.map(b => b.uid === biz.uid ? { ...b, proStartedAt: now, plan: 'pro', planStatus: 'active', paymentDate: now } : b));
    } catch (err: any) {
      setError(`Failed to renew: ${err.message}`);
    } finally {
      setActionLoading(prev => ({ ...prev, [biz.uid]: false }));
    }
  };

  // Helper to get the store owner's personal Messenger link
  const getStoreMessengerLink = (biz: BusinessProfile, text?: string) => {
    const raw = (biz.messengerPageUsername || '').trim();
    if (!raw) return null;
    const clean = raw
      .replace(/^@/, '')
      .replace(/^https?:\/\/(www\.)?(m\.me|facebook\.com|messenger\.com)\//i, '')
      .replace(/\/$/, '')
      .trim();

    if (!clean) return null;
    return text ? `https://m.me/${clean}?ref=${encodeURIComponent(text)}` : `https://m.me/${clean}`;
  };

  // Open Store Owner's Messenger with pre-filled Monthly Notice
  const handleSendMonthlyNotice = (biz: BusinessProfile) => {
    const billing = getBillingStatus(biz);
    const dueDateStr = billing.dueDate ? new Date(billing.dueDate).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }) : 'today';
    const graceDateStr = billing.gracePeriodEnd ? new Date(billing.gracePeriodEnd).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }) : '5 days';

    const message = `
📢 CHATCART PRO MONTHLY RENEWAL NOTICE
-------------------------------------
Store: ${biz.businessName}
Plan: Pro Business (₱499 / mo)
Due Date: ${dueDateStr}
Grace Period: 5 Days (until ${graceDateStr})

To keep your unlimited dishes and custom branding active, please send your monthly renewal of ₱499 via GCash:
GCash Number: ${PAYMENT_CONFIG.gcashNumber}
Account Name: ${PAYMENT_CONFIG.gcashAccountName}

Reply with your GCash Reference Number here. Thank you!
-------------------------------------
WapDev ChatCart Billing Support
`.trim();

    navigator.clipboard.writeText(message);

    const storeOwnerMessengerUrl = getStoreMessengerLink(biz, message);
    if (storeOwnerMessengerUrl) {
      setSuccessMessage(`Notice copied to clipboard! Opening @${biz.messengerPageUsername}'s Messenger...`);
      setTimeout(() => setSuccessMessage(null), 4000);
      window.open(storeOwnerMessengerUrl, '_blank', 'noopener,noreferrer');
    } else {
      setSuccessMessage(`Notice copied to clipboard! (Note: ${biz.businessName} has not entered their Messenger username yet).`);
      setTimeout(() => setSuccessMessage(null), 5000);
    }
  };

  const confirmDelete = async () => {
    if (!deletingBiz) return;
    const uid = deletingBiz.uid;
    setActionLoading(prev => ({ ...prev, [uid]: true }));
    setError(null);
    setDeletingBiz(null);
    try {
      await deleteBusiness(uid);
      setSuccessMessage("Business registration deleted successfully.");
      setTimeout(() => setSuccessMessage(null), 3000);
      setBusinesses(prev => prev.filter(b => b.uid !== uid));
    } catch (err: any) {
      console.error("Delete Error:", err);
      setError(`Failed to delete business: ${err.message}`);
    } finally {
      setActionLoading(prev => ({ ...prev, [uid]: false }));
    }
  };

  const copyRef = (ref: string) => {
    navigator.clipboard.writeText(ref);
    setCopiedRef(ref);
    setTimeout(() => setCopiedRef(null), 2000);
  };

  // Metrics
  const pendingCount = useMemo(() => businesses.filter(b => b.status === 'pending').length, [businesses]);
  const proCount = useMemo(() => businesses.filter(b => b.plan === 'pro').length, [businesses]);
  const pendingPaymentCount = useMemo(() => businesses.filter(b => b.planStatus === 'pending_payment').length, [businesses]);
  
  const gracePeriodCount = useMemo(() => {
    return businesses.filter(b => b.plan === 'pro' && getBillingStatus(b).type === 'grace_period').length;
  }, [businesses]);

  const overdueCount = useMemo(() => {
    return businesses.filter(b => b.plan === 'pro' && getBillingStatus(b).type === 'overdue').length;
  }, [businesses]);

  const estimatedMRR = proCount * 499;

  const filteredBusinesses = useMemo(() => {
    return businesses.filter(b => {
      const billing = getBillingStatus(b);

      if (statusFilter === 'pending' && b.status !== 'pending') return false;
      if (statusFilter === 'pending_payment' && b.planStatus !== 'pending_payment') return false;
      if (statusFilter === 'pro' && b.plan !== 'pro') return false;
      if (statusFilter === 'starter' && b.plan === 'pro') return false;
      if (statusFilter === 'grace_period' && billing.type !== 'grace_period') return false;
      if (statusFilter === 'overdue' && billing.type !== 'overdue') return false;

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = (b.businessName || '').toLowerCase().includes(query);
        const matchesUid = (b.uid || '').toLowerCase().includes(query);
        const matchesUsername = (b.messengerPageUsername || '').toLowerCase().includes(query);
        const matchesSlug = (b.slug || '').toLowerCase().includes(query);
        const matchesRef = (b.paymentReference || '').toLowerCase().includes(query);
        const matchesEmail = (b.email || '').toLowerCase().includes(query);
        return matchesName || matchesUid || matchesUsername || matchesSlug || matchesRef || matchesEmail;
      }
      return true;
    });
  }, [businesses, statusFilter, searchQuery]);

  return (
    <AdminLayout>
      <div className="space-y-6 md:space-y-8 pb-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-zinc-900 tracking-tight flex items-center gap-2">
              <Shield className="w-7 h-7 text-emerald-500" />
              Platform Overview & Approvals
            </h1>
            <p className="text-zinc-500 text-xs sm:text-sm mt-1">
              Approve merchant signups, attach/review GCash references, toggle Pro access & manage billing.
            </p>
          </div>
          
          <button
            onClick={fetchBusinesses}
            disabled={loading}
            className="self-start sm:self-auto min-h-[44px] bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-700 font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-xs transition-all active:scale-95"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin text-emerald-500")} />
            Refresh Data
          </button>
        </div>

        {/* Pending Signups Alert Banner if pending > 0 */}
        {pendingCount > 0 && (
          <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-orange-600 rounded-2xl p-4 sm:p-5 text-white shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in slide-in-from-top-2 duration-300">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                <AlertCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm sm:text-base">
                  {pendingCount} New Store Registration{pendingCount > 1 ? 's' : ''} Awaiting Sign Up Approval
                </h3>
                <p className="text-xs text-amber-100 mt-0.5">
                  Review and activate these merchants so their public menu and dashboard go live.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setStatusFilter('pending')}
              className="px-4 py-2.5 bg-white text-zinc-900 hover:bg-amber-50 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-xs shrink-0"
            >
              Review Pending ({pendingCount})
            </button>
          </div>
        )}

        {/* Metric Cards (5 Cards) */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
          {/* Total Stores */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-zinc-100 shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-zinc-400">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider">Total Stores</span>
              <Users className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-zinc-900">{businesses.length}</div>
            <p className="text-[10px] sm:text-[11px] text-zinc-400">Registered merchants</p>
          </div>

          {/* Pending Signups Approval */}
          <div className="bg-amber-50/80 p-4 sm:p-5 rounded-2xl border border-amber-200 shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-amber-700">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider">Pending Signups</span>
              <UserCheck className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-amber-900">{pendingCount}</div>
            <p className="text-[10px] sm:text-[11px] text-amber-700 font-medium">Awaiting store approval</p>
          </div>

          {/* GCash Unverified */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-zinc-100 shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-zinc-400">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider">GCash Unverified</span>
              <CreditCard className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-blue-600">{pendingPaymentCount}</div>
            <p className="text-[10px] sm:text-[11px] text-zinc-400">GCash Ref review needed</p>
          </div>

          {/* Pro Stores */}
          <div className="bg-gradient-to-br from-emerald-600 to-teal-700 p-4 sm:p-5 rounded-2xl text-white shadow-md space-y-1">
            <div className="flex items-center justify-between text-emerald-100">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider">Pro Stores</span>
              <Sparkles className="w-4 h-4 text-yellow-300 fill-yellow-300" />
            </div>
            <div className="text-2xl sm:text-3xl font-black">{proCount}</div>
            <p className="text-[10px] sm:text-[11px] text-emerald-100 font-medium">₱{estimatedMRR.toLocaleString()} / mo MRR</p>
          </div>

          {/* Grace / Overdue */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-zinc-100 shadow-2xs space-y-1 col-span-2 lg:col-span-1">
            <div className="flex items-center justify-between text-zinc-400">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider">Grace / Overdue</span>
              <AlertCircle className="w-4 h-4 text-rose-500" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-rose-600">
              {gracePeriodCount + overdueCount}
            </div>
            <p className="text-[10px] sm:text-[11px] text-zinc-400">
              {gracePeriodCount} grace • {overdueCount} overdue
            </p>
          </div>
        </div>

        {/* Add / Edit GCash Reference Modal */}
        {editingRefBiz && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-zinc-950/60 backdrop-blur-xs animate-fade-in">
            <div className="fixed inset-0" onClick={() => setEditingRefBiz(null)} />
            
            <div className="relative z-10 bg-white w-full sm:max-w-md rounded-t-[32px] sm:rounded-[32px] p-6 sm:p-7 shadow-2xl space-y-5 animate-in slide-in-from-bottom sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200">
              <div className="w-12 h-1.5 bg-zinc-300 rounded-full mx-auto sm:hidden shrink-0 mb-1" />
              
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-zinc-900">Manage GCash Reference</h3>
                  <p className="text-xs text-zinc-500">{editingRefBiz.businessName}</p>
                </div>
              </div>

              <div className="space-y-3.5">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-700 mb-1">
                    GCash Reference Number
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 1029 3847 5610"
                    value={editingRefBiz.refNumber}
                    onChange={(e) => setEditingRefBiz({ ...editingRefBiz, refNumber: e.target.value })}
                    className="w-full min-h-[46px] px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-mono font-bold text-zinc-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                  <p className="text-[10px] text-zinc-400 mt-1">
                    Enter the GCash transaction reference sent via Messenger or SMS.
                  </p>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-700 mb-1">
                    Amount (₱)
                  </label>
                  <input
                    type="number"
                    value={editingRefBiz.amount}
                    onChange={(e) => setEditingRefBiz({ ...editingRefBiz, amount: Number(e.target.value) || 499 })}
                    className="w-full min-h-[46px] px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-mono font-bold text-zinc-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  disabled={!editingRefBiz.refNumber.trim() || actionLoading[editingRefBiz.uid]}
                  onClick={() => handleSaveGcashRef(true)}
                  className="w-full min-h-[48px] py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
                >
                  <Sparkles className="w-4 h-4 text-amber-300 fill-amber-300" />
                  Save & Activate Pro (₱499 / 30 Days)
                </button>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingRefBiz(null)}
                    className="flex-1 min-h-[42px] py-2.5 rounded-xl border border-zinc-200 font-bold text-xs text-zinc-600 hover:bg-zinc-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={!editingRefBiz.refNumber.trim() || actionLoading[editingRefBiz.uid]}
                    onClick={() => handleSaveGcashRef(false)}
                    className="flex-1 min-h-[42px] py-2.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 disabled:opacity-50 font-bold text-xs text-zinc-800 transition-colors"
                  >
                    Save Ref Only
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deletingBiz && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-zinc-950/60 backdrop-blur-xs animate-fade-in">
            <div className="fixed inset-0" onClick={() => setDeletingBiz(null)} />
            
            <div className="relative z-10 bg-white w-full sm:max-w-md rounded-t-[32px] sm:rounded-[32px] p-6 sm:p-7 shadow-2xl space-y-4 animate-in slide-in-from-bottom sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200">
              <div className="w-12 h-1.5 bg-zinc-300 rounded-full mx-auto sm:hidden shrink-0 mb-1" />
              
              <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
                <Trash2 className="w-6 h-6" />
              </div>
              <div className="text-center space-y-1">
                <h3 className="text-lg font-bold text-zinc-900">Delete Business Registration?</h3>
                <p className="text-xs sm:text-sm text-zinc-500 leading-relaxed">
                  Are you sure you want to permanently delete <strong className="text-zinc-900">{deletingBiz.businessName}</strong>? This will remove all items and menus.
                </p>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setDeletingBiz(null)}
                  className="flex-1 min-h-[46px] py-3 rounded-xl border border-zinc-200 font-bold text-xs sm:text-sm text-zinc-600 hover:bg-zinc-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmDelete}
                  className="flex-1 min-h-[46px] py-3 rounded-xl bg-red-600 hover:bg-red-700 font-bold text-xs sm:text-sm text-white transition-colors shadow-sm active:scale-[0.98]"
                >
                  Delete Now
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Password Reset & Messenger Recovery Modal */}
        {resetModalBiz && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-zinc-950/60 backdrop-blur-xs animate-fade-in">
            <div className="fixed inset-0" onClick={() => setResetModalBiz(null)} />
            
            <div className="relative z-10 bg-white w-full sm:max-w-lg rounded-t-[32px] sm:rounded-[32px] p-6 sm:p-7 shadow-2xl space-y-5 animate-in slide-in-from-bottom sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200 border border-zinc-100">
              <div className="w-12 h-1.5 bg-zinc-300 rounded-full mx-auto sm:hidden shrink-0 mb-1" />
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                    <KeyRound className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-zinc-900">Password Recovery & Support</h3>
                    <p className="text-xs text-zinc-500">{resetModalBiz.businessName}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setResetModalBiz(null)}
                  className="p-2 text-zinc-400 hover:text-zinc-700 rounded-xl hover:bg-zinc-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Client Info Summary */}
              <div className="p-3.5 bg-zinc-50 rounded-2xl border border-zinc-200 text-xs space-y-1.5 font-medium">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Registered Email:</span>
                  <span className="font-bold text-zinc-900">{resetModalBiz.email || 'No email registered'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Messenger Handle:</span>
                  <span className="font-mono font-bold text-zinc-900">@{resetModalBiz.messengerPageUsername || 'none'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Store URL:</span>
                  <span className="font-mono text-zinc-700">/{resetModalBiz.slug || 'menu'}</span>
                </div>
              </div>

              {/* Option 1: Send Password Reset Link */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-700 flex items-center justify-between">
                  <span>1. Dispatch Reset Email</span>
                  <span className="text-[10px] text-zinc-400 font-normal">Official Firebase Link</span>
                </label>
                <button
                  type="button"
                  disabled={resetEmailSending || !resetModalBiz.email}
                  onClick={() => handleSendResetEmailFromAdmin(resetModalBiz)}
                  className="w-full py-2.5 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                >
                  {resetEmailSending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : resetEmailSent ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <KeyRound className="w-4 h-4 text-amber-400" />
                  )}
                  {resetEmailSent ? `Reset Link Sent to ${resetModalBiz.email}!` : `Send Password Reset Email`}
                </button>
              </div>

              {/* Option 2: Copy Messenger Reply */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-700">
                    2. Messenger Reply (1-Tap Copy)
                  </label>
                  <span className="text-[10px] text-emerald-700 font-semibold">For Facebook Chat</span>
                </div>

                <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-200 text-xs font-mono text-zinc-800 leading-relaxed max-h-24 overflow-y-auto whitespace-pre-wrap select-all">
                  {`Hi ${resetModalBiz.businessName || 'there'}! 👋\n\nHere is your ChatCart login info:\n🔗 Login: ${window.location.origin}/login\n📧 Email: ${resetModalBiz.email || 'your email'}\n\nYou can click "Forgot Password?" directly on the login page anytime!`}
                </div>

                <button
                  type="button"
                  onClick={() => handleCopyMessengerReply(resetModalBiz)}
                  className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.98] cursor-pointer"
                >
                  {copiedMessenger ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4" />}
                  {copiedMessenger ? 'Copied to Clipboard!' : 'Copy Messenger Reply Text'}
                </button>
              </div>

              {/* Manual Firebase Console Note */}
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-900 space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-amber-700" />
                  Manual Console Override:
                </p>
                <p className="text-amber-800 leading-normal">
                  If the client has no email access, open <strong>Firebase Console &gt; Authentication &gt; Users &gt; Change Password</strong> to type any temporary password manually.
                </p>
              </div>

              {resetModalError && (
                <div className="p-3 bg-red-50 text-red-700 text-xs font-bold rounded-xl border border-red-200">
                  {resetModalError}
                </div>
              )}

              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setResetModalBiz(null)}
                  className="w-full py-2.5 rounded-xl border border-zinc-200 font-bold text-xs text-zinc-600 hover:bg-zinc-50 transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}

        {successMessage && (
          <div className="bg-emerald-50 text-emerald-700 p-4 rounded-2xl border border-emerald-100 flex items-center gap-3 animate-in fade-in duration-300">
            <CheckCircle className="w-5 h-5 shrink-0" />
            <p className="font-bold text-sm">{successMessage}</p>
          </div>
        )}

        {error && (
          <div className="p-5 bg-red-50 border border-red-200 rounded-2xl text-red-800 space-y-2">
            <div className="flex items-center gap-2 font-bold text-sm">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              Authorization / Operation Notice
            </div>
            <p className="text-xs leading-relaxed text-red-700">{error}</p>
          </div>
        )}

        {/* Filter and Search Bar */}
        <div className="bg-white p-4 rounded-2xl border border-zinc-100 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            {(['all', 'pending', 'pending_payment', 'grace_period', 'overdue', 'pro', 'starter'] as const).map(tab => {
              const labelMap: Record<string, string> = {
                all: 'All',
                pending: `Pending Signups (${pendingCount})`,
                pending_payment: `GCash Review (${pendingPaymentCount})`,
                grace_period: `Grace Period (${gracePeriodCount})`,
                overdue: `Overdue (${overdueCount})`,
                pro: `Pro (${proCount})`,
                starter: 'Starter'
              };
              return (
                <button
                  key={tab}
                  onClick={() => setStatusFilter(tab)}
                  className={cn(
                    "px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap",
                    statusFilter === tab
                      ? "bg-zinc-900 text-white shadow-xs"
                      : "bg-zinc-50 text-zinc-500 hover:bg-zinc-100",
                    tab === 'pending' && pendingCount > 0 && statusFilter !== 'pending' && "text-amber-700 bg-amber-50 font-black",
                    tab === 'pending_payment' && pendingPaymentCount > 0 && statusFilter !== 'pending_payment' && "text-blue-700 bg-blue-50 font-black"
                  )}
                >
                  {labelMap[tab]}
                </button>
              );
            })}
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Search store, email, GCash ref..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full min-h-[42px] pl-10 pr-4 py-2 bg-zinc-50 border border-zinc-100 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
            />
          </div>
        </div>

        {/* Business List */}
        <div className="bg-white rounded-2xl md:rounded-[32px] border border-zinc-100 shadow-sm overflow-hidden">
          <div className="p-4 sm:p-6 bg-zinc-50 border-b border-zinc-100 flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2.5">
              <Users className="w-5 h-5 text-emerald-600" />
              <h2 className="font-bold text-zinc-900 text-sm md:text-base">
                Store Records ({filteredBusinesses.length})
              </h2>
            </div>
            <div className="text-xs text-zinc-500 flex items-center gap-2">
              <span>Grace Period: <strong className="text-zinc-800 font-bold">5 Days</strong></span>
              <span>•</span>
              <span>GCash: <strong className="font-mono text-zinc-800 font-bold">{PAYMENT_CONFIG.gcashNumber}</strong></span>
            </div>
          </div>
          
          {loading && businesses.length === 0 ? (
            <div className="p-12 flex justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
            </div>
          ) : (
            <div className="divide-y divide-zinc-100">
              {filteredBusinesses.map((biz) => {
                const publicUrl = biz.slug ? `/${biz.slug}` : `/menu/${biz.uid}`;
                const isBizPro = biz.plan === 'pro';
                const isPendingStoreApproval = biz.status === 'pending';
                const hasPendingPayment = biz.planStatus === 'pending_payment';
                const billing = getBillingStatus(biz);
                const isExpanded = expandedBilling[biz.uid] || false;

                const upgradeDateFormatted = biz.proStartedAt 
                  ? new Date(biz.proStartedAt).toISOString().split('T')[0]
                  : new Date().toISOString().split('T')[0];

                const dueDateFormatted = billing.dueDate 
                  ? new Date(billing.dueDate).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })
                  : 'N/A';

                const graceEndFormatted = billing.gracePeriodEnd 
                  ? new Date(billing.gracePeriodEnd).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })
                  : 'N/A';

                return (
                  <div key={biz.uid} className={cn(
                    "p-4 sm:p-6 transition-colors space-y-3.5",
                    isPendingStoreApproval ? "bg-amber-50/30 hover:bg-amber-50/50" : "hover:bg-zinc-50/70"
                  )}>
                    {/* Top Row: Store Details & Interactive Toggle Pill */}
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      
                      {/* Store Info */}
                      <div className="flex-1 min-w-0 space-y-1.5">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <h3 className="font-bold text-zinc-900 text-base sm:text-lg">{biz.businessName || 'Unnamed Business'}</h3>
                          
                          {/* Store Approval Status */}
                          <span className={cn(
                            "text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border",
                            biz.status === 'active' ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                            biz.status === 'pending' ? "bg-amber-100 text-amber-800 border-amber-300 font-black animate-pulse" :
                            "bg-red-50 text-red-700 border-red-200"
                          )}>
                            {biz.status === 'pending' ? 'Pending Approval' : biz.status}
                          </span>

                          {/* Billing Status Badge */}
                          {isBizPro && (
                            <span className={cn(
                              "text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border flex items-center gap-1",
                              billing.type === 'active' && "bg-emerald-50 text-emerald-800 border-emerald-300",
                              billing.type === 'grace_period' && "bg-amber-100 text-amber-900 border-amber-300 animate-pulse",
                              billing.type === 'overdue' && "bg-red-100 text-red-800 border-red-300"
                            )}>
                              <CalendarCheck className="w-3 h-3 shrink-0" />
                              {billing.label}
                            </span>
                          )}

                          {biz.slug && (
                            <span className="text-[10px] font-mono bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded-md">
                              /{biz.slug}
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-500">
                          {biz.email && <p>Owner Email: <span className="font-medium text-zinc-800">{biz.email}</span></p>}
                          <p>Messenger: <span className="font-mono text-zinc-800 font-medium">@{biz.messengerPageUsername || 'not set'}</span></p>
                          <p className="text-[11px] text-zinc-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Joined {biz.createdAt ? new Date(biz.createdAt).toLocaleDateString() : 'Recent'}
                          </p>
                          <p className="font-mono text-zinc-400 text-[10px]">UID: {biz.uid.slice(0, 8)}...</p>
                        </div>
                      </div>

                      {/* Right Action Controls: Approval buttons, Toggle Pill & Quick Actions */}
                      <div className="flex flex-wrap items-center gap-2.5 pt-2 lg:pt-0">
                        
                        {/* Pending Sign Up Action Buttons */}
                        {isPendingStoreApproval && (
                          <div className="flex items-center gap-2 bg-amber-100/70 p-1.5 rounded-2xl border border-amber-300">
                            <button
                              type="button"
                              disabled={actionLoading[biz.uid]}
                              onClick={() => handleStatusChange(biz.uid, 'active')}
                              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-xs transition-all flex items-center gap-1.5 active:scale-95"
                            >
                              <UserCheck className="w-3.5 h-3.5" />
                              Approve Store
                            </button>
                            <button
                              type="button"
                              disabled={actionLoading[biz.uid]}
                              onClick={() => handleStatusChange(biz.uid, 'rejected')}
                              className="px-2.5 py-1.5 bg-zinc-200 hover:bg-red-100 hover:text-red-700 text-zinc-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1"
                            >
                              <UserX className="w-3.5 h-3.5" />
                              Reject
                            </button>
                          </div>
                        )}

                        {biz.status === 'rejected' && (
                          <button
                            type="button"
                            disabled={actionLoading[biz.uid]}
                            onClick={() => handleStatusChange(biz.uid, 'active')}
                            className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-900 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1"
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                            Re-Activate
                          </button>
                        )}

                        {/* Interactive Pro / Starter Toggle Switch Pill */}
                        <div className="flex items-center bg-zinc-100 p-1 rounded-2xl border border-zinc-200 shadow-2xs">
                          <button
                            type="button"
                            disabled={actionLoading[biz.uid]}
                            onClick={() => { if (isBizPro) handleTogglePlan(biz); }}
                            className={cn(
                              "px-3 py-1.5 rounded-xl text-xs font-bold transition-all",
                              !isBizPro 
                                ? "bg-white text-zinc-900 shadow-xs" 
                                : "text-zinc-500 hover:text-zinc-900"
                            )}
                          >
                            Starter (Free)
                          </button>
                          <button
                            type="button"
                            disabled={actionLoading[biz.uid]}
                            onClick={() => { if (!isBizPro) handleTogglePlan(biz); }}
                            className={cn(
                              "px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1",
                              isBizPro 
                                ? "bg-amber-500 text-white shadow-xs font-black" 
                                : "text-zinc-500 hover:text-zinc-900"
                            )}
                          >
                            <Sparkles className="w-3 h-3" />
                            PRO (₱499)
                          </button>
                        </div>

                        {/* Expand / Collapse Billing Record Area */}
                        <button
                          type="button"
                          onClick={() => setExpandedBilling(prev => ({ ...prev, [biz.uid]: !prev[biz.uid] }))}
                          className={cn(
                            "px-3 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 min-h-[38px]",
                            isExpanded ? "bg-zinc-900 text-white border-zinc-900" : "bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50"
                          )}
                        >
                          <Calendar className="w-3.5 h-3.5" />
                          {isExpanded ? 'Hide Record' : 'Billing Record'}
                          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>

                        {/* Preview Store link */}
                        <Link
                          to={publicUrl}
                          target="_blank"
                          className="p-2 text-zinc-400 hover:text-emerald-600 hover:bg-zinc-100 rounded-xl transition-colors min-h-[38px] min-w-[38px] flex items-center justify-center"
                          title="Preview Public Menu"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Link>

                        {/* Password & Messenger Recovery */}
                        <button
                          onClick={() => {
                            setResetModalBiz(biz);
                            setResetModalError(null);
                            setResetEmailSent(false);
                          }}
                          className="p-2 text-zinc-400 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-colors min-h-[38px] min-w-[38px] flex items-center justify-center border border-transparent hover:border-amber-200"
                          title="Password Reset & Messenger Support"
                        >
                          <KeyRound className="w-4 h-4" />
                        </button>

                        {/* Delete registration */}
                        <button
                          onClick={() => setDeletingBiz(biz)}
                          className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors min-h-[38px] min-w-[38px] flex items-center justify-center"
                          title="Delete Registration"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* GCash Verification Box */}
                    {biz.paymentReference ? (
                      <div className={cn(
                        "p-3.5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs",
                        hasPendingPayment 
                          ? "bg-blue-50/90 border-blue-200 text-blue-900" 
                          : "bg-emerald-50/60 border-emerald-200 text-emerald-900"
                      )}>
                        <div className="flex items-center gap-2 flex-wrap">
                          <CreditCard className="w-4 h-4 text-blue-600 shrink-0" />
                          <span>GCash Ref: <strong className="font-mono text-sm font-bold">#{biz.paymentReference}</strong> (₱{biz.paymentAmount || 499})</span>
                          <button
                            type="button"
                            onClick={() => copyRef(biz.paymentReference!)}
                            className="p-1 text-zinc-400 hover:text-zinc-800"
                            title="Copy Ref"
                          >
                            {copiedRef === biz.paymentReference ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>

                          {/* Edit Ref Button */}
                          <button
                            type="button"
                            onClick={() => setEditingRefBiz({
                              uid: biz.uid,
                              businessName: biz.businessName,
                              refNumber: biz.paymentReference || '',
                              amount: biz.paymentAmount || 499
                            })}
                            className="text-[10px] font-bold text-zinc-500 hover:text-zinc-900 underline flex items-center gap-1 ml-1"
                          >
                            <Edit3 className="w-3 h-3" /> Edit Ref
                          </button>
                        </div>

                        {hasPendingPayment && (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleApproveProPayment(biz)}
                              disabled={actionLoading[biz.uid]}
                              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-xs transition-all active:scale-95"
                            >
                              Approve & Activate Pro (₱499)
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="p-3 bg-zinc-50 border border-dashed border-zinc-200 rounded-2xl flex items-center justify-between gap-3 text-xs text-zinc-500">
                        <div className="flex items-center gap-2">
                          <CreditCard className="w-3.5 h-3.5 text-zinc-400" />
                          <span>No GCash reference attached yet.</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setEditingRefBiz({
                            uid: biz.uid,
                            businessName: biz.businessName,
                            refNumber: '',
                            amount: 499
                          })}
                          className="px-3 py-1.5 bg-white border border-zinc-200 hover:bg-zinc-100 text-zinc-700 font-bold rounded-xl text-xs transition-all flex items-center gap-1 shadow-2xs"
                        >
                          <Plus className="w-3.5 h-3.5 text-emerald-600" />
                          Add GCash Ref #
                        </button>
                      </div>
                    )}

                    {/* Expanded Interactive Record Area (Subscription dates, 5-day grace period, renewal actions) */}
                    {isExpanded && (
                      <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-4 space-y-4 animate-in fade-in duration-150">
                        <div className="flex items-center justify-between border-b border-zinc-200 pb-2.5">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-700 flex items-center gap-1.5">
                            <Calendar className="w-4 h-4 text-emerald-600" />
                            Subscription & Payment Records
                          </h4>
                          <span className="text-[11px] text-zinc-400">Monthly Cycle: 30 Days + 5 Days Grace</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          {/* Upgrade / Start Date input */}
                          <div className="bg-white p-3 rounded-xl border border-zinc-200 space-y-1">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
                              Upgrade / Renewal Date
                            </label>
                            <input
                              type="date"
                              defaultValue={upgradeDateFormatted}
                              onChange={(e) => handleUpdateUpgradeDate(biz, e.target.value)}
                              className="w-full text-xs font-mono font-bold bg-zinc-50 border border-zinc-200 rounded-lg px-2.5 py-1.5 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                            />
                          </div>

                          {/* Next Due Date */}
                          <div className="bg-white p-3 rounded-xl border border-zinc-200 space-y-1">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
                              Next Due Date (30 Days)
                            </label>
                            <div className="text-xs font-mono font-bold text-zinc-900 py-1.5">
                              {dueDateFormatted}
                            </div>
                          </div>

                          {/* Grace Period End */}
                          <div className="bg-white p-3 rounded-xl border border-zinc-200 space-y-1">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
                              5-Day Grace Period Ends
                            </label>
                            <div className={cn(
                              "text-xs font-mono font-bold py-1.5",
                              billing.type === 'grace_period' ? "text-amber-600 font-black" :
                              billing.type === 'overdue' ? "text-red-600 font-black" : "text-zinc-700"
                            )}>
                              {graceEndFormatted}
                            </div>
                          </div>
                        </div>

                        {/* Quick Interactive Actions */}
                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          <button
                            type="button"
                            disabled={actionLoading[biz.uid]}
                            onClick={() => handleRenewThirtyDays(biz)}
                            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs active:scale-95"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Renew for +30 Days
                          </button>

                          <button
                            type="button"
                            onClick={() => handleSendMonthlyNotice(biz)}
                            className="px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs active:scale-95"
                          >
                            <Bell className="w-3.5 h-3.5 text-yellow-400" />
                            Send Monthly Renewal Notice on Messenger
                          </button>

                          {getStoreMessengerLink(biz) ? (
                            <a
                              href={getStoreMessengerLink(biz)!}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3.5 py-2 rounded-xl bg-white border border-zinc-200 hover:bg-zinc-100 text-zinc-700 text-xs font-bold transition-colors flex items-center gap-1.5"
                            >
                              <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
                              Chat with @{biz.messengerPageUsername}
                            </a>
                          ) : (
                            <button
                              type="button"
                              onClick={() => alert(`Store "${biz.businessName}" has not entered their Facebook/Messenger username yet.`)}
                              className="px-3.5 py-2 rounded-xl bg-zinc-100 text-zinc-400 text-xs font-bold flex items-center gap-1.5 cursor-not-allowed"
                            >
                              <MessageSquare className="w-3.5 h-3.5 text-zinc-400" />
                              No Messenger Handle
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {filteredBusinesses.length === 0 && !loading && (
                <div className="p-12 text-center text-zinc-400 text-sm">
                  {searchQuery ? `No businesses matching "${searchQuery}"` : "No stores found in this filter."}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
