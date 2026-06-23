'use client';

import React, { useEffect, useState } from 'react';
import { Phone, MapPin, MessageSquare, Loader2, Search, ChefHat, Clock, AlertTriangle, User, LogOut } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getCart, addToCart, updateQuantity, CartItem } from '@/lib/cart';
import CategoryTabs from '@/components/CategoryTabs';
import MenuCard, { MenuItem } from '@/components/MenuCard';
import CartDrawer from '@/components/CartDrawer';
import PhoneLogin, { getStoredUser, clearStoredUser } from '@/components/PhoneLogin';
import type { UserProfile } from '@/components/PhoneLogin';
import LoyaltyCard from '@/components/LoyaltyCard';

interface Category {
  id: number;
  name: string;
  icon?: string | null;
  sort_order: number;
}

const FALLBACK_CATEGORIES: Category[] = [
  { id: 1, name: 'Breakfast', icon: '🍳', sort_order: 1 },
  { id: 2, name: 'Lunch', icon: '🍛', sort_order: 2 },
  { id: 3, name: 'Evening Snacks', icon: '🥪', sort_order: 3 },
  { id: 4, name: 'Beverages & Desserts', icon: '🥤', sort_order: 4 },
];

const FALLBACK_MENU_ITEMS: MenuItem[] = [
  { id: 1, category_id: 1, name: 'Bread Pakoda', price_min: 20, price_max: null, description: 'Crispy bread pakoda with spiced potato filling', is_available: true, is_featured: false },
  { id: 2, category_id: 1, name: 'Vegetable Cheela', price_min: 40, price_max: null, description: 'Healthy chickpea flour pancakes loaded with veggies', is_available: true, is_featured: false },
  { id: 3, category_id: 1, name: 'Burger', price_min: 55, price_max: null, description: 'Homemade veg burger with fresh patty and veggies', is_available: true, is_featured: false },
  { id: 4, category_id: 1, name: 'Poha', price_min: 60, price_max: null, description: 'Light and fluffy flattened rice with mustard seeds & curry leaves', is_available: true, is_featured: false },
  { id: 5, category_id: 1, name: 'Triangle Sandwich', price_min: 60, price_max: null, description: 'Classic grilled sandwich with green chutney and veggies', is_available: true, is_featured: false },
  { id: 6, category_id: 1, name: 'Corn Sandwich', price_min: 70, price_max: null, description: 'Creamy corn and cheese filling grilled to perfection', is_available: true, is_featured: false },
  { id: 7, category_id: 1, name: 'Aloo Puri', price_min: 80, price_max: null, description: 'Hot puris served with delicious spicy potato curry', is_available: true, is_featured: true },
  { id: 8, category_id: 1, name: 'Paneer Sandwich', price_min: 90, price_max: null, description: 'Grilled sandwich stuffed with spiced paneer crumble', is_available: true, is_featured: false },
  { id: 9, category_id: 1, name: 'Corn Paratha Combo (2 Paratha + Curd + Achar)', price_min: 80, price_max: null, description: 'Two delicious corn-stuffed parathas with curd and pickle', is_available: true, is_featured: false },
  { id: 10, category_id: 1, name: 'Aloo Pyaz Paratha Combo (2 Paratha + Curd + Achar)', price_min: 80, price_max: null, description: 'Two spiced potato & onion parathas with curd and pickle', is_available: true, is_featured: false },
  { id: 11, category_id: 1, name: 'Aloo Paratha Combo (2 Paratha + Curd + Achar)', price_min: 90, price_max: null, description: 'Two traditional potato parathas with curd and pickle', is_available: true, is_featured: true },
  { id: 12, category_id: 1, name: 'Pasta', price_min: 120, price_max: null, description: 'Creamy homemade pasta with fresh veggies and herbs', is_available: true, is_featured: false },
  { id: 13, category_id: 1, name: 'Paneer Paratha Combo (2 Paratha + Curd + Achar)', price_min: 120, price_max: null, description: 'Two rich paneer-stuffed parathas with curd and pickle', is_available: true, is_featured: false },
  { id: 14, category_id: 1, name: 'Paneer Bread Pakoda', price_min: 35, price_max: null, description: 'Bread pakoda with a thick slice of spiced paneer', is_available: true, is_featured: false },

  { id: 101, category_id: 2, name: 'Dal Fry Rice Combo', price_min: 99, price_max: null, description: 'Yellow dal fry served with steamed basmati rice', is_available: true, is_featured: false },
  { id: 102, category_id: 2, name: 'Aloo Gobhi with 2 Roti, Salad & Raita', price_min: 99, price_max: null, description: 'Homestyle potato & cauliflower sabzi with 2 rotis, salad, raita', is_available: true, is_featured: false },
  { id: 103, category_id: 2, name: 'Chole Rice Combo', price_min: 99, price_max: null, description: 'Spicy Delhi-style chole served with steamed basmati rice', is_available: true, is_featured: false },
  { id: 104, category_id: 2, name: 'Rajma Rice Combo', price_min: 99, price_max: null, description: 'Rich and creamy rajma with home spices, served with basmati rice', is_available: true, is_featured: true },
  { id: 105, category_id: 2, name: 'Mix Veg Rice Combo', price_min: 99, price_max: null, description: 'Seasonal mixed vegetables served with steamed basmati rice', is_available: true, is_featured: false },
  { id: 106, category_id: 2, name: 'Veg Pulao with Curd', price_min: 99, price_max: null, description: 'Fragrant vegetable pulao served with fresh curd', is_available: true, is_featured: false },
  { id: 107, category_id: 2, name: 'Dal Makhani Rice Combo', price_min: 99, price_max: null, description: 'Creamy dal makhani served with steamed basmati rice', is_available: true, is_featured: false },
  { id: 108, category_id: 2, name: 'Dal Makhani', price_min: 120, price_max: null, description: 'Rich, slow-cooked black lentils in a creamy tomato gravy', is_available: true, is_featured: true },
  { id: 109, category_id: 2, name: 'Paneer Bhurji', price_min: 170, price_max: null, description: 'Scrambled paneer cooked with onions, tomatoes, and spices', is_available: true, is_featured: false },
  { id: 110, category_id: 2, name: 'Paneer Butter Masala', price_min: 180, price_max: null, description: 'Soft paneer cubes in a rich buttery tomato gravy', is_available: true, is_featured: true },
  { id: 111, category_id: 2, name: 'Kadai Paneer', price_min: 180, price_max: null, description: 'Paneer cooked with capsicum, onions in a kadai masala', is_available: true, is_featured: false },
  { id: 112, category_id: 2, name: 'Full Combo (Dal Fry/Dal Makhani + Rice + Raita + 2 Roti + Salad)', price_min: 160, price_max: 180, description: 'Complete meal with dal, rice, raita, 2 rotis, and salad', is_available: true, is_featured: true },
  { id: 113, category_id: 2, name: 'Paneer Combo Meal (Paneer Bhurji/Paneer Curry + Raita + 2 Roti + Salad)', price_min: 200, price_max: 220, description: 'Premium paneer meal with raita, 2 rotis, and salad', is_available: true, is_featured: true },

  { id: 201, category_id: 3, name: 'Bread Pakoda', price_min: 20, price_max: null, description: 'Crispy bread pakoda with spiced potato filling', is_available: true, is_featured: false },
  { id: 202, category_id: 3, name: 'Vegetable Cheela', price_min: 40, price_max: null, description: 'Healthy gram flour pancakes with finely chopped veggies', is_available: true, is_featured: false },
  { id: 203, category_id: 3, name: 'Burger', price_min: 55, price_max: null, description: 'Homemade veg burger patty with fresh dressing', is_available: true, is_featured: false },
  { id: 204, category_id: 3, name: 'Triangle Sandwich', price_min: 60, price_max: null, description: 'Classic grilled sandwich with green chutney', is_available: true, is_featured: false },
  { id: 205, category_id: 3, name: 'Poha', price_min: 60, price_max: null, description: 'Light flattened rice seasoned with spices', is_available: true, is_featured: false },
  { id: 206, category_id: 3, name: 'Corn Sandwich', price_min: 70, price_max: null, description: 'Creamy corn and cheese filling grilled to perfection', is_available: true, is_featured: false },
  { id: 207, category_id: 3, name: 'Paneer Sandwich', price_min: 90, price_max: null, description: 'Grilled sandwich stuffed with spiced paneer', is_available: true, is_featured: false },
  { id: 208, category_id: 3, name: 'Pasta', price_min: 120, price_max: null, description: 'Creamy pasta with veggies and herbs', is_available: true, is_featured: false },
  { id: 209, category_id: 3, name: 'Mix Pakode', price_min: 80, price_max: null, description: 'Assorted crispy vegetable fritters', is_available: true, is_featured: true },
  { id: 210, category_id: 3, name: 'Paneer Pakoda', price_min: 25, price_max: null, description: 'Crispy fried paneer fritters', is_available: true, is_featured: false },
  { id: 211, category_id: 3, name: 'Paneer Bread Pakoda', price_min: 35, price_max: null, description: 'Bread pakoda with a thick paneer slice', is_available: true, is_featured: false },

  { id: 301, category_id: 4, name: 'Virgin Mojito', price_min: 70, price_max: null, description: 'Refreshing summer drink with mint, lemon, and soda', is_available: true, is_featured: true },
  { id: 302, category_id: 4, name: 'Lime Soda', price_min: 50, price_max: null, description: 'Sweet and salted lime soda', is_available: true, is_featured: false },
  { id: 303, category_id: 4, name: 'Cold Coffee', price_min: 89, price_max: null, description: 'Creamy, frothy iced coffee', is_available: true, is_featured: true },
  { id: 304, category_id: 4, name: 'Kheer', price_min: 49, price_max: null, description: 'Traditional Indian sweet rice pudding with cardamom', is_available: true, is_featured: false },
  { id: 305, category_id: 4, name: 'Sooji Halwa', price_min: 35, price_max: null, description: 'Rich semolina dessert with ghee and dry fruits', is_available: true, is_featured: false },
  { id: 306, category_id: 4, name: 'Brownie', price_min: 35, price_max: null, description: 'Rich, fudgy homemade chocolate brownie', is_available: true, is_featured: false },
];

