import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getBusinessProfile, updateBusinessProfile, generateUniqueSlug } from '../firebase/firestore';
import AdminLayout from '../components/AdminLayout';
import { BusinessProfile } from '../types';
import { Store, MessageCircle, Save, Loader2, ExternalLink, Clock, XCircle, Download, QrCode, Info, CheckCircle2, Circle, ArrowRight, Sparkles, Image as ImageIcon, Plus, Copy, Check, Globe, Shield, CreditCard } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { QRCodeCanvas } from 'qrcode.react';
import { getCategories, getMenuItems } from '../firebase/firestore';
import { uploadLogo } from '../firebase/storage';
import { Category, MenuItem, cn } from '../types';
import { ProUpgradeModal } from '../components/ProUpgradeModal';
import { PRICING_CONFIG, PAYMENT_CONFIG } from '../lib/constants';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { slug: urlSlug } = useParams();
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [customSlug, setCustomSlug] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [upgradeReason, setUpgradeReason] = useState('');

  const isSuperAdmin = user?.email === 'axceljohnpatriarca@gmail.com';
  const isPro = profile?.plan === 'pro' || isSuperAdmin;

  const menuUrl = profile?.slug 
    ? `${window.location.origin}/${profile.slug}`
    : `${window.location.origin}/menu/${user?.uid}`;

  const copyMenuUrl = () => {
    try {
      navigator.clipboard.writeText(menuUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch (e) {
      console.warn("Failed to copy", e);
    }
  };

  const downloadQRCode = () => {
    const canvas = document.getElementById('menu-qr-code') as HTMLCanvasElement;
    if (canvas) {
      const url = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `${profile?.slug || profile?.businessName || 'chatcart-menu'}-qr-code.png`;
      link.href = url;
      link.click();
    }
  };

  useEffect(() => {
    if (user) {
      const fetchData = async () => {
        const [prof, cats, its] = await Promise.all([
          getBusinessProfile(user.uid),
          getCategories(user.uid),
          getMenuItems(user.uid)
        ]);
        
        if (prof) {
          // If super admin and status is pending, auto-activate profile for convenience
          if (isSuperAdmin && prof.status === 'pending') {
            prof.status = 'active';
            await updateBusinessProfile(user.uid, { ...prof, status: 'active' });
          }

          setProfile(prof);
          setCustomSlug(prof.slug || '');
          
          // Generate slug if missing but business name exists
          if (!prof.slug && prof.businessName) {
            const newSlug = await generateUniqueSlug(prof.businessName, user.uid);
            const updated = await updateBusinessProfile(user.uid, { ...prof, slug: newSlug });
            setProfile(prev => prev ? { ...prev, ...updated } : null);
            setCustomSlug(newSlug);
            
            if (!urlSlug && !isSuperAdmin) {
              navigate(`/${newSlug}/dashboard`, { replace: true });
            }
          } else if (prof.slug && !urlSlug && !isSuperAdmin) {
            navigate(`/${prof.slug}/dashboard`, { replace: true });
          }
        } else {
          // Initialize a clean default profile
          const initialProfile: BusinessProfile = { 
            uid: user.uid, 
            businessName: user.displayName || (isSuperAdmin ? 'ChatCart HQ' : 'My Restaurant'), 
            slug: '', 
            messengerPageUsername: '', 
            status: isSuperAdmin ? 'active' : 'pending', 
            createdAt: Date.now() 
          };
          setProfile(initialProfile);
          await updateBusinessProfile(user.uid, initialProfile);
        }
        
        setCategories(cats);
        setItems(its);
        setLoading(false);
      };

      fetchData();
    }
  }, [user, urlSlug, isSuperAdmin]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile) return;
    setSaving(true);
    setMessage('');
    setErrorMessage('');

    try {
      // Clean messenger username
      const sanitizedUsername = (profile.messengerPageUsername || '').replace(/^@/, '').trim();
      
      // Clean custom slug
      let cleanSlug = customSlug.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
      if (cleanSlug && cleanSlug !== profile.slug) {
        cleanSlug = await generateUniqueSlug(cleanSlug, user.uid);
      } else if (!cleanSlug && profile.businessName) {
        cleanSlug = await generateUniqueSlug(profile.businessName, user.uid);
      }

      const payload = {
        ...profile,
        slug: cleanSlug,
        messengerPageUsername: sanitizedUsername
      };

      const updatedData = await updateBusinessProfile(user.uid, payload);
      setProfile(prev => prev ? { ...prev, ...updatedData } : null);
      setCustomSlug(updatedData.slug || '');
      setMessage('Business profile updated successfully!');
      setTimeout(() => setMessage(''), 3500);
      
      if (updatedData.slug && !urlSlug && !isSuperAdmin) {
        navigate(`/${updatedData.slug}/dashboard`, { replace: true });
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user || !e.target.files?.[0] || !profile) return;
    
    // Spotify-style discovery lock on logo upload
    if (!isPro) {
      setUpgradeReason("Custom Restaurant Logo & Branding is a Pro feature. Upgrade to Pro Business to display your official logo on menus and QR codes!");
      setIsUpgradeModalOpen(true);
      return;
    }

    setUploading(true);
    setMessage('');
    setErrorMessage('');
    try {
      const url = await uploadLogo(user.uid, e.target.files[0]);
      const updatedData = await updateBusinessProfile(user.uid, { ...profile, logoUrl: url });
      setProfile(prev => prev ? { ...prev, ...updatedData } : null);
      setMessage('Store logo updated successfully!');
      setTimeout(() => setMessage(''), 3500);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Failed to upload logo.');
    } finally {
      setUploading(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
    </div>
  );

  if (profile?.status === 'pending' && !isSuperAdmin) return (
    <AdminLayout>
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 bg-white rounded-[32px] border border-zinc-100 shadow-sm mt-4">
        <div className="bg-amber-100 p-6 rounded-full mb-6">
          <Clock className="w-12 h-12 text-amber-600" />
        </div>
        <h1 className="text-2xl font-bold text-zinc-900">Account Pending Approval</h1>
        <p className="text-zinc-500 mt-2 max-w-md leading-relaxed">
          Your registration for <span className="font-bold text-zinc-900">{profile.businessName}</span> is currently under review by our team. Once approved, your digital menu and QR code will go live immediately!
        </p>
      </div>
    </AdminLayout>
  );

  if (profile?.status === 'rejected' && !isSuperAdmin) return (
    <AdminLayout>
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 bg-white rounded-[32px] border border-zinc-100 shadow-sm mt-4">
        <div className="bg-red-100 p-6 rounded-full mb-6">
          <XCircle className="w-12 h-12 text-red-600" />
        </div>
        <h1 className="text-2xl font-bold text-zinc-900">Account Not Approved</h1>
        <p className="text-zinc-500 mt-2 max-w-md leading-relaxed">
          Unfortunately, your registration for <span className="font-bold text-zinc-900">{profile.businessName}</span> was not approved at this time. Please reach out to support if you believe this is a mistake.
        </p>
      </div>
    </AdminLayout>
  );

  const setupSteps = [
    {
      id: 'profile',
      title: 'Business Profile',
      description: 'Set your business name and Messenger username.',
      isComplete: !!(profile?.businessName && profile?.messengerPageUsername),
      action: () => document.getElementById('business-profile-form')?.scrollIntoView({ behavior: 'smooth' })
    },
    {
      id: 'categories',
      title: 'Menu Categories',
      description: 'Create categories like "Drinks" or "Main Course".',
      isComplete: categories.length > 0,
      action: () => navigate(profile?.slug ? `/${profile.slug}/editor` : '/editor')
    },
    {
      id: 'items',
      title: 'Menu Items',
      description: 'Add your delicious food and drinks to the menu.',
      isComplete: items.length > 0,
      action: () => navigate(profile?.slug ? `/${profile.slug}/editor` : '/editor')
    }
  ];

  const completedSteps = setupSteps.filter(s => s.isComplete).length;
  const progress = Math.round((completedSteps / setupSteps.length) * 100);
  const isSetupComplete = progress === 100;

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Super Admin Top Banner */}
        {isSuperAdmin && (
          <div className="bg-zinc-900 text-white p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 border border-zinc-800">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-emerald-400 shrink-0" />
              <p className="text-sm font-medium">
                You are logged in as <span className="text-emerald-400 font-bold">Super Admin</span>. You can manage global businesses or configure your own demo menu.
              </p>
            </div>
            <Link
              to="/superadmin/dashboard"
              className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors shrink-0"
            >
              Go to Platform Overview
            </Link>
          </div>
        )}

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-zinc-900 tracking-tight flex items-center gap-3">
                Welcome, {profile?.businessName || 'Partner'}!
                {!isSetupComplete && <Sparkles className="w-6 h-6 text-amber-500 animate-pulse" />}
              </h1>
              {isPro ? (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold rounded-full">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  Pro Business
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setUpgradeReason("Upgrade to ChatCart Pro for unlimited items, custom logo branding, and priority support!");
                    setIsUpgradeModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-zinc-900 text-white text-xs font-bold rounded-full hover:bg-zinc-800 transition-all shadow-xs"
                >
                  <span>Free Starter (15 items)</span>
                  <span className="text-emerald-400 text-[10px] uppercase font-black tracking-wider">Upgrade ⭐</span>
                </button>
              )}
            </div>
            <p className="text-zinc-500 mt-1">
              {isSetupComplete 
                ? "Your digital menu is live and ready for customers." 
                : "Let's get your digital menu ready for your customers."}
            </p>
          </div>
          {isSetupComplete && (
            <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-full text-sm font-bold border border-emerald-100 self-start md:self-auto">
              <CheckCircle2 className="w-4 h-4" />
              Store is Live
            </div>
          )}
        </div>

        {!isSetupComplete && (
          <div className="bg-zinc-900 rounded-[32px] p-8 text-white overflow-hidden relative shadow-lg border-2 border-zinc-900">
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold mb-1">Setup Guide</h2>
                  <p className="text-zinc-400 text-sm">Complete these 3 quick steps to launch your menu</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-emerald-400">{progress}%</div>
                  <div className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Complete</div>
                </div>
              </div>

              <div className="w-full bg-zinc-800 h-2 rounded-full mb-8 overflow-hidden">
                <div 
                  className="bg-emerald-500 h-full transition-all duration-1000 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {setupSteps.map((step) => (
                  <button
                    key={step.id}
                    onClick={step.action}
                    className={`p-5 rounded-2xl text-left transition-all border-2 ${
                      step.isComplete 
                        ? 'bg-zinc-800/60 border-zinc-700 opacity-80' 
                        : 'bg-zinc-800 border-zinc-600 hover:border-emerald-400 group shadow-xs'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      {step.isComplete ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      ) : (
                        <Circle className="w-5 h-5 text-zinc-500 group-hover:text-emerald-400 transition-colors" />
                      )}
                      {!step.isComplete && <ArrowRight className="w-4 h-4 text-zinc-500 group-hover:translate-x-1 transition-all" />}
                    </div>
                    <h3 className={`font-bold text-sm mb-1 ${step.isComplete ? 'text-zinc-300' : 'text-white'}`}>
                      {step.title}
                    </h3>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      {step.description}
                    </p>
                  </button>
                ))}
              </div>
            </div>
            
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-[100px] -mr-32 -mt-32" />
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Profile Form */}
          <div id="business-profile-form" className="bg-white p-8 rounded-[32px] border-2 border-zinc-900 shadow-[4px_4px_0px_0px_rgba(24,24,27,1)]">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-zinc-900">
              <Store className="w-5 h-5 text-emerald-600" />
              Business Profile
            </h2>
            <form onSubmit={handleSave} className="space-y-5">
              <div className="flex justify-center mb-6">
                <div className="flex flex-col items-center">
                  <div className="relative w-24 h-24 rounded-3xl bg-zinc-50 border-2 border-dashed border-zinc-900 overflow-hidden group shadow-inner">
                    {!isPro && (
                      <div className="absolute top-1.5 right-1.5 z-10 bg-amber-500 text-white text-[8px] font-black uppercase px-1.5 py-0.5 rounded border border-amber-700">
                        PRO
                      </div>
                    )}
                    {profile?.logoUrl ? (
                      <img src={profile.logoUrl} alt="Store Logo" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-zinc-400">
                        <ImageIcon className="w-6 h-6 mb-1" />
                        <span className="text-[8px] font-bold uppercase tracking-widest">Logo</span>
                      </div>
                    )}
                    <label className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity">
                      <input 
                        type="file" 
                        className="hidden" 
                        accept="image/*"
                        disabled={uploading}
                        onChange={handleLogoUpload}
                      />
                      {uploading ? (
                        <Loader2 className="w-5 h-5 text-white animate-spin" />
                      ) : (
                        <Plus className="w-5 h-5 text-white" />
                      )}
                    </label>
                  </div>
                  {profile?.logoUrl && (
                    <button
                      type="button"
                      onClick={() => setProfile({ ...profile, logoUrl: '' })}
                      className="mt-1.5 text-[10px] font-bold text-red-600 uppercase hover:underline"
                    >
                      Remove Logo
                    </button>
                  )}
                  {isPro && (
                    <div className="w-full max-w-xs mt-2">
                      <input
                        type="url"
                        placeholder="Or paste Logo URL (https://...)"
                        value={profile?.logoUrl?.startsWith('data:') ? '' : (profile?.logoUrl || '')}
                        onChange={(e) => setProfile({ ...profile!, logoUrl: e.target.value.trim() })}
                        className="w-full text-[11px] px-3 py-1.5 bg-zinc-50 border-2 border-zinc-900 rounded-lg text-zinc-900 focus:bg-white focus:ring-1 focus:ring-emerald-500 focus:outline-hidden text-center font-medium"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-bold text-zinc-800">Business Name</label>
                <input
                  type="text"
                  required
                  value={profile?.businessName || ''}
                  onChange={(e) => setProfile({ ...profile!, businessName: e.target.value })}
                  className="w-full px-4 py-3 bg-zinc-50 border-2 border-zinc-900 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all text-sm font-semibold text-zinc-900"
                  placeholder="e.g. ChatCart Bistro"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-bold text-zinc-800 flex items-center justify-between">
                  <span>Custom URL Handle</span>
                  <span className="text-[10px] text-zinc-500 font-semibold">e.g. your-shop</span>
                </label>
                <div className="relative">
                  <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    type="text"
                    value={customSlug}
                    onChange={(e) => setCustomSlug(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-zinc-50 border-2 border-zinc-900 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all text-sm font-mono font-semibold text-zinc-900"
                    placeholder="my-bistro"
                  />
                </div>
                <p className="text-[10px] text-zinc-500 px-1 font-medium">
                  Public URL: <span className="font-mono text-zinc-800 font-bold">{window.location.origin}/{customSlug || profile?.slug || 'your-shop'}</span>
                </p>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-bold text-zinc-800">Messenger Page Username</label>
                  <a 
                    href="https://www.facebook.com/help/1047811435279151" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-[10px] font-bold text-emerald-700 hover:underline flex items-center gap-1"
                  >
                    <Info className="w-3 h-3" />
                    How to find?
                  </a>
                </div>
                <div className="relative">
                  <MessageCircle className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    type="text"
                    required
                    value={profile?.messengerPageUsername || ''}
                    onChange={(e) => setProfile({ ...profile!, messengerPageUsername: e.target.value.replace(/^@/, '').trim() })}
                    className="w-full pl-11 pr-4 py-3 bg-zinc-50 border-2 border-zinc-900 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all text-sm font-semibold text-zinc-900"
                    placeholder="ChatCartDemo"
                  />
                </div>
                <p className="text-[10px] text-zinc-500 px-1 leading-relaxed font-medium">
                  Enter your Page username without '@'. Customers' orders will direct to <span className="font-mono text-zinc-900 font-bold">m.me/{profile?.messengerPageUsername || 'username'}</span>
                </p>
              </div>

              {message && (
                <div className="p-3 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-xl border-2 border-emerald-600 flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-700" />
                  {message}
                </div>
              )}

              {errorMessage && (
                <div className="p-3 bg-red-50 text-red-800 text-xs font-bold rounded-xl border-2 border-red-600">
                  {errorMessage}
                </div>
              )}

              <button
                type="submit"
                disabled={saving}
                className="w-full bg-zinc-900 text-white py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-zinc-800 active:translate-x-[1px] active:translate-y-[1px] transition-all disabled:opacity-50 border-2 border-zinc-950 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] cursor-pointer"
              >
                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                Save Profile Changes
              </button>
            </form>
          </div>

          {/* Quick Links & QR Code */}
          <div className="space-y-6">
            <div className="bg-white p-8 rounded-[32px] border-2 border-zinc-900 shadow-[4px_4px_0px_0px_rgba(24,24,27,1)]">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold flex items-center gap-2 text-zinc-900">
                  <QrCode className="w-5 h-5 text-emerald-600" />
                  Public Menu & QR Code
                </h2>
                <Link
                  to={profile?.slug ? `/${profile.slug}` : `/menu/${user?.uid}`}
                  target="_blank"
                  className="p-2 text-zinc-700 hover:text-emerald-700 hover:bg-zinc-100 rounded-xl transition-all border border-zinc-200 hover:border-zinc-900"
                  title="Open Public Menu in new tab"
                >
                  <ExternalLink className="w-5 h-5" />
                </Link>
              </div>
              
              <p className="text-sm text-zinc-600 mb-6 leading-relaxed font-medium">
                Customers can scan this QR code at their table or visit your dedicated web link to place orders.
              </p>

              <div className="flex flex-col items-center gap-6">
                <div className="p-5 bg-white rounded-3xl border-2 border-zinc-900 shadow-[3px_3px_0px_0px_rgba(24,24,27,1)]">
                  <QRCodeCanvas
                    id="menu-qr-code"
                    value={menuUrl}
                    size={220}
                    level="H"
                    includeMargin={true}
                    imageSettings={{
                      src: profile?.logoUrl || '/brand-mark.png',
                      height: 38,
                      width: 38,
                      excavate: true,
                    }}
                  />
                </div>

                <div className="w-full space-y-3">
                  <div className="p-3.5 bg-zinc-50 rounded-2xl border-2 border-zinc-900 break-all font-mono text-xs text-zinc-900 font-bold text-center select-all">
                    {menuUrl}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={copyMenuUrl}
                      className={cn(
                        "py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 border-2 border-zinc-900 shadow-[2px_2px_0px_0px_rgba(24,24,27,1)] active:translate-x-[1px] active:translate-y-[1px] transition-all",
                        copiedLink 
                          ? "bg-emerald-100 text-emerald-950" 
                          : "bg-white text-zinc-900 hover:bg-zinc-100"
                      )}
                    >
                      {copiedLink ? <Check className="w-4 h-4 text-emerald-700" /> : <Copy className="w-4 h-4" />}
                      {copiedLink ? 'Copied!' : 'Copy Link'}
                    </button>

                    <button
                      onClick={downloadQRCode}
                      className="py-3 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 border-2 border-zinc-950 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] transition-all"
                    >
                      <Download className="w-4 h-4" />
                      Download QR
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-emerald-50 p-6 rounded-[32px] border-2 border-zinc-900 shadow-[3px_3px_0px_0px_rgba(24,24,27,1)]">
              <h3 className="font-bold text-emerald-950 flex items-center gap-2 mb-2">
                <MessageCircle className="w-4 h-4 text-emerald-700" />
                Messenger Ordering Tip
              </h3>
              <p className="text-xs text-emerald-900 leading-relaxed font-medium">
                When customers build their cart and click "Order via Messenger", ChatCart encodes their exact order summary and opens your Facebook Page chat directly.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Pro Upgrade Modal */}
      <ProUpgradeModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        profile={profile}
        featureReason={upgradeReason}
        onSuccess={() => {
          if (profile) setProfile({ ...profile, plan: 'pro', planStatus: 'pending_payment' });
        }}
      />
    </AdminLayout>
  );
}
