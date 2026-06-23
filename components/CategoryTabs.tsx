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
    <div className="sticky top-0 z-30 bg-cream-50/95 backdrop-blur-md border-b border-stone-200/70 shadow-sm">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex space-x-2 overflow-x-auto py-3 no-scrollbar scroll-smooth whitespace-nowrap">
          <button
            onClick={() => onSelectCategory(null)}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-300 flex items-center gap-1.5 focus:outline-none ${
              activeCategoryId === null
                ? 'bg-brand-600 text-white shadow-md shadow-brand-600/15 scale-105'
                : 'bg-white text-brand-700 border border-stone-200 hover:bg-brand-50 hover:border-brand-200'
            }`}
          >
            <span>🍽️</span>
            <span>All Items</span>
          </button>

          {categories
            .sort((a, b) => a.id - b.id)
            .map((category) => (
              <button
                key={category.id}
                onClick={() => onSelectCategory(category.id)}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-300 flex items-center gap-1.5 focus:outline-none ${
                  activeCategoryId === category.id
                    ? 'bg-brand-600 text-white shadow-md shadow-brand-600/15 scale-105'
                    : 'bg-white text-brand-700 border border-stone-200 hover:bg-brand-50 hover:border-brand-200'
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
