'use client';

import { useEffect, useState } from 'react';
import { useCart } from '@/contexts/CartContext';
import ItemModal from './ItemModal';

import { MenuItem } from '@/types/menu';

interface MenuProps {
  selectedCategory?: string | null;
  onBack?: () => void;
}

export default function Menu({ selectedCategory, onBack }: MenuProps) {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { addToCart } = useCart();

  useEffect(() => {
    fetchMenuItems();
  }, []);

  const fetchMenuItems = async () => {
    try {
      const response = await fetch('/api/menu', { cache: 'no-store' });
      const data = await response.json();
      
      if (Array.isArray(data)) {
        // Parse JSONB fields
        const parsed = data.map((item: any) => ({
          ...item,
          addons: item.addons ? (typeof item.addons === 'string' ? JSON.parse(item.addons) : item.addons) : null,
          variations: item.variations ? (typeof item.variations === 'string' ? JSON.parse(item.variations) : item.variations) : null,
        }));
        setMenuItems(parsed);
      } else {
        console.error('Invalid menu data format:', data);
        setMenuItems([]);
      }
    } catch (error) {
      console.error('Error fetching menu:', error);
      setMenuItems([]);
    } finally {
      setLoading(false);
    }
  };

  const handleItemClick = (item: MenuItem) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  const handleAddToCart = (
    item: MenuItem,
    selectedAddons: string[],
    selectedVariation: string | null,
    specialInstructions: string
  ) => {
    // Create display name with addons and variations
    let displayName = item.name;
    if (selectedVariation) {
      displayName += ` - ${selectedVariation}`;
    }
    if (selectedAddons.length > 0) {
      displayName += ` (${selectedAddons.join(', ')})`;
    }

    addToCart({
      id: item.id,
      name: displayName,
      price: item.price,
      selectedAddons,
      selectedVariation,
      specialInstructions,
    });
  };

  // Category mapping for display and filtering
  const categoryMapping: Record<string, string[]> = {
    'מאפים': ['מאפה קטן', 'מאפה גדול'],
  };

  // Filter items by selected category
  const filteredItems = selectedCategory
    ? menuItems.filter(item => {
        if (categoryMapping[selectedCategory]) {
          return categoryMapping[selectedCategory].includes(item.category || '');
        }
        return item.category === selectedCategory;
      })
    : menuItems;

  if (loading) {
    return (
      <div className="text-center py-12" dir="rtl">
        <p className="text-gray-600">טוען תפריט...</p>
      </div>
    );
  }

  if (filteredItems.length === 0) {
    return (
      <div className="text-center py-12" dir="rtl">
        <p className="text-gray-600 mb-4">אין פריטים בקטגוריה זו</p>
        {onBack && (
          <button
            onClick={onBack}
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            חזור לקטגוריות
          </button>
        )}
      </div>
    );
  }

  return (
    <div dir="rtl" className="bg-white rounded-lg shadow-lg p-6">
      {selectedCategory && onBack && (
        <button
          onClick={onBack}
          className="mb-4 text-blue-600 hover:text-blue-800 font-medium flex items-center gap-2"
        >
          ← חזור לקטגוריות
        </button>
      )}
      <h2 className="text-2xl font-bold mb-6 text-center text-gray-900">
        {selectedCategory || 'תפריט'}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-lg shadow-md p-4 hover:shadow-xl transition-all cursor-pointer border border-gray-200"
            onClick={() => handleItemClick(item)}
          >
            <div className="flex justify-between items-start mb-2">
              <h4 className="text-lg font-semibold text-gray-900">
                {item.name}
              </h4>
              <span className="text-lg font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">
                {item.price.toFixed(2)} ₪
              </span>
            </div>
            {item.description && (
              <p className="text-gray-600 text-sm mb-3">
                {item.description}
              </p>
            )}
            {(item.has_addons || item.has_variations) && (
              <p className="text-xs text-blue-600 mb-2 font-medium">
                לחץ לבחירת אפשרויות
              </p>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleItemClick(item);
              }}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors font-medium"
            >
              הוסף לעגלה
            </button>
          </div>
        ))}
      </div>

      {selectedItem && (
        <ItemModal
          item={selectedItem}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedItem(null);
          }}
          onAdd={handleAddToCart}
        />
      )}
    </div>
  );
}
