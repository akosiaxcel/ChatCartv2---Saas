import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getBusinessProfile, getCategories, getMenuItems, getBusinessProfileBySlug } from '../firebase/firestore';
import { BusinessProfile, Category, MenuItem as MenuItemType, CartItem } from '../types';
import MenuCategory from '../components/MenuCategory';
import Cart from '../components/Cart';
import { ItemDetailModal } from '../components/ItemDetailModal';
import { Loader2, Utensils, ShoppingCart, Search, X, ArrowLeft, Store } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Logo } from '../components/Logo';

export default function PublicMenu() {
  const { businessId, slug } = useParams();
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<MenuItemType[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MenuItemType | null>(null);
  const [activeCategoryId, setActiveCategoryId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (businessId || slug) {
      loadMenu();
    }
  }, [businessId, slug]);

  const loadMenu = async () => {
    setLoading(true);
    let prof: BusinessProfile | null = null;
    
    try {
      if (slug) {
        prof = await getBusinessProfileBySlug(slug);
      } else if (businessId) {
        prof = await getBusinessProfile(businessId);
      }

      if (!prof && (slug === 'demo' || businessId === 'demo')) {
        // Built-in Demo Store for Landing Page Visitors
        const demoProfile: BusinessProfile = {
          uid: 'demo',
          businessName: 'ChatCart Bistro (Demo)',
          slug: 'demo',
          messengerPageUsername: 'ChatCartDemo',
          status: 'active',
          createdAt: Date.now()
        };
        const demoCategories: Category[] = [
          { id: 'cat-burgers', name: 'Burgers & Mains', icon: '🍔', order: 0 },
          { id: 'cat-drinks', name: 'Coffee & Drinks', icon: '☕', order: 1 },
          { id: 'cat-desserts', name: 'Desserts & Sweets', icon: '🍰', order: 2 },
        ];
        const demoItems: MenuItemType[] = [
          {
            id: 'item-1',
            categoryId: 'cat-burgers',
            name: 'Double Truffle Smash Burger',
            price: 240,
            description: 'Two smashed premium beef patties, melted cheddar, truffle aioli on a toasted brioche bun.',
            isPopular: true,
            available: true,
            imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80'
          },
          {
            id: 'item-2',
            categoryId: 'cat-burgers',
            name: 'Crispy Honey Butter Chicken',
            price: 195,
            description: 'Crispy fried chicken fillet glazed in garlic honey butter with fresh pickles.',
            isPopular: true,
            available: true,
            imageUrl: 'https://images.unsplash.com/photo-1625813506062-0aeb1d7a094b?auto=format&fit=crop&w=600&q=80'
          },
          {
            id: 'item-3',
            categoryId: 'cat-burgers',
            name: 'Loaded Truffle Parmesan Fries',
            price: 130,
            description: 'Crispy shoestring fries tossed in white truffle oil, grated parmesan, and rosemary.',
            available: true,
            imageUrl: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=600&q=80'
          },
          {
            id: 'item-4',
            categoryId: 'cat-drinks',
            name: 'Spanish Latte (Iced)',
            price: 145,
            description: 'Rich double espresso pulled over sweetened milk and fresh ice.',
            isPopular: true,
            available: true,
            imageUrl: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=600&q=80'
          },
          {
            id: 'item-5',
            categoryId: 'cat-drinks',
            name: 'Ceremonial Uji Matcha Latte',
            price: 160,
            description: 'First-harvest Japanese ceremonial grade matcha whisked with fresh milk.',
            available: true,
            imageUrl: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?auto=format&fit=crop&w=600&q=80'
          },
          {
            id: 'item-6',
            categoryId: 'cat-desserts',
            name: 'San Sebastian Burnt Cheesecake',
            price: 165,
            description: 'Creamy caramelized Basque cheesecake with a melt-in-your-mouth center.',
            isPopular: true,
            available: true,
            imageUrl: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&w=600&q=80'
          }
        ];

        setProfile(demoProfile);
        setCategories(demoCategories);
        setItems(demoItems);
        setLoading(false);
        return;
      }

      if (!prof) {
        setLoading(false);
        return;
      }

      const [cats, its] = await Promise.all([
        getCategories(prof.uid),
        getMenuItems(prof.uid)
      ]);
      
      setProfile(prof);
      setCategories(cats);
      setItems(its);
    } catch (e) {
      console.error("Failed to load public menu", e);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCart = (item: MenuItemType, delta: number) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        const newQuantity = existing.quantity + delta;
        if (newQuantity <= 0) return prev.filter((i) => i.id !== item.id);
        return prev.map((i) => i.id === item.id ? { ...i, quantity: newQuantity } : i);
      }
      if (delta > 0) return [...prev, { ...item, quantity: 1 }];
      return prev;
    });
  };

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredCategories = categories.filter(category => {
    const categoryItems = filteredItems.filter(i => i.categoryId === category.id);
    if (activeCategoryId !== 'all' && category.id !== activeCategoryId) return false;
    return categoryItems.length > 0;
  });

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white">
      <Loader2 className="w-10 h-10 animate-spin text-emerald-600 mb-3" />
      <p className="text-zinc-400 text-xs font-bold uppercase tracking-widest">Loading Menu...</p>
    </div>
  );

  if (!profile || profile.status !== 'active') return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 p-6 text-center">
      <div className="bg-zinc-200/70 p-6 rounded-full mb-6">
        <Utensils className="w-12 h-12 text-zinc-400" />
      </div>
      <h1 className="text-2xl font-bold text-zinc-900">Menu Unavailable</h1>
      <p className="text-zinc-500 mt-2 max-w-md text-sm leading-relaxed">
        {!profile 
          ? "The digital menu you're looking for doesn't exist or may have been renamed." 
          : `The menu for "${profile.businessName}" is currently offline or undergoing review.`}
      </p>
      <Link 
        to="/login"
        className="mt-6 inline-flex items-center gap-2 bg-zinc-900 text-white px-5 py-2.5 rounded-xl font-bold text-xs hover:bg-zinc-800 transition-colors"
      >
        <Store className="w-4 h-4" />
        Visit ChatCart Portal
      </Link>
    </div>
  );

  return (
    <div className="min-h-screen bg-white pb-32">
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-zinc-100">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <AnimatePresence mode="wait">
            {!isSearchOpen ? (
              <motion.div 
                key="header-content"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="flex items-center gap-3 min-w-0"
              >
                <div className="w-10 h-10 rounded-2xl border border-zinc-100 flex items-center justify-center overflow-hidden bg-zinc-50 shrink-0 shadow-2xs">
                  {profile.logoUrl ? (
                    <img src={profile.logoUrl} alt={profile.businessName} className="w-full h-full object-cover" />
                  ) : (
                    <Utensils className="w-5 h-5 text-zinc-400" />
                  )}
                </div>
                <h1 className="text-lg sm:text-xl font-black text-emerald-700 leading-tight uppercase tracking-tight truncate">
                  {profile.businessName}
                </h1>
              </motion.div>
            ) : (
              <motion.div 
                key="search-bar"
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: '100%' }}
                exit={{ opacity: 0, width: 0 }}
                className="flex items-center gap-2 flex-1 mr-3"
              >
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <input
                    autoFocus
                    type="text"
                    placeholder="Search dishes, drinks, desserts..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-zinc-100 border-none rounded-xl py-2 pl-9 pr-4 text-zinc-900 text-sm font-medium focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          <div className="flex items-center gap-1.5 shrink-0">
            <button 
              onClick={() => {
                setIsSearchOpen(!isSearchOpen);
                if (isSearchOpen) setSearchQuery('');
              }}
              className="p-2 text-zinc-500 hover:text-emerald-600 hover:bg-zinc-50 rounded-xl transition-colors"
              aria-label="Toggle search"
            >
              {isSearchOpen ? <X className="w-5 h-5" /> : <Search className="w-5 h-5" />}
            </button>
            <button 
              onClick={() => setIsCartOpen(true)}
              className="relative p-2 text-zinc-700 hover:text-emerald-600 hover:bg-zinc-50 rounded-xl transition-colors"
              aria-label="Open cart"
            >
              <ShoppingCart className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute 0 top-0.5 right-0.5 bg-red-500 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center border border-white">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Category Slider */}
      {categories.length > 0 && (
        <div className="sticky top-[57px] z-40 bg-white/95 backdrop-blur-md py-3 border-b border-zinc-100">
          <div className="max-w-7xl mx-auto">
            <div 
              ref={scrollContainerRef}
              className="flex gap-2 overflow-x-auto px-4 no-scrollbar scroll-smooth sm:justify-center"
            >
              <button
                onClick={() => setActiveCategoryId('all')}
                className={`flex-shrink-0 px-4 py-2 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 ${
                  activeCategoryId === 'all'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                    : 'bg-zinc-50 text-zinc-600 hover:bg-zinc-100'
                }`}
              >
                <span>🍽️</span>
                <span>All Items</span>
              </button>
              
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setActiveCategoryId(category.id)}
                  className={`flex-shrink-0 px-3.5 py-2 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 ${
                    activeCategoryId === category.id
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                      : 'bg-zinc-50 text-zinc-600 hover:bg-zinc-100'
                  }`}
                >
                  <span>{category.icon || '🍽️'}</span>
                  <span>{category.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Menu Categories and Items */}
      <main className="max-w-7xl mx-auto px-4 pt-6">
        {filteredCategories.length === 0 && searchQuery && (
          <div className="py-20 text-center">
            <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-4 text-zinc-400">
              <Search className="w-8 h-8" />
            </div>
            <p className="text-zinc-600 font-bold text-base">No items found for "{searchQuery}"</p>
            <button 
              onClick={() => setSearchQuery('')}
              className="mt-3 text-emerald-600 font-black uppercase tracking-wider text-xs hover:underline"
            >
              Clear Search Filter
            </button>
          </div>
        )}

        {filteredCategories.length === 0 && !searchQuery && (
          <div className="py-20 text-center text-zinc-400 text-sm">
            This store has not added any menu items yet.
          </div>
        )}

        {filteredCategories.map((category) => (
          <div key={category.id} className="mb-10">
            <div className="mb-6 flex items-center gap-2">
              <span className="text-2xl">{category.icon || '🍽️'}</span>
              <h2 className="text-2xl font-black text-zinc-900 tracking-tight">
                {category.name}
              </h2>
            </div>
            
            <MenuCategory
              items={filteredItems.filter(i => i.categoryId === category.id)}
              cart={cart}
              onUpdateCart={handleUpdateCart}
              onSelectItem={(item) => setSelectedItem(item)}
              currency="₱"
            />
          </div>
        ))}

        {/* Footer */}
        <footer className="mt-20 pb-8 flex flex-col items-center justify-center gap-2 text-center">
          <a 
            href="https://wapdev.xyz" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-2 group hover:opacity-80 transition-opacity"
          >
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Powered by</span>
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 rounded-lg bg-emerald-500 flex items-center justify-center shadow-xs p-0.5">
                <Logo size={18} color="white" />
              </div>
              <span className="font-bold text-zinc-800 text-sm tracking-tight group-hover:text-emerald-600 transition-colors">ChatCart</span>
            </div>
          </a>
          <p className="text-[10px] text-zinc-400">
            A product of <a href="https://wapdev.xyz" target="_blank" rel="noopener noreferrer" className="font-semibold text-zinc-500 hover:underline">WapDev</a>
          </p>
        </footer>
      </main>

      {/* Item Detail & Description Modal */}
      <ItemDetailModal
        isOpen={!!selectedItem}
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
        cartItem={cart.find(i => i.id === selectedItem?.id)}
        onUpdateCart={handleUpdateCart}
        currency="₱"
      />

      <Cart
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        onOpen={() => setIsCartOpen(true)}
        cart={cart}
        onUpdateCart={handleUpdateCart}
        onClear={() => setCart([])}
        currency="₱"
        profile={profile}
      />
    </div>
  );
}
