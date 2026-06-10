'use client';

import React, { useEffect, useState } from 'react';
import { Phone, MapPin, MessageSquare, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getCart, addToCart, updateQuantity, CartItem } from '@/lib/cart';
import CategoryTabs from '@/components/CategoryTabs';
import MenuCard, { MenuItem } from '@/components/MenuCard';
import CartDrawer from '@/components/CartDrawer';

interface Category {
  id: number;
  name: string;
  icon?: string | null;
  sort_order: number;
}

// ── Complete fallback data (shown when Supabase tables don't exist yet) ──
const FALLBACK_CATEGORIES: Category[] = [
  { id: 1, name: 'Breakfast', icon: '🍳', sort_order: 1 },
  { id: 2, name: 'Lunch', icon: '🍛', sort_order: 2 },
  { id: 3, name: 'Evening Snacks', icon: '🥪', sort_order: 3 },
  { id: 4, name: 'Beverages & Desserts', icon: '🥤', sort_order: 4 },
];

const FALLBACK_MENU_ITEMS: MenuItem[] = [
  // ── BREAKFAST ──
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

  // ── LUNCH ──
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

  // ── EVENING SNACKS ──
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

  // ── BEVERAGES & DESSERTS ──
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



  // Load initial data and cart
  useEffect(() => {
    async function fetchData() {
      try {
        // Try fetching categories from Supabase
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

        // Try fetching menu items from Supabase
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
        // KEY FIX: set fallback data when Supabase throws errors
        setCategories(FALLBACK_CATEGORIES);
        setMenuItems(FALLBACK_MENU_ITEMS);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
    setCart(getCart());
  }, []);

  // Subscribe to real-time updates on menu items
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
              prevItems.map((item) =>
                item.id === updatedItem.id ? updatedItem : item
              )
            );
          } else if (payload.eventType === 'INSERT') {
            const newItem = payload.new as MenuItem;
            setMenuItems((prevItems) => [...prevItems, newItem]);
          } else if (payload.eventType === 'DELETE') {
            const oldItem = payload.old as { id: number };
            setMenuItems((prevItems) =>
              prevItems.filter((item) => item.id !== oldItem.id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleAddToCart = (item: MenuItem) => {
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

  // Filter items by category
  // Apply search, category filter, then sorting
  const filteredAndSorted = React.useMemo(() => {
    let items = activeCategory
      ? menuItems.filter((item) => item.category_id === activeCategory)
      : menuItems;

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      items = items.filter(
        (i) =>
          i.name.toLowerCase().includes(term) ||
          (i.description && i.description.toLowerCase().includes(term))
      );
    }

    // Sorting
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

  const filteredItems = filteredAndSorted;

  const handleWhatsAppOrder = () => {
    const phone = '919818066376';
    const text = encodeURIComponent(
      `Hello HK Kitchen! I would like to check the availability of items or place an order. Please help me.`
    );
    window.open(`https://wa.me/${phone}?text=${text}`, '_blank');
  };

  return (
    <main className="min-h-screen bg-[#fdfbf7] pb-28">
      {/* Header Banner */}
      <header className="relative bg-[#1a4a1a] text-white overflow-hidden py-10 px-4">
        {/* Abstract Gold Background Shapes */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#f5a623]/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#fdfbf7]/5 rounded-full blur-2xl -ml-16 -mb-16"></div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-block bg-[#f5a623] text-white text-[11px] font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-3 shadow-sm">
            Rohini, Delhi
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-2 font-serif text-white">
            HK Kitchen
          </h1>
          <p className="text-[#f5a623] italic text-lg md:text-xl font-medium mb-6">
            &ldquo;Homemade Goodness, Just Like Home!&rdquo;
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-sm text-white/90 font-medium mb-6">
            <a
              href="tel:+917011531528"
              className="flex items-center gap-2 hover:text-[#f5a623] transition-colors"
            >
              <Phone size={16} className="text-[#f5a623]" />
              <span>70115 31528 / 98180 66376</span>
            </a>
            <span className="hidden sm:inline text-white/30">|</span>
            <div className="flex items-center gap-2 max-w-xs text-center justify-center">
              <MapPin size={16} className="text-[#f5a623] shrink-0" />
              <span className="line-clamp-1">Prashant Vihar, Rohini, Delhi</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={handleWhatsAppOrder}
              className="flex items-center gap-2 bg-[#25D366] text-white hover:bg-[#20ba5a] transition-all duration-300 font-bold px-5 py-2.5 rounded-xl shadow-md transform hover:scale-[1.02] active:scale-95"
            >
              <MessageSquare size={18} />
              <span>Chat on WhatsApp</span>
            </button>
            <a
              href="#menu-section"
              className="bg-transparent hover:bg-white/10 text-white border border-white/30 font-bold px-5 py-2.5 rounded-xl transition-all duration-300"
            >
              Browse Menu
            </a>
          </div>
        </div>
      </header>

      {/* Menu Section */}
      <section id="menu-section" className="max-w-7xl mx-auto px-4 mt-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-500 gap-3">
            <Loader2 size={36} className="animate-spin text-[#1a4a1a]" />
            <p className="font-semibold text-sm">Preparing fresh menu items...</p>
          </div>
        ) : (
          <>

          {/* Search and Sort Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-4">
            {/* Search box */}
            <div className="relative w-full sm:max-w-xs">
              <input
                type="text"
                placeholder="Search items..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#1a4a1a] outline-none text-sm bg-white text-gray-800"
              />
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 1016.65 16.65z" /></svg>
            </div>
            {/* Sort selector */}
            <select
              value={sortOption}
              onChange={e => setSortOption(e.target.value)}
              className="w-full sm:w-auto px-3 py-2 rounded-xl border border-gray-200 focus:border-[#1a4a1a] bg-white text-sm text-gray-800"
            >
              <option value="price-asc">Price: Low → High</option>
              <option value="price-desc">Price: High → Low</option>
              <option value="name-asc">Name: A → Z</option>
              <option value="name-desc">Name: Z → A</option>
            </select>
          </div>

          {/* Category Tabs */}
          <CategoryTabs
            categories={categories}
            activeCategoryId={activeCategory}
            onSelectCategory={setActiveCategory}
          />

            {/* Grid of menu cards */}
            {filteredItems.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 shadow-sm mt-6 p-6">
                <p className="text-gray-500 font-medium">No items found in this category.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-6">
                {/* Available Items First, then Unavailable Items */}
                {[
                  ...filteredItems.filter((i) => i.is_available),
                  ...filteredItems.filter((i) => !i.is_available),
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

      {/* Floating Cart Indicator */}
      <CartDrawer cart={cart} />
    </main>
  );
}
