import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { setBusinessStatus, deleteBusiness } from '../firebase/firestore';
import AdminLayout from '../components/AdminLayout';
import { BusinessProfile } from '../types';
import { Users, ExternalLink, Loader2, CheckCircle, XCircle, Trash2, Clock, Search, Shield, RefreshCw, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';

export default function SuperAdmin() {
  const { user } = useAuth();
  const [businesses, setBusinesses] = useState<BusinessProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [deletingBiz, setDeletingBiz] = useState<BusinessProfile | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'active' | 'rejected'>('all');

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
          status: data.status || 'active',
          createdAt: data.createdAt || 0,
          businessName: data.businessName || 'Unnamed Business',
          messengerPageUsername: data.messengerPageUsername || '',
          slug: data.slug || ''
        };
      });
      
      // Sort in memory: Pending first, then newest
      list.sort((a, b) => {
        if (a.status === 'pending' && b.status !== 'pending') return -1;
        if (a.status !== 'pending' && b.status === 'pending') return 1;
        return (b.createdAt || 0) - (a.createdAt || 0);
      });
      
      setBusinesses(list);
    } catch (err: any) {
      console.error("Error fetching businesses:", err);
      setError(err.message || "Failed to fetch registrations. Please ensure your Firestore rules grant read access to Super Admin.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBusinesses();
  }, [user]);

  const handleStatusChange = async (uid: string, status: 'active' | 'rejected') => {
    setActionLoading(prev => ({ ...prev, [uid]: true }));
    setSuccessMessage(null);
    setError(null);
    try {
      await setBusinessStatus(uid, status);
      setSuccessMessage(`Business marked as ${status.toUpperCase()} successfully.`);
      setTimeout(() => setSuccessMessage(null), 3000);
      // Optimistic update in state
      setBusinesses(prev => prev.map(b => b.uid === uid ? { ...b, status } : b));
    } catch (err: any) {
      console.error("Action Error:", err);
      const isPermissionError = err.message?.toLowerCase().includes('permission') || err.code === 'permission-denied';
      setError(
        isPermissionError 
          ? `Permission Denied: Firebase Security Rules blocked this action. Please make sure the Firestore Security Rules allow writes for axceljohnpatriarca@gmail.com.`
          : `Failed to update status: ${err.message}`
      );
      await fetchBusinesses();
    } finally {
      setActionLoading(prev => ({ ...prev, [uid]: false }));
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
      await fetchBusinesses();
    } finally {
      setActionLoading(prev => ({ ...prev, [uid]: false }));
    }
  };

  const pendingCount = useMemo(() => businesses.filter(b => b.status === 'pending').length, [businesses]);
  const activeCount = useMemo(() => businesses.filter(b => b.status === 'active').length, [businesses]);
  const rejectedCount = useMemo(() => businesses.filter(b => b.status === 'rejected').length, [businesses]);

  const filteredBusinesses = useMemo(() => {
    return businesses.filter(b => {
      if (statusFilter !== 'all' && b.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = (b.businessName || '').toLowerCase().includes(query);
        const matchesUid = (b.uid || '').toLowerCase().includes(query);
        const matchesUsername = (b.messengerPageUsername || '').toLowerCase().includes(query);
        const matchesSlug = (b.slug || '').toLowerCase().includes(query);
        return matchesName || matchesUid || matchesUsername || matchesSlug;
      }
      return true;
    });
  }, [businesses, statusFilter, searchQuery]);

  return (
    <AdminLayout>
      <div className="space-y-6 md:space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-zinc-900 tracking-tight flex items-center gap-2">
              <Shield className="w-7 h-7 text-emerald-500" />
              Platform Overview
            </h1>
            <p className="text-zinc-500 text-sm mt-1">
              Super Admin master controls for all business registrations & menus
            </p>
          </div>
          
          <button 
            onClick={fetchBusinesses}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-700 rounded-xl text-xs font-bold transition-all shadow-xs self-start sm:self-auto"
          >
            <RefreshCw className={cn("w-4 h-4 text-emerald-600", loading && "animate-spin")} />
            Refresh Data
          </button>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <div className="p-4 md:p-5 bg-white rounded-2xl border border-zinc-100 shadow-xs">
            <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Total Stores</p>
            <p className="text-2xl md:text-3xl font-black text-zinc-900 mt-1">{businesses.length}</p>
          </div>
          <div className="p-4 md:p-5 bg-amber-50/60 rounded-2xl border border-amber-100 shadow-xs">
            <p className="text-xs font-bold text-amber-700 uppercase tracking-wider">Pending Review</p>
            <p className="text-2xl md:text-3xl font-black text-amber-800 mt-1">{pendingCount}</p>
          </div>
          <div className="p-4 md:p-5 bg-emerald-50/60 rounded-2xl border border-emerald-100 shadow-xs">
            <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Active Stores</p>
            <p className="text-2xl md:text-3xl font-black text-emerald-800 mt-1">{activeCount}</p>
          </div>
          <div className="p-4 md:p-5 bg-red-50/60 rounded-2xl border border-red-100 shadow-xs">
            <p className="text-xs font-bold text-red-700 uppercase tracking-wider">Rejected</p>
            <p className="text-2xl md:text-3xl font-black text-red-800 mt-1">{rejectedCount}</p>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {deletingBiz && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-[32px] w-full max-w-md p-6 md:p-8 shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="bg-red-50 w-14 h-14 rounded-2xl flex items-center justify-center mb-5 text-red-500">
                <Trash2 className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-zinc-900 mb-2">Delete Store Registration?</h3>
              <p className="text-zinc-500 text-sm mb-6 leading-relaxed">
                Are you sure you want to permanently delete <span className="font-bold text-zinc-900">{deletingBiz.businessName}</span>? All registered information will be removed.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeletingBiz(null)}
                  className="flex-1 py-3 bg-zinc-100 text-zinc-600 rounded-xl font-bold text-sm hover:bg-zinc-200 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold text-sm hover:bg-red-700 shadow-md transition-all"
                >
                  Delete Now
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
              Firebase Authorization Notice
            </div>
            <p className="text-xs leading-relaxed text-red-700">{error}</p>
            <button 
              onClick={() => { setError(null); fetchBusinesses(); }}
              className="mt-2 text-xs font-bold bg-red-600 hover:bg-red-700 text-white px-3.5 py-1.5 rounded-lg transition-colors"
            >
              Dismiss & Refresh
            </button>
          </div>
        )}

        {/* Filter and Search Bar */}
        <div className="bg-white p-4 rounded-2xl border border-zinc-100 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            {(['all', 'pending', 'active', 'rejected'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setStatusFilter(tab)}
                className={cn(
                  "px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap",
                  statusFilter === tab
                    ? "bg-zinc-900 text-white"
                    : "bg-zinc-50 text-zinc-500 hover:bg-zinc-100"
                )}
              >
                {tab} {tab === 'pending' && pendingCount > 0 ? `(${pendingCount})` : ''}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Search stores or handles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-zinc-50 border border-zinc-100 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
            />
          </div>
        </div>

        {/* Business List */}
        <div className="bg-white rounded-2xl md:rounded-[32px] border border-zinc-100 shadow-sm overflow-hidden">
          <div className="p-5 md:p-6 bg-zinc-50 border-b border-zinc-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Users className="w-5 h-5 text-emerald-600" />
              <h2 className="font-bold text-zinc-900 text-sm md:text-base">
                Businesses ({filteredBusinesses.length})
              </h2>
            </div>
            {statusFilter !== 'all' && (
              <span className="text-xs font-bold text-zinc-400 uppercase">
                Filtered: {statusFilter}
              </span>
            )}
          </div>
          
          {loading && businesses.length === 0 ? (
            <div className="p-12 flex justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
            </div>
          ) : (
            <div className="divide-y divide-zinc-100">
              {filteredBusinesses.map((biz) => {
                const publicUrl = biz.slug ? `/${biz.slug}` : `/menu/${biz.uid}`;
                return (
                  <div key={biz.uid} className="p-5 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-zinc-50/70 transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="font-bold text-zinc-900 text-base">{biz.businessName || 'Unnamed Business'}</h3>
                        <span className={cn(
                          "text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border",
                          biz.status === 'active' ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                          biz.status === 'pending' ? "bg-amber-50 text-amber-700 border-amber-200 animate-pulse" :
                          "bg-red-50 text-red-700 border-red-200"
                        )}>
                          {biz.status}
                        </span>
                        {biz.slug && (
                          <span className="text-[10px] font-mono bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded-md">
                            /{biz.slug}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-500 mt-2">
                        <p>Messenger: <span className="font-mono text-zinc-700">@{biz.messengerPageUsername || 'not set'}</span></p>
                        <p className="font-mono text-zinc-400 text-[11px]">UID: {biz.uid.slice(0, 10)}...</p>
                        <p className="text-[11px] text-zinc-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {biz.createdAt ? new Date(biz.createdAt).toLocaleDateString() : 'Recent'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-zinc-100">
                      {actionLoading[biz.uid] ? (
                        <div className="px-6 py-2">
                          <Loader2 className="w-5 h-5 animate-spin text-zinc-400" />
                        </div>
                      ) : (
                        <>
                          {biz.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleStatusChange(biz.uid, 'active')}
                                className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
                              >
                                <CheckCircle className="w-3.5 h-3.5" />
                                Approve
                              </button>
                              <button
                                onClick={() => handleStatusChange(biz.uid, 'rejected')}
                                className="flex items-center gap-1.5 px-3.5 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl text-xs font-bold transition-all"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                Reject
                              </button>
                            </>
                          )}
                          
                          {biz.status === 'rejected' && (
                            <button
                              onClick={() => handleStatusChange(biz.uid, 'active')}
                              className="flex items-center gap-1.5 px-3.5 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl text-xs font-bold transition-all"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                              Re-activate
                            </button>
                          )}

                          {biz.status === 'active' && (
                            <button
                              onClick={() => handleStatusChange(biz.uid, 'rejected')}
                              className="flex items-center gap-1.5 px-3 py-1.5 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-lg text-xs font-bold transition-all"
                              title="Suspend / Reject"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              Suspend
                            </button>
                          )}

                          <Link
                            to={publicUrl}
                            target="_blank"
                            className="p-2 text-zinc-400 hover:text-emerald-600 hover:bg-zinc-100 rounded-lg transition-colors"
                            title="Preview Public Menu"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Link>

                          <button
                            onClick={() => setDeletingBiz(biz)}
                            className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete Registration"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}

              {filteredBusinesses.length === 0 && !loading && (
                <div className="p-12 text-center text-zinc-400 text-sm">
                  {searchQuery ? `No businesses matching "${searchQuery}"` : "No businesses registered in this category."}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
