'use client';

import React from 'react';

interface Category {
  id: number;
  name: string;
  icon?: string | null;
}

interface CategoryTabsProps {
  categories: Category[];
  activeCategoryId: number | null;
  onSelectCategory: (id: number | null) => void;
}

export default function CategoryTabs({
  categories,
  activeCategoryId,
  onSelectCategory,
}: CategoryTabsProps) {
  return (
    <div className="sticky top-0 z-30 bg-[#fdfbf7]/95 backdrop-blur-md border-b border-[#1a4a1a]/10 shadow-sm transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex space-x-2 overflow-x-auto py-3 no-scrollbar scroll-smooth whitespace-nowrap">
          {/* "All" tab */}
          <button
            onClick={() => onSelectCategory(null)}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-300 flex items-center gap-1.5 focus:outline-none ${
              activeCategoryId === null
                ? 'bg-[#1a4a1a] text-white shadow-md transform scale-105'
                : 'bg-white text-[#1a4a1a] border border-[#1a4a1a]/20 hover:bg-[#1a4a1a]/5'
            }`}
          >
            🍽️ <span>All Items</span>
          </button>

          {categories
            .sort((a, b) => a.id - b.id) // Sort by ID/order
            .map((category) => (
              <button
                key={category.id}
                onClick={() => onSelectCategory(category.id)}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-300 flex items-center gap-1.5 focus:outline-none ${
                  activeCategoryId === category.id
                    ? 'bg-[#1a4a1a] text-white shadow-md transform scale-105'
                    : 'bg-white text-[#1a4a1a] border border-[#1a4a1a]/20 hover:bg-[#1a4a1a]/5'
                }`}
              >
                <span>{category.icon || '🍽️'}</span>
                <span>{category.name}</span>
              </button>
            ))}
        </div>
      </div>
    </div>
  );
}
