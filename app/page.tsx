'use client';

import { useState, useEffect } from 'react';
import Cart from "@/components/Cart";
import InfoSection from "@/components/InfoSection";
import CategoryMenu from "@/components/CategoryMenu";
import CategoryModal from "@/components/CategoryModal";
import DrinksMenu from "@/components/DrinksMenu";
import Image from "next/image";

import { MenuItem } from '@/types/menu';

export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMenuItems();
  }, []);

  const fetchMenuItems = async () => {
    try {
      const response = await fetch('/api/menu');
      const data = await response.json();
      
      if (Array.isArray(data)) {
        const parsed = data.map((item: any) => ({
          ...item,
          addons: item.addons ? (typeof item.addons === 'string' ? JSON.parse(item.addons) : item.addons) : item.addons,
          variations: item.variations ? (typeof item.variations === 'string' ? JSON.parse(item.variations) : item.variations) : item.variations,
        }));
        setMenuItems(parsed);
      } else {
        setMenuItems([]);
      }
    } catch (error) {
      console.error('Error fetching menu:', error);
      setMenuItems([]);
    } finally {
      setLoading(false);
    }
  };


  // Category mapping for filtering
  const categoryMapping: Record<string, string[]> = {
    'מאפים': ['מאפים'], // All items with category 'מאפים'
  };

  // Get items for selected category
  const getCategoryItems = (categoryName: string): MenuItem[] => {
    if (categoryMapping[categoryName]) {
      return menuItems.filter(item =>
        categoryMapping[categoryName].includes(item.category || '')
      );
    }
    return menuItems.filter(item => item.category === categoryName);
  };

  return (
    <main className="min-h-screen bg-gray-50" dir="rtl">
      {/* Header with Logo and Title */}
      <header className="bg-white border-b border-gray-200 py-4 px-4">
        <div className="container mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Image
                src="/LOGO_MENU.png"
                alt="alterams logo"
                width={120}
                height={60}
                className="object-contain"
                priority
              />
            </div>
            <div className="text-center flex-1">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">
                פיילוט מכירה
              </h1>
              <h2 className="text-lg md:text-xl font-semibold text-gray-600">
                מקפיטריית אינטל
              </h2>
            </div>
            <div className="w-[120px] flex justify-end">
              <a
                href="/dashboard"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium text-sm"
              >
                הזמנות
              </a>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <InfoSection />
            <CategoryMenu onSelectCategory={(cat) => setSelectedCategory(cat)} />
            
            {selectedCategory && selectedCategory !== 'שתייה קרה' && (
              <CategoryModal
                key={selectedCategory} // Force re-render when category changes
                isOpen={!!selectedCategory}
                onClose={() => setSelectedCategory(null)}
                categoryName={selectedCategory}
                items={getCategoryItems(selectedCategory)}
              />
            )}

            {/* שתייה קרה - מציג ישר את כל הפריטים */}
            {selectedCategory === 'שתייה קרה' && (
              <div 
                className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" 
                dir="rtl"
                onClick={() => setSelectedCategory(null)}
              >
                <DrinksMenu
                  items={getCategoryItems('שתייה קרה')}
                  onClose={() => setSelectedCategory(null)}
                />
              </div>
            )}
          </div>
          <div className="lg:col-span-1">
            <Cart />
          </div>
        </div>
      </div>
    </main>
  );
}

