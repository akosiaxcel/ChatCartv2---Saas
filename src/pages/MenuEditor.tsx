import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { 
  getCategories, 
  saveCategory, 
  deleteCategory, 
  getMenuItems, 
  saveMenuItem, 
  deleteMenuItem,
  getBusinessProfile
} from '../firebase/firestore';
import { db } from '../firebase/config';
import { doc, collection } from 'firebase/firestore';
import { uploadMenuImage } from '../firebase/storage';
import AdminLayout from '../components/AdminLayout';
import { Category, MenuItem, BusinessProfile } from '../types';
import { Plus, Trash2, Edit2, Image as ImageIcon, Loader2, Save, X, Check, Clock, Eye, Shield } from 'lucide-react';
import { cn } from '../lib/utils';

export default function MenuEditor() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { slug: urlSlug } = useParams();
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modals
  const [editingCategory, setEditingCategory] = useState<Partial<Category> | null>(null);
  const [editingItem, setEditingItem] = useState<Partial<MenuItem> | null>(null);
  const [uploading, setUploading] = useState(false);

  const isSuperAdmin = user?.email === 'axceljohnpatriarca@gmail.com';

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, urlSlug]);

  const loadData = async () => {
    if (!user) return;
    try {
      const [prof, cats, its] = await Promise.all([
        getBusinessProfile(user.uid),
        getCategories(user.uid),
        getMenuItems(user.uid)
      ]);
      
      if (prof) {
        setProfile(prof);
        if (prof.slug && !urlSlug && !isSuperAdmin) {
          navigate(`/${prof.slug}/editor`, { replace: true });
        }
      }
      
      setCategories(cats);
      setItems(its);
    } catch (e) {
      console.error("Failed to load menu editor data", e);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !editingCategory || !editingCategory.name?.trim()) return;
    await saveCategory(user.uid, {
      ...editingCategory,
      name: editingCategory.name.trim()
    });
    setEditingCategory(null);
    loadData();
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !editingItem || !editingItem.name?.trim()) return;
    await saveMenuItem(user.uid, {
      ...editingItem,
      name: editingItem.name.trim(),
      price: Number(editingItem.price) || 0,
      description: editingItem.description?.trim() || '',
      available: editingItem.available !== false,
      isPopular: !!editingItem.isPopular
    });
    setEditingItem(null);
    loadData();
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, itemId?: string) => {
    if (!user || !e.target.files?.[0]) return;
    const file = e.target.files[0];
    setUploading(true);
    try {
      if (itemId) {
        const url = await uploadMenuImage(user.uid, itemId, file);
        await saveMenuItem(user.uid, { id: itemId, imageUrl: url });
        loadData();
      } else if (editingItem) {
        let currentId = editingItem.id;
        if (!currentId) {
          currentId = doc(collection(db, 'menus', user.uid, 'items')).id;
        }
        
        const url = await uploadMenuImage(user.uid, currentId, file);
        setEditingItem({ ...editingItem, id: currentId, imageUrl: url });
      }
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Failed to upload image. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
    </div>
  );

  if (profile?.status !== 'active' && !isSuperAdmin) return (
    <AdminLayout>
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 bg-white rounded-[32px] border border-zinc-100 shadow-sm mt-4">
        <div className="bg-amber-100 p-6 rounded-full mb-6">
          <Clock className="w-12 h-12 text-amber-600" />
        </div>
        <h1 className="text-2xl font-bold text-zinc-900">Menu Editor Locked</h1>
        <p className="text-zinc-500 mt-2 max-w-md">
          Your account status is currently <span className="font-bold text-zinc-900">{profile?.status || 'pending'}</span>. You can manage your menu items once your store is approved.
        </p>
      </div>
    </AdminLayout>
  );

  return (
    <AdminLayout>
      <div className="space-y-6 md:space-y-8">
        {isSuperAdmin && (
          <div className="bg-zinc-900 text-white p-4 rounded-2xl flex items-center justify-between gap-3 border border-zinc-800">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-emerald-400 shrink-0" />
              <p className="text-sm">You are editing the demo/master menu as Super Admin.</p>
            </div>
            <Link to="/superadmin/dashboard" className="text-xs bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-3 py-1.5 rounded-lg transition-colors shrink-0">
              Admin Overview
            </Link>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-zinc-900 tracking-tight">Menu Editor</h1>
            <p className="text-zinc-500 text-sm md:text-base mt-1">Organize your categories, photos, and items</p>
          </div>
          
          <div className="flex items-center gap-3">
            {profile?.slug && (
              <Link
                to={`/${profile.slug}`}
                target="_blank"
                className="bg-white border-2 border-zinc-900 text-zinc-900 hover:bg-zinc-100 px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 text-sm shadow-[2px_2px_0px_0px_rgba(24,24,27,1)] active:translate-x-[1px] active:translate-y-[1px] transition-all"
              >
                <Eye className="w-4 h-4 text-emerald-700" />
                Live Preview
              </Link>
            )}

            <button
              onClick={() => setEditingCategory({ name: '', icon: '🍽️', order: categories.length })}
              className="bg-emerald-500 text-zinc-950 px-5 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-emerald-400 active:translate-x-[1px] active:translate-y-[1px] transition-all text-sm border-2 border-zinc-950 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Add Category
            </button>
          </div>
        </div>

        {categories.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border-2 border-zinc-900 shadow-[4px_4px_0px_0px_rgba(24,24,27,1)] space-y-4">
            <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto text-2xl border-2 border-zinc-900">
              📂
            </div>
            <h3 className="text-xl font-bold text-zinc-900">No categories created yet</h3>
            <p className="text-zinc-500 text-sm max-w-sm mx-auto font-medium">
              Start by creating your first category like "Burgers", "Main Dishes", or "Iced Coffee".
            </p>
            <button
              onClick={() => setEditingCategory({ name: '', icon: '☕', order: 0 })}
              className="bg-zinc-900 text-white px-6 py-3 rounded-xl font-bold text-sm inline-flex items-center gap-2 hover:bg-zinc-800 border-2 border-zinc-950 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
            >
              <Plus className="w-4 h-4" />
              Create First Category
            </button>
          </div>
        ) : (
          <div className="space-y-8 md:space-y-10">
            {categories.map((category) => {
              const categoryItems = items.filter(i => i.categoryId === category.id);
              return (
                <section key={category.id} className="bg-white rounded-2xl md:rounded-[32px] border-2 border-zinc-900 shadow-[4px_4px_0px_0px_rgba(24,24,27,1)] overflow-hidden">
                  <div className="p-4 md:p-6 bg-zinc-50 border-b-2 border-zinc-900 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3 md:gap-4">
                      <div className="w-1.5 h-6 bg-emerald-500 rounded-full border border-zinc-900" />
                      <h2 className="text-lg md:text-xl font-bold text-zinc-900 flex items-center gap-2">
                        <span className="text-xl md:text-2xl">{category.icon || '🍽️'}</span>
                        {category.name}
                        <span className="text-xs font-semibold text-zinc-500">({categoryItems.length} items)</span>
                      </h2>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-2">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setEditingCategory(category)}
                          className="p-2 text-zinc-700 hover:text-zinc-950 hover:bg-white rounded-xl transition-colors border border-zinc-300 hover:border-zinc-900"
                          title="Edit Category"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={async () => {
                            if (confirm(`Delete category "${category.name}" and all its items?`)) {
                              await deleteCategory(user!.uid, category.id);
                              loadData();
                            }
                          }}
                          className="p-2 text-zinc-700 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors border border-zinc-300 hover:border-rose-400"
                          title="Delete Category"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <button
                        onClick={() => setEditingItem({ 
                          categoryId: category.id, 
                          name: '', 
                          price: 0, 
                          available: true,
                          isPopular: false,
                          description: ''
                        })}
                        className="bg-zinc-900 hover:bg-zinc-800 text-white px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors border-2 border-zinc-950 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px]"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Add Item
                      </button>
                    </div>
                  </div>

                  <div className="p-4 md:p-6">
                    {categoryItems.length === 0 ? (
                      <p className="text-xs text-zinc-500 py-6 text-center italic font-medium">
                        No items in this category. Click "+ Add Item" above to add products.
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {categoryItems.map(item => (
                          <div key={item.id} className="p-3.5 md:p-4 rounded-2xl border-2 border-zinc-900 bg-white hover:shadow-[3px_3px_0px_0px_rgba(24,24,27,1)] transition-all flex gap-3.5 items-center">
                            <div className="relative w-16 h-16 rounded-xl bg-zinc-50 border-2 border-zinc-900 overflow-hidden shrink-0 group">
                              {item.imageUrl ? (
                                <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-zinc-400">
                                  <ImageIcon className="w-5 h-5 text-zinc-400" />
                                </div>
                              )}
                              <label className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity">
                                <input 
                                  type="file" 
                                  className="hidden" 
                                  accept="image/*"
                                  disabled={uploading}
                                  onChange={(e) => handleImageUpload(e, item.id)}
                                />
                                {uploading ? (
                                  <Loader2 className="w-4 h-4 text-white animate-spin" />
                                ) : (
                                  <Plus className="w-4 h-4 text-white" />
                                )}
                              </label>
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2 min-w-0">
                                  <h3 className="font-bold text-zinc-900 truncate text-sm md:text-base">{item.name}</h3>
                                  {item.isPopular && (
                                    <span className="bg-amber-100 text-amber-900 text-[8px] font-black uppercase px-1.5 py-0.5 rounded-full shrink-0 border border-amber-400">
                                      Popular
                                    </span>
                                  )}
                                  {item.available === false && (
                                    <span className="bg-zinc-900 text-white text-[8px] font-black uppercase px-1.5 py-0.5 rounded-full shrink-0 border border-zinc-900">
                                      Sold Out
                                    </span>
                                  )}
                                </div>
                                <span className="font-mono font-bold text-zinc-900 bg-zinc-100 px-2 py-0.5 rounded-md border border-zinc-900/40 text-xs shrink-0">₱{Number(item.price).toFixed(2)}</span>
                              </div>
                              {item.description && (
                                <p className="text-[11px] text-zinc-600 line-clamp-1 mt-0.5 font-medium">{item.description}</p>
                              )}
                              <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-zinc-200">
                                <button
                                  onClick={() => saveMenuItem(user!.uid, { id: item.id, available: !item.available }).then(loadData)}
                                  className={cn(
                                    "text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg transition-all active:scale-95 flex items-center gap-1 border-2 border-zinc-900",
                                    item.available !== false 
                                      ? "bg-emerald-100 text-emerald-950 shadow-[1px_1px_0px_0px_rgba(24,24,27,1)]" 
                                      : "bg-red-100 text-red-950 shadow-[1px_1px_0px_0px_rgba(24,24,27,1)]"
                                  )}
                                  title="Click to toggle Available vs Sold Out status"
                                >
                                  {item.available !== false ? '✓ In Stock' : '✕ Sold Out'}
                                </button>
                                
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => setEditingItem(item)}
                                    className="p-1.5 text-zinc-600 hover:text-zinc-900 rounded-md hover:bg-zinc-100 border border-transparent hover:border-zinc-300"
                                    title="Edit Item"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={async () => {
                                      if (confirm(`Delete "${item.name}"?`)) {
                                        await deleteMenuItem(user!.uid, item.id);
                                        loadData();
                                      }
                                    }}
                                    className="p-1.5 text-zinc-600 hover:text-red-600 rounded-md hover:bg-red-50 border border-transparent hover:border-red-200"
                                    title="Delete Item"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </section>
              );
            })}
          </div>
        )}

        {/* Category Modal */}
        {editingCategory && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[100] flex items-center justify-center p-4 md:p-6 overflow-y-auto">
            <div className="bg-white w-full max-w-md rounded-[28px] p-6 md:p-8 shadow-[8px_8px_0px_0px_rgba(24,24,27,1)] border-2 border-zinc-900 my-auto animate-in zoom-in-95 duration-200">
              <h2 className="text-xl font-bold mb-5 text-zinc-900">
                {editingCategory.id ? 'Edit Category' : 'New Category'}
              </h2>
              <form onSubmit={handleSaveCategory} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-800">Category Name</label>
                  <input
                    type="text"
                    required
                    autoFocus
                    value={editingCategory.name || ''}
                    onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                    className="w-full px-4 py-3 bg-zinc-50 border-2 border-zinc-900 rounded-xl focus:ring-2 focus:ring-emerald-500 text-sm font-semibold text-zinc-900"
                    placeholder="e.g. Coffee & Beverages"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-800">Category Icon (Emoji)</label>
                  <input
                    type="text"
                    value={editingCategory.icon || ''}
                    onChange={(e) => setEditingCategory({ ...editingCategory, icon: e.target.value })}
                    className="w-full px-4 py-3 bg-zinc-50 border-2 border-zinc-900 rounded-xl focus:ring-2 focus:ring-emerald-500 text-sm font-semibold text-zinc-900"
                    placeholder="e.g. ☕ or 🍔"
                  />
                </div>
                <div className="flex gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setEditingCategory(null)}
                    className="flex-1 py-3 font-bold text-zinc-700 text-sm hover:bg-zinc-100 rounded-xl border-2 border-zinc-900"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-zinc-900 hover:bg-zinc-800 text-white py-3 rounded-xl font-bold text-sm border-2 border-zinc-950 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px]"
                  >
                    Save Category
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Item Modal */}
        {editingItem && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[100] flex items-center justify-center p-4 md:p-6 overflow-y-auto">
            <div className="bg-white w-full max-w-md rounded-[32px] p-6 md:p-8 shadow-[8px_8px_0px_0px_rgba(24,24,27,1)] border-2 border-zinc-900 my-auto animate-in zoom-in-95 duration-200">
              <h2 className="text-xl font-bold mb-5 text-zinc-900">
                {editingItem.id ? 'Edit Item' : 'New Item'}
              </h2>
              <form onSubmit={handleSaveItem} className="space-y-4">
                <div className="flex flex-col items-center mb-4">
                  <div className="relative w-28 h-28 rounded-3xl bg-zinc-50 border-2 border-dashed border-zinc-900 overflow-hidden group shadow-inner">
                    {editingItem.imageUrl ? (
                      <img src={editingItem.imageUrl} alt="Item" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-zinc-400">
                        <ImageIcon className="w-6 h-6 mb-1" />
                        <span className="text-[8px] font-black uppercase tracking-widest">No Photo</span>
                      </div>
                    )}
                    
                    <label className={cn(
                      "absolute inset-0 bg-black/60 flex flex-col items-center justify-center cursor-pointer transition-all duration-200",
                      editingItem.imageUrl ? "opacity-0 group-hover:opacity-100" : "opacity-100"
                    )}>
                      <input 
                        type="file" 
                        className="hidden" 
                        accept="image/*"
                        disabled={uploading}
                        onChange={(e) => handleImageUpload(e)}
                      />
                      {uploading ? (
                        <Loader2 className="w-6 h-6 text-white animate-spin" />
                      ) : (
                        <>
                          <Plus className="w-5 h-5 text-white mb-0.5" />
                          <span className="text-[8px] font-bold text-white uppercase tracking-wider">
                            Upload
                          </span>
                        </>
                      )}
                    </label>
                  </div>
                  {editingItem.imageUrl && !uploading && (
                    <button
                      type="button"
                      onClick={() => setEditingItem({ ...editingItem, imageUrl: '' })}
                      className="mt-2 text-[10px] font-bold text-red-500 uppercase hover:underline"
                    >
                      Remove Photo
                    </button>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-800">Item Name</label>
                  <input
                    type="text"
                    required
                    value={editingItem.name || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                    className="w-full px-4 py-2.5 bg-zinc-50 border-2 border-zinc-900 rounded-xl focus:ring-2 focus:ring-emerald-500 text-sm font-semibold text-zinc-900"
                    placeholder="e.g. Classic Cheeseburger"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-800">Price (₱)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 font-bold text-sm">₱</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      value={editingItem.price === undefined || isNaN(editingItem.price) ? '' : editingItem.price}
                      onChange={(e) => setEditingItem({ ...editingItem, price: e.target.value === '' ? 0 : parseFloat(e.target.value) || 0 })}
                      className="w-full pl-8 pr-4 py-2.5 bg-zinc-50 border-2 border-zinc-900 rounded-xl focus:ring-2 focus:ring-emerald-500 text-sm font-mono font-bold text-zinc-900"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-800">Description</label>
                  <textarea
                    value={editingItem.description || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                    className="w-full px-4 py-2.5 bg-zinc-50 border-2 border-zinc-900 rounded-xl focus:ring-2 focus:ring-emerald-500 h-20 resize-none text-xs font-medium leading-relaxed text-zinc-900"
                    placeholder="e.g. Grilled beef patty, melted cheddar, lettuce, special sauce"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <label className="flex items-center gap-2 p-3 bg-zinc-50 border-2 border-zinc-900 rounded-xl cursor-pointer hover:bg-zinc-100 font-medium">
                    <input
                      type="checkbox"
                      checked={!!editingItem.isPopular}
                      onChange={(e) => setEditingItem({ ...editingItem, isPopular: e.target.checked })}
                      className="w-4 h-4 rounded text-red-600 focus:ring-red-500 border-zinc-900"
                    />
                    <span className="text-xs font-bold text-zinc-800">Popular Item</span>
                  </label>

                  <label className="flex items-center gap-2 p-3 bg-zinc-50 border-2 border-zinc-900 rounded-xl cursor-pointer hover:bg-zinc-100 font-medium">
                    <input
                      type="checkbox"
                      checked={editingItem.available !== false}
                      onChange={(e) => setEditingItem({ ...editingItem, available: e.target.checked })}
                      className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-zinc-900"
                    />
                    <span className="text-xs font-bold text-zinc-800">Available</span>
                  </label>
                </div>

                <div className="flex gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setEditingItem(null)}
                    className="flex-1 py-3 font-bold text-zinc-700 text-sm hover:bg-zinc-100 rounded-xl border-2 border-zinc-900"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-zinc-900 hover:bg-zinc-800 text-white py-3 rounded-xl font-bold text-sm border-2 border-zinc-950 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px]"
                  >
                    Save Item
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
