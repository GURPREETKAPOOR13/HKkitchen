'use client';

import React, { useEffect, useState } from 'react';
import { Plus, Edit2, Check, X, Search, Loader2, Sparkles } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import AdminToggle from '@/components/AdminToggle';

interface Category {
  id: number;
  name: string;
}

interface MenuItem {
  id: number;
  category_id: number;
  name: string;
  price_min: number;
  price_max: number | null;
  description: string | null;
  is_available: boolean;
  is_featured: boolean;
}

export default function AdminMenuPage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<number | null>(null);

  // Price Editing States
  const [editingItemId, setEditingItemId] = useState<number | null>(null);
  const [editPriceMin, setEditPriceMin] = useState<number>(0);
  const [editPriceMax, setEditPriceMax] = useState<number | null>(null);

  // Add Item Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemCategory, setNewItemCategory] = useState<number>(0);
  const [newItemPriceMin, setNewItemPriceMin] = useState<number>(0);
  const [newItemPriceMax, setNewItemPriceMax] = useState<string>('');
  const [newItemDesc, setNewItemDesc] = useState('');
  const [newItemAvailable, setNewItemAvailable] = useState(true);
  const [newItemFeatured, setNewItemFeatured] = useState(false);
  const [modalSubmitting, setModalSubmitting] = useState(false);

  // Fetch initial data
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const { data: catData, error: catError } = await supabase
          .from('categories')
          .select('*')
          .order('sort_order', { ascending: true });

        if (catError) throw catError;
        if (catData && catData.length > 0) {
          setCategories(catData);
          setNewItemCategory(catData[0].id);
        } else {
          const fallbackCategories = [
            { id: 1, name: 'Breakfast', icon: '🍳', sort_order: 1 },
            { id: 2, name: 'Lunch', icon: '🍛', sort_order: 2 },
            { id: 3, name: 'Evening Snacks', icon: '🥪', sort_order: 3 },
            { id: 4, name: 'Beverages & Desserts', icon: '🥤', sort_order: 4 },
          ];
          setCategories(fallbackCategories);
          setNewItemCategory(fallbackCategories[0].id);
        }

        const { data: itemData, error: itemError } = await supabase
          .from('menu_items')
          .select('*')
          .order('id', { ascending: true });

        if (itemError) throw itemError;
        setMenuItems(itemData || []);
      } catch (error) {
        console.error('Error loading menu items:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  // Handler to toggle availability (real-time update on Supabase)
  const handleToggleAvailable = async (id: number, currentVal: boolean) => {
    try {
      // Optimistic Update
      setMenuItems(prev =>
        prev.map(item => (item.id === id ? { ...item, is_available: !currentVal } : item))
      );

      const { error } = await supabase
        .from('menu_items')
        .update({ is_available: !currentVal })
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Failed to update availability:', error);
      // Revert if error
      setMenuItems(prev =>
        prev.map(item => (item.id === id ? { ...item, is_available: currentVal } : item))
      );
    }
  };

  // Handler to toggle featured status
  const handleToggleFeatured = async (id: number, currentVal: boolean) => {
    try {
      // Optimistic Update
      setMenuItems(prev =>
        prev.map(item => (item.id === id ? { ...item, is_featured: !currentVal } : item))
      );

      const { error } = await supabase
        .from('menu_items')
        .update({ is_featured: !currentVal })
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Failed to update featured status:', error);
      // Revert if error
      setMenuItems(prev =>
        prev.map(item => (item.id === id ? { ...item, is_featured: currentVal } : item))
      );
    }
  };

  // Starts price editing
  const startEditPrice = (item: MenuItem) => {
    setEditingItemId(item.id);
    setEditPriceMin(item.price_min);
    setEditPriceMax(item.price_max);
  };

  // Saves updated prices
  const savePriceEdit = async (id: number) => {
    try {
      const { error } = await supabase
        .from('menu_items')
        .update({
          price_min: editPriceMin,
          price_max: editPriceMax || null,
        })
        .eq('id', id);

      if (error) throw error;

      setMenuItems(prev =>
        prev.map(item =>
          item.id === id ? { ...item, price_min: editPriceMin, price_max: editPriceMax || null } : item
        )
      );
      setEditingItemId(null);
    } catch (error) {
      console.error('Failed to update price:', error);
      alert('Error updating price. Please try again.');
    }
  };

  // Form Submission for New Menu Item (with Supabase fallback)
  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;

    setModalSubmitting(true);
    try {
      const maxPriceParsed = newItemPriceMax.trim() ? parseInt(newItemPriceMax) : null;

      // Try inserting via Supabase
      const { data, error } = await supabase
        .from('menu_items')
        .insert({
          category_id: newItemCategory,
          name: newItemName,
          price_min: newItemPriceMin,
          price_max: maxPriceParsed,
          description: newItemDesc || null,
          is_available: newItemAvailable,
          is_featured: newItemFeatured,
        })
        .select()
        .single();

      if (error) throw error;

      // Successful insertion – update state with real ID
      setMenuItems(prev => [...prev, data]);
    } catch (err) {
      console.error('Failed to add item via Supabase:', err);
      // Fallback: add locally with a temporary ID
      const tempId = Math.max(0, ...menuItems.map(i => i.id)) + 1;
      const fallbackItem = {
        id: tempId,
        category_id: newItemCategory,
        name: newItemName,
        price_min: newItemPriceMin,
        price_max: newItemPriceMax ? parseInt(newItemPriceMax) : null,
        description: newItemDesc || null,
        is_available: newItemAvailable,
        is_featured: newItemFeatured,
      } as any;
      setMenuItems(prev => [...prev, fallbackItem]);
      alert('Item added locally (Supabase unavailable).');
    } finally {
      // Reset form fields
      setIsModalOpen(false);
      setNewItemName('');
      setNewItemPriceMin(0);
      setNewItemPriceMax('');
      setNewItemDesc('');
      setNewItemAvailable(true);
      setNewItemFeatured(false);
      setModalSubmitting(false);
    }
  };

  // Helper to resolve category name
  const getCategoryName = (catId: number) => {
    return categories.find(c => c.id === catId)?.name || 'Unknown';
  };

  // Filter and search calculations
  const filteredItems = menuItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = filterCategory === null || item.category_id === filterCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header and top buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#1a4a1a]">Menu Management</h1>
          <p className="text-gray-500 text-sm mt-1">Manage kitchen menu pricing and live availability status</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-1.5 bg-[#1a4a1a] hover:bg-[#153b15] text-white font-bold py-3 px-5 rounded-2xl shadow-md transition-all duration-300 transform active:scale-95 self-start sm:self-center"
        >
          <Plus size={18} className="stroke-[2.5]" />
          <span>Add Menu Item</span>
        </button>
      </div>

      {/* Search and Category filters bar */}
      <div className="bg-white rounded-3xl p-4 border border-[#1a4a1a]/5 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Search Input */}
        <div className="relative w-full md:max-w-xs">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search items..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#1a4a1a] outline-none text-sm transition-colors bg-white text-gray-800"
          />
        </div>

        {/* Category filter tabs */}
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <button
            onClick={() => setFilterCategory(null)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
              filterCategory === null
                ? 'bg-[#1a4a1a] text-white border-[#1a4a1a] shadow-sm'
                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
            }`}
          >
            All Categories
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setFilterCategory(cat.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                filterCategory === cat.id
                  ? 'bg-[#1a4a1a] text-white border-[#1a4a1a] shadow-sm'
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Table of items */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-500 gap-3">
          <Loader2 size={36} className="animate-spin text-[#1a4a1a]" />
          <p className="font-semibold text-sm">Fetching catalog details...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-sm">
          <p className="text-gray-500 font-medium">No menu items match your search/filter.</p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-[#1a4a1a]/5 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-gray-100 bg-[#fdfbf7] text-gray-400 font-semibold text-xs uppercase">
                  <th className="p-4 sm:p-5">Name / Description</th>
                  <th className="p-4 sm:p-5">Category</th>
                  <th className="p-4 sm:p-5">Pricing (₹)</th>
                  <th className="p-4 sm:p-5 text-center">Available</th>
                  <th className="p-4 sm:p-5 text-center">Featured</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredItems.map(item => (
                  <tr key={item.id} className="hover:bg-gray-50/30 transition-colors">
                    {/* Name/Desc */}
                    <td className="p-4 sm:p-5 max-w-xs sm:max-w-sm">
                      <div className="font-bold text-gray-800 text-sm md:text-base leading-snug">
                        {item.name}
                      </div>
                      {item.description && (
                        <p className="text-xs text-gray-400 line-clamp-2 mt-1 leading-normal font-medium">
                          {item.description}
                        </p>
                      )}
                    </td>

                    {/* Category */}
                    <td className="p-4 sm:p-5">
                      <span className="inline-block bg-[#1a4a1a]/5 text-[#1a4a1a] text-xs font-bold px-2.5 py-1 rounded-lg border border-[#1a4a1a]/10">
                        {getCategoryName(item.category_id)}
                      </span>
                    </td>

                    {/* Pricing */}
                    <td className="p-4 sm:p-5 min-w-[150px]">
                      {editingItemId === item.id ? (
                        /* Inline Pricing Editor */
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-gray-400 font-bold shrink-0">Min:</span>
                            <input
                              type="number"
                              value={editPriceMin}
                              onChange={e => setEditPriceMin(parseInt(e.target.value) || 0)}
                              className="w-16 px-1.5 py-0.5 border border-gray-300 rounded text-xs outline-none text-gray-800"
                            />
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-gray-400 font-bold shrink-0">Max:</span>
                            <input
                              type="number"
                              value={editPriceMax || ''}
                              placeholder="None"
                              onChange={e => setEditPriceMax(e.target.value.trim() ? parseInt(e.target.value) : null)}
                              className="w-16 px-1.5 py-0.5 border border-gray-300 rounded text-xs outline-none text-gray-800"
                            />
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <button
                              onClick={() => savePriceEdit(item.id)}
                              className="p-1 bg-green-500 text-white rounded hover:bg-green-600 shadow-sm"
                              title="Save Price"
                            >
                              <Check size={12} />
                            </button>
                            <button
                              onClick={() => setEditingItemId(null)}
                              className="p-1 bg-gray-400 text-white rounded hover:bg-gray-500 shadow-sm"
                              title="Cancel"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* Normal price view */
                        <div className="flex items-center gap-2 group">
                          <span className="font-extrabold text-[#1a4a1a]">
                            ₹{item.price_min}
                            {item.price_max && item.price_max > item.price_min && ` - ₹${item.price_max}`}
                          </span>
                          <button
                            onClick={() => startEditPrice(item)}
                            className="p-1 text-gray-400 hover:text-[#1a4a1a] rounded hover:bg-gray-100 transition-colors"
                            title="Edit Pricing"
                          >
                            <Edit2 size={13} />
                          </button>
                        </div>
                      )}
                    </td>

                    {/* Available Toggle */}
                    <td className="p-4 sm:p-5">
                      <div className="flex justify-center">
                        <AdminToggle
                          checked={item.is_available}
                          onChange={() => handleToggleAvailable(item.id, item.is_available)}
                        />
                      </div>
                    </td>

                    {/* Featured Toggle */}
                    <td className="p-4 sm:p-5">
                      <div className="flex justify-center">
                        <AdminToggle
                          checked={item.is_featured}
                          onChange={() => handleToggleFeatured(item.id, item.is_featured)}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Menu Item Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-lg border border-[#1a4a1a]/15 shadow-2xl p-6 relative animate-scale-up">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-50"
            >
              <X size={20} />
            </button>

            <h2 className="text-xl font-bold text-[#1a4a1a] mb-5 border-b border-gray-100 pb-3 flex items-center gap-1.5">
              <Sparkles size={18} className="text-[#f5a623]" />
              <span>Add New Menu Item</span>
            </h2>

            <form onSubmit={handleAddItem} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#1a4a1a] mb-1.5 uppercase tracking-wide">
                  Item Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Special Thali"
                  value={newItemName}
                  onChange={e => setNewItemName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 focus:border-[#1a4a1a] rounded-xl outline-none text-sm transition-colors bg-white text-gray-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#1a4a1a] mb-1.5 uppercase tracking-wide">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={newItemCategory}
                    onChange={e => setNewItemCategory(parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-200 focus:border-[#1a4a1a] rounded-xl outline-none text-sm bg-white text-gray-800"
                  >
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-[#1a4a1a] mb-1.5 uppercase tracking-wide">
                      Min Price <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={newItemPriceMin}
                      onChange={e => setNewItemPriceMin(parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-200 focus:border-[#1a4a1a] rounded-xl outline-none text-sm bg-white text-gray-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#1a4a1a] mb-1.5 uppercase tracking-wide">
                      Max Price
                    </label>
                    <input
                      type="number"
                      min={0}
                      placeholder="None"
                      value={newItemPriceMax}
                      onChange={e => setNewItemPriceMax(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 focus:border-[#1a4a1a] rounded-xl outline-none text-sm bg-white text-gray-800"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1a4a1a] mb-1.5 uppercase tracking-wide">
                  Description
                </label>
                <textarea
                  placeholder="Tell customers about the taste, ingredients, or servings..."
                  value={newItemDesc}
                  onChange={e => setNewItemDesc(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-200 focus:border-[#1a4a1a] rounded-xl outline-none text-sm bg-white text-gray-800"
                />
              </div>

              <div className="flex gap-6 border-t border-gray-100 pt-4">
                <AdminToggle
                  checked={newItemAvailable}
                  onChange={setNewItemAvailable}
                  label="Available Now"
                />
                <AdminToggle
                  checked={newItemFeatured}
                  onChange={setNewItemFeatured}
                  label="Mark as Featured"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-gray-500 hover:text-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalSubmitting}
                  className="flex items-center gap-1.5 bg-[#1a4a1a] hover:bg-[#153b15] disabled:bg-[#1a4a1a]/60 text-white font-bold py-2.5 px-5 rounded-xl shadow-md transition-all duration-300 transform active:scale-95"
                >
                  {modalSubmitting ? (
                    <>
                      <Loader2 className="animate-spin" size={16} />
                      <span>Adding...</span>
                    </>
                  ) : (
                    <span>Add Item</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
