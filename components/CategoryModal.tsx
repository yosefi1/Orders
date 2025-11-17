'use client';

import { useState, useEffect } from 'react';
import { useCart } from '@/contexts/CartContext';
import ItemModal from './ItemModal';

import { MenuItem } from '@/types/menu';

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  categoryName: string;
  items: MenuItem[];
  onAddToCart?: (
    item: MenuItem,
    selectedAddons: string[],
    selectedVariation: string | null,
    specialInstructions: string
  ) => void;
}

interface VariationItem {
  name: string;
  baseItem: MenuItem;
  variation: string;
}

export default function CategoryModal({
  isOpen,
  onClose,
  categoryName,
  items,
}: CategoryModalProps) {
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [selectedVariation, setSelectedVariation] = useState<string | null>(null);
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const { addToCart } = useCart();

  if (!isOpen) return null;

  // Safety check: ensure items is an array
  if (!Array.isArray(items)) {
    return null;
  }

  // Transform items: if item has variations, create separate items for each variation
  // BUT: for מאפים, don't split - show the base items and let user choose size in ItemModal
  const displayItems: (MenuItem | VariationItem)[] = [];
  items.forEach((item) => {
    if (!item) return; // Skip null/undefined items
    if (item.has_variations && item.variations && Array.isArray(item.variations) && item.variations.length > 0 && item.category !== 'מאפים') {
      // Create a separate item for each variation (for סלטים, etc.)
      item.variations.forEach((variation) => {
        displayItems.push({
          name: variation,
          baseItem: item,
          variation: variation,
        } as VariationItem);
      });
    } else {
      // Regular item without variations, or מאפים (which will show size selection in ItemModal)
      displayItems.push(item);
    }
  });

  // Special handling: if only one item and it has addons, open ItemModal directly
  // This is for טוסט which has only one option
  useEffect(() => {
    if (isOpen && items.length === 1 && items[0] && items[0].has_addons && !items[0].has_variations) {
      setSelectedItem(items[0]);
      setIsItemModalOpen(true);
    }
  }, [items, isOpen]);

  const handleItemClick = (item: MenuItem | VariationItem) => {
    if ('baseItem' in item) {
      // This is a variation item
      setSelectedItem(item.baseItem);
      setSelectedVariation(item.variation);
    } else {
      // Regular item
      setSelectedItem(item);
      setSelectedVariation(null);
    }
    setIsItemModalOpen(true);
  };

  const handleAddToCart = (
    item: MenuItem,
    selectedAddons: string[],
    selectedVariation: string | null,
    specialInstructions: string
  ) => {
    // Calculate price for מאפים based on size
    let finalPrice = item.price;
    if (item.category === 'מאפים' && selectedVariation) {
      finalPrice = selectedVariation === 'קטן' ? 4.50 : 8.30;
    }

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
      price: finalPrice,
      selectedAddons,
      selectedVariation,
      specialInstructions,
    });

    setIsItemModalOpen(false);
    setSelectedItem(null);
    setSelectedVariation(null);
    // Close category modal and return to home
    onClose();
  };

  // If only one item with addons (like טוסט), don't show the modal, just open ItemModal
  if (items.length === 1 && items[0].has_addons && !items[0].has_variations) {
    return (
      <>
        {selectedItem && (
          <ItemModal
            item={selectedItem}
            isOpen={isItemModalOpen}
            onClose={() => {
              setIsItemModalOpen(false);
              setSelectedItem(null);
              onClose();
            }}
            onAdd={(item, selectedAddons, selectedVariation, specialInstructions) => {
              handleAddToCart(item, selectedAddons, selectedVariation, specialInstructions);
              // onClose is already called in handleAddToCart
            }}
          />
        )}
      </>
    );
  }

  return (
    <>
      <div
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        dir="rtl"
        onClick={onClose}
      >
        <div
          className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">{categoryName}</h2>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 text-3xl font-bold leading-none"
              >
                ×
              </button>
            </div>

            {displayItems.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-600">אין פריטים בקטגוריה זו</p>
                <p className="text-sm text-gray-400 mt-2">קטגוריה: {categoryName}</p>
                <p className="text-sm text-gray-400">מספר פריטים שהתקבלו: {items.length}</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {displayItems.map((item, index) => {
                if (!item) return null;
                const isVariation = 'baseItem' in item;
                const displayName = isVariation ? item.name : (item as MenuItem).name;
                let price = isVariation ? (item as VariationItem).baseItem.price : (item as MenuItem).price;
                // For מאפים, show price based on variation
                if (isVariation && (item as VariationItem).baseItem.category === 'מאפים') {
                  price = (item as VariationItem).variation === 'קטן' ? 4.50 : 8.30;
                }
                const description = isVariation ? (item as VariationItem).baseItem.description : (item as MenuItem).description;
                const hasAddons = isVariation ? (item as VariationItem).baseItem.has_addons : (item as MenuItem).has_addons;
                
                return (
                  <div
                    key={isVariation ? `${(item as VariationItem).baseItem.id}-${(item as VariationItem).variation}` : (item as MenuItem).id}
                    onClick={() => handleItemClick(item)}
                    className="bg-white rounded-lg shadow-md p-4 hover:shadow-xl transition-all cursor-pointer border-2 border-gray-200 hover:border-blue-400 flex flex-col items-center justify-center min-h-[120px] text-center"
                  >
                    <h3 className="font-semibold text-gray-900 mb-2">{displayName}</h3>
                    <p className="text-lg font-bold text-blue-600 mb-2">
                      {price.toFixed(2)} ₪
                    </p>
                    {description && (
                      <p className="text-xs text-gray-600 mb-2">{description}</p>
                    )}
                    {hasAddons && (
                      <p className="text-xs text-blue-600 font-medium">לחץ לבחירה</p>
                    )}
                  </div>
                );
              })}
              </div>
            )}
          </div>
        </div>
      </div>

      {selectedItem && (
        <ItemModal
          item={selectedItem}
          isOpen={isItemModalOpen}
          onClose={() => {
            setIsItemModalOpen(false);
            setSelectedItem(null);
            setSelectedVariation(null);
          }}
          onAdd={handleAddToCart}
          preSelectedVariation={selectedVariation}
        />
      )}
    </>
  );
}

