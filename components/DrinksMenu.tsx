'use client';

import { useState } from 'react';
import { useCart } from '@/contexts/CartContext';

import { MenuItem } from '@/types/menu';

interface DrinksMenuProps {
  items: MenuItem[];
  onClose: () => void;
}

export default function DrinksMenu({ items, onClose }: DrinksMenuProps) {
  const { addToCart } = useCart();
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const handleItemClick = (item: MenuItem) => {
    setSelectedItem(item);
    setShowConfirmModal(true);
  };

  const handleConfirmAdd = () => {

    if (selectedItem) {
      addToCart({
        id: selectedItem.id,
        name: selectedItem.name,
        price: selectedItem.price,
      });
      setShowConfirmModal(false);
      setSelectedItem(null);
      onClose(); // Close drinks menu and return to home
    }
  };

  return (
    <>
      <div 
        dir="rtl" 
        className="bg-white rounded-lg shadow-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">שתייה קרה</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
          >
            ×
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {items.map((item) => (
            <div
              key={item.id}
              onClick={() => handleItemClick(item)}
              className="bg-white rounded-lg shadow-md p-4 hover:shadow-xl transition-all cursor-pointer border-2 border-gray-200 hover:border-blue-400 flex flex-col items-center justify-center min-h-[120px] text-center"
            >
              <h3 className="font-semibold text-gray-900 mb-2">{item.name}</h3>
              <p className="text-lg font-bold text-blue-600 mb-2">
                {item.price.toFixed(2)} ₪
              </p>
              {item.description && (
                <p className="text-xs text-gray-600 mb-2">{item.description}</p>
              )}
              <p className="text-xs text-blue-600 font-medium mt-2">לחץ להוספה</p>
            </div>
          ))}
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && selectedItem && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" 
          dir="rtl"
          onClick={() => setShowConfirmModal(false)}
        >
          <div 
            className="bg-white rounded-lg max-w-md w-full p-6 shadow-2xl border-2 border-blue-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-2xl font-bold text-blue-900">{selectedItem.name}</h3>
              <button
                onClick={() => setShowConfirmModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
              >
                ×
              </button>
            </div>
            {selectedItem.description && (
              <p className="text-gray-600 mb-4">{selectedItem.description}</p>
            )}
            <div className="mb-4">
              <span className="text-xl font-bold text-blue-700 bg-blue-100 px-3 py-1 rounded inline-block">
                {selectedItem.price.toFixed(2)} ₪
              </span>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 px-4 py-2 border-2 border-blue-300 text-blue-700 rounded-md hover:bg-blue-50 font-medium"
              >
                ביטול
              </button>
              <button
                onClick={handleConfirmAdd}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-md hover:from-blue-700 hover:to-blue-800 font-semibold shadow-md"
              >
                הוסף לעגלה
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