export default function MenuPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOption, setSortOption] = useState('price-asc');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [kitchenOpen, setKitchenOpen] = useState(true);
  const [todaysOffer, setTodaysOffer] = useState('');
  const [user, setUser] = useState<UserProfile | null>(null);
  const [showLogin, setShowLogin] = useState(false);

  useEffect(() => {
    const stored = getStoredUser();
    if (stored) setUser(stored);
  }, []);

  useEffect(() => {
    async function fetchData() {
      try {
        const configRes = await fetch('/api/delivery-config');
        if (configRes.ok) {
          const config = await configRes.json();
          setKitchenOpen(config.kitchenOpen);
          setTodaysOffer(config.todaysOffer || '');
        }
      } catch {} {/* fallback: kitchen is open */}
    }
    fetchData();
  }, []);

  useEffect(() => {
    async function fetchMenuData() {
      try {
        const { data: catData, error: catError } = await supabase
          .from('categories')
          .select('*')
          .order('sort_order', { ascending: true });

        if (catError) throw catError;

        if (catData && catData.length > 0) {
          setCategories(catData);
        } else {
          setCategories(FALLBACK_CATEGORIES);
        }

        const { data: itemData, error: itemError } = await supabase
          .from('menu_items')
          .select('*');

        if (itemError) throw itemError;

        if (itemData && itemData.length > 0) {
          setMenuItems(itemData);
        } else {
          setMenuItems(FALLBACK_MENU_ITEMS);
        }
      } catch (error) {
        console.error('Supabase unavailable, using fallback data:', error);
        setCategories(FALLBACK_CATEGORIES);
        setMenuItems(FALLBACK_MENU_ITEMS);
      } finally {
        setLoading(false);
      }
    }

    fetchMenuData();
    setCart(getCart());
  }, []);

  useEffect(() => {
    const channel = supabase
      .channel('menu_items_realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'menu_items',
        },
        (payload) => {
          if (payload.eventType === 'UPDATE') {
            const updatedItem = payload.new as MenuItem;
            setMenuItems((prevItems) =>
              prevItems.map((item) => item.id === updatedItem.id ? updatedItem : item)
            );
          } else if (payload.eventType === 'INSERT') {
            const newItem = payload.new as MenuItem;
            setMenuItems((prevItems) => [...prevItems, newItem]);
          } else if (payload.eventType === 'DELETE') {
            const oldItem = payload.old as { id: number };
            setMenuItems((prevItems) => prevItems.filter((item) => item.id !== oldItem.id));
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleAddToCart = (item: MenuItem) => {
    if (!kitchenOpen) return;
    const updated = addToCart({
      id: item.id,
      name: item.name,
      price_min: item.price_min,
      price_max: item.price_max,
    });
    setCart([...updated]);
  };

  const handleUpdateQuantity = (id: number, qty: number) => {
    const updated = updateQuantity(id, qty);
    setCart([...updated]);
  };

  const getQuantityInCart = (id: number) => {
    const found = cart.find((i) => i.id === id);
    return found ? found.quantity : 0;
  };

  const filteredAndSorted = React.useMemo(() => {
    let items = activeCategory
      ? menuItems.filter((item) => item.category_id === activeCategory)
      : menuItems;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      items = items.filter(
        (i) => i.name.toLowerCase().includes(term) ||
          (i.description && i.description.toLowerCase().includes(term))
      );
    }

    if (sortOption === 'price-asc') {
      items = items.slice().sort((a, b) => (a.price_min || 0) - (b.price_min || 0));
    } else if (sortOption === 'price-desc') {
      items = items.slice().sort((a, b) => (b.price_min || 0) - (a.price_min || 0));
    } else if (sortOption === 'name-asc') {
      items = items.slice().sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortOption === 'name-desc') {
      items = items.slice().sort((a, b) => b.name.localeCompare(a.name));
    }
    return items;
  }, [menuItems, activeCategory, searchTerm, sortOption]);

  const handleWhatsAppOrder = () => {
    const phone = '919818066376';
    const text = encodeURIComponent(
      'Hello HK Kitchen! I would like to check the availability of items or place an order.'
    );
    window.open(`https://wa.me/${phone}?text=${text}`, '_blank');
  };

  return (
    <main className="min-h-screen bg-cream-50 pb-28">
      {/* Hero */}
      <header className="relative bg-gradient-to-br from-brand-700 via-brand-600 to-brand-800 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-[0.04]" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
          backgroundSize: '24px 24px',
        }} />
        <div className="absolute top-0 right-0 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-0 w-56 h-56 bg-cream-50/5 rounded-full blur-2xl -ml-16 -mb-16" />

        <div className="max-w-7xl mx-auto px-4 py-10 md:py-14 relative z-10">
          <div className="text-center">
            <div className="inline-flex items-center gap-1.5 bg-amber-500/15 text-amber-300 text-[11px] font-bold uppercase tracking-[0.2em] px-3 py-1.5 rounded-full mb-4 border border-amber-500/20">
              <MapPin size={12} />
              Prashant Vihar, Rohini, Delhi
            </div>

            <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-3 leading-tight">
              HK Kitchen
            </h1>
            <p className="text-amber-400 font-heading italic text-lg md:text-xl font-medium mb-6">
              &ldquo;Homemade Goodness, Just Like Home!&rdquo;
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 text-sm text-white/80 font-medium mb-7">
              <a href="tel:+917011531528" className="flex items-center gap-2 hover:text-amber-400 transition-colors">
                <Phone size={15} className="text-amber-400" />
                <span>70115 31528 / 98180 66376</span>
              </a>
              <span className="hidden sm:inline text-white/20">|</span>
              <div className="flex items-center gap-2">
                <ChefHat size={15} className="text-amber-400 shrink-0" />
                <span>Fresh, Hygienic, Homemade</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={handleWhatsAppOrder}
                className="flex items-center gap-2 bg-[#25D366] hover:bg-[#20ba5a] text-white font-bold px-5 py-2.5 rounded-2xl shadow-lg transition-all duration-300 active:scale-[0.97]"
              >
                <MessageSquare size={18} />
                <span>Chat on WhatsApp</span>
              </button>
              <a
                href="#menu-section"
                className="bg-white/10 hover:bg-white/20 text-white border border-white/25 font-bold px-5 py-2.5 rounded-2xl transition-all duration-300 active:scale-[0.97]"
              >
                Browse Menu
              </a>
              {user ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-white/70 font-medium bg-white/10 px-3 py-2 rounded-2xl border border-white/15">
                    {user.email || 'Logged In'}
                  </span>
                  <button
                    onClick={() => { clearStoredUser(); setUser(null); }}
                    className="bg-white/10 hover:bg-white/20 text-white border border-white/25 font-bold px-3 py-2 rounded-2xl transition-all active:scale-[0.97]"
                    title="Logout"
                  >
                    <LogOut size={14} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowLogin(true)}
                  className="bg-amber-500 hover:bg-amber-600 text-white font-bold px-4 py-2.5 rounded-2xl shadow-lg transition-all duration-300 active:scale-[0.97] flex items-center gap-1.5"
                >
                  <User size={14} />
                  <span className="text-xs">Login</span>
                </button>
              )}
            </div>
            {showLogin && (
              <div className="mt-6 max-w-xs mx-auto">
                <PhoneLogin onClose={() => setShowLogin(false)} onLogin={(u) => { setUser(u); setShowLogin(false); }} />
              </div>
            )}
            {user && (
              <div className="mt-6 max-w-xs mx-auto">
                <LoyaltyCard user={user} />
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Kitchen Status Alert */}
      {!kitchenOpen && (
        <div className="max-w-7xl mx-auto px-4 mt-4">
          <div className="bg-amber-50/90 backdrop-blur-sm border-2 border-amber-300/80 text-amber-800 p-5 rounded-3xl flex items-start gap-3 shadow-soft">
            <div className="bg-amber-100 p-2 rounded-xl shrink-0">
              <Clock size={22} className="text-amber-600" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-amber-800 text-lg">Kitchen is Currently Closed</h3>
              <p className="text-amber-700 text-sm mt-1">Orders cannot be placed right now. Please check back during operating hours. You can still browse the menu below.</p>
            </div>
          </div>
        </div>
      )}

      {/* Today's Offer Banner */}
      {todaysOffer && (
        <div className="max-w-7xl mx-auto px-4 mt-4">
          <div className="bg-gradient-to-r from-amber-500 via-amber-400 to-orange-400 text-white p-4 rounded-3xl flex items-start gap-3 shadow-soft-lg">
            <div className="bg-white/20 p-2 rounded-xl shrink-0">
              <AlertTriangle size={20} />
            </div>
            <div>
              <p className="font-heading font-bold text-sm uppercase tracking-wider opacity-80">Today&apos;s Special</p>
              <p className="font-bold text-base mt-0.5">{todaysOffer}</p>
            </div>
          </div>
        </div>
      )}

      {/* Menu Section */}
      <section id="menu-section" className="max-w-7xl mx-auto px-4 mt-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-stone-400 gap-3">
            <Loader2 size={36} className="animate-spin text-brand-600" />
            <p className="font-semibold text-sm">Preparing fresh menu items...</p>
          </div>
        ) : (
          <>
            {/* Search and Sort */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-4">
              <div className="relative w-full sm:max-w-xs">
                <input
                  type="text"
                  placeholder="Search items..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-stone-200/80 focus:border-brand-500 outline-none text-sm bg-white text-stone-800 placeholder:text-stone-400 shadow-soft"
                />
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
              </div>
              <select
                value={sortOption}
                onChange={e => setSortOption(e.target.value)}
                className="w-full sm:w-auto px-3 py-2.5 rounded-2xl border border-stone-200/80 focus:border-brand-500 bg-white text-sm text-stone-800 shadow-soft"
              >
                <option value="price-asc">Price: Low → High</option>
                <option value="price-desc">Price: High → Low</option>
                <option value="name-asc">Name: A → Z</option>
                <option value="name-desc">Name: Z → A</option>
              </select>
            </div>

            <CategoryTabs
              categories={categories}
              activeCategoryId={activeCategory}
              onSelectCategory={setActiveCategory}
            />

            {filteredAndSorted.length === 0 ? (
              <div className="text-center py-16 bg-white/80 rounded-3xl border border-stone-200/60 shadow-soft mt-6 p-8">
                <p className="text-stone-500 font-medium">No items found in this category.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 mt-6">
                {[
                  ...filteredAndSorted.filter((i) => i.is_available),
                  ...filteredAndSorted.filter((i) => !i.is_available),
                ].map((item) => (
                  <MenuCard
                    key={item.id}
                    item={item}
                    quantityInCart={getQuantityInCart(item.id)}
                    onAddToCart={handleAddToCart}
                    onUpdateQuantity={handleUpdateQuantity}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </section>

      <CartDrawer cart={cart} />
    </main>
  );
}
