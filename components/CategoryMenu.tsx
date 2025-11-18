'use client';

import Image from 'next/image';
import { useState } from 'react';

interface Category {
  name: string;
  image: string;
  icon: string;
}

const categories: Category[] = [
  { name: 'סלטים', image: '/category-salad.jpg', icon: '🥗' },
  { name: 'כריכים', image: '/category-sandwich.jpg', icon: '🥪' },
  { name: 'טוסטים', image: '/category-toast.jpg', icon: '🥯' },
  { name: 'פיצה', image: '/category-pizza.jpg', icon: '🍕' },
  { name: 'מאפים', image: '/category-bakery.jpg', icon: '🥐' },
  { name: 'שתייה קרה', image: '/category-drinks.jpg', icon: '🥤' },
  { name: 'קפה', image: '/category-coffee.jpg', icon: '☕' },
  { name: 'חטיפים', image: '/category-snacks.jpg', icon: '🍫' },
];

interface CategoryMenuProps {
  onSelectCategory: (category: string) => void;
}

export default function CategoryMenu({ onSelectCategory }: CategoryMenuProps) {
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());

  const handleImageError = (categoryName: string) => {
    setImageErrors((prev) => new Set(prev).add(categoryName));
  };

  return (
    <div dir="rtl" className="bg-white rounded-lg shadow-lg p-6">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {categories.map((category) => {
          const hasError = imageErrors.has(category.name);
          return (
            <div
              key={category.name}
              onClick={() => onSelectCategory(category.name)}
              className="cursor-pointer group"
            >
              <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-all group-hover:scale-105">
                {hasError ? (
                  <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                    <span className="text-6xl">{category.icon}</span>
                  </div>
                ) : (
                  <Image
                    src={category.image}
                    alt={category.name}
                    fill
                    className="object-cover"
                    onError={() => handleImageError(category.name)}
                  />
                )}
              </div>
              <p className="text-center mt-2 font-semibold text-gray-800 group-hover:text-blue-600 transition-colors">
                {category.name}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

