'use client';

import { useState } from 'react';
import React from 'react';

import { MenuItem } from '@/types/menu';

interface ItemModalProps {
  item: MenuItem;
  isOpen: boolean;
  onClose: () => void;
  onAdd: (item: MenuItem, selectedAddons: string[], selectedVariation: string | null, specialInstructions: string) => void;
  preSelectedVariation?: string | null;
}

export default function ItemModal({ item, isOpen, onClose, onAdd, preSelectedVariation }: ItemModalProps) {
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  const [selectedVariation, setSelectedVariation] = useState<string | null>(preSelectedVariation || null);
  const [specialInstructions, setSpecialInstructions] = useState('');

  // Update selectedVariation when preSelectedVariation changes
  React.useEffect(() => {
    if (preSelectedVariation) {
      setSelectedVariation(preSelectedVariation);
    }
  }, [preSelectedVariation]);

  if (!isOpen) return null;

  const handleAddonToggle = (addon: string) => {
    setSelectedAddons((prev) =>
      prev.includes(addon)
        ? prev.filter((a) => a !== addon)
        : [...prev, addon]
    );
  };

  const handleAdd = () => {
    // For מאפים, require size selection
    if (item.category === 'מאפים' && !selectedVariation) {
      alert('אנא בחר גודל');
      return;
    }
    
    onAdd(item, selectedAddons, selectedVariation, specialInstructions);
    // Reset form
    setSelectedAddons([]);
    setSelectedVariation(null);
    setSpecialInstructions('');
    onClose();
    // Close category modal if exists (will be handled by parent)
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" 
      dir="rtl"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl border-2 border-blue-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-2xl font-bold text-blue-900">
              {preSelectedVariation ? `${item.name} - ${preSelectedVariation}` : item.name}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
            >
              ×
            </button>
          </div>

          {item.description && (
            <p className="text-gray-600 mb-4">{item.description}</p>
          )}

          <div className="mb-4">
            <span className="text-xl font-bold text-blue-700 bg-blue-100 px-3 py-1 rounded inline-block">
              {item.category === 'מאפים' && selectedVariation
                ? (selectedVariation === 'קטן' ? '4.50' : '8.30')
                : item.category === 'מאפים'
                ? 'בחר גודל'
                : item.price.toFixed(2)} ₪
            </span>
          </div>

          {/* For מאפים - show size selection */}
          {item.category === 'מאפים' && item.has_variations && item.variations && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                בחר גודל:
              </label>
              <div className="space-y-2">
                {item.variations.map((variation) => (
                  <label
                    key={variation}
                    className="flex items-center justify-between p-3 border-2 border-gray-200 rounded-md cursor-pointer hover:bg-blue-50 hover:border-blue-400 transition-colors"
                  >
                    <div className="flex items-center">
                      <input
                        type="radio"
                        name="variation"
                        value={variation}
                        checked={selectedVariation === variation}
                        onChange={() => setSelectedVariation(variation)}
                        className="ml-2"
                        required
                      />
                      <span className="text-lg font-semibold">{variation}</span>
                    </div>
                    <span className="text-lg font-bold text-blue-600">
                      {variation === 'קטן' ? '4.50' : '8.30'} ₪
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* For other items with variations (like סלטים) */}
          {item.has_variations && item.variations && !preSelectedVariation && item.category !== 'מאפים' && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                בחר אפשרות:
              </label>
              <div className="space-y-2">
                {item.variations.map((variation) => (
                  <label
                    key={variation}
                    className="flex items-center p-3 border rounded-md cursor-pointer hover:bg-gray-50"
                  >
                    <input
                      type="radio"
                      name="variation"
                      value={variation}
                      checked={selectedVariation === variation}
                      onChange={() => setSelectedVariation(variation)}
                      className="ml-2"
                    />
                    <span>{variation}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {preSelectedVariation && item.category !== 'מאפים' && (
            <div className="mb-4 p-3 bg-blue-50 rounded-md">
              <p className="text-sm font-medium text-gray-700 mb-1">נבחר:</p>
              <p className="text-lg font-semibold text-blue-700">{preSelectedVariation}</p>
            </div>
          )}

          {item.has_addons && item.addons && !preSelectedVariation && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                תוספות (ניתן לבחור מספר):
              </label>
              <div className="space-y-2">
                {item.addons.map((addon) => (
                  <label
                    key={addon}
                    className="flex items-center p-3 border rounded-md cursor-pointer hover:bg-gray-50"
                  >
                    <input
                      type="checkbox"
                      checked={selectedAddons.includes(addon)}
                      onChange={() => handleAddonToggle(addon)}
                      className="ml-2"
                    />
                    <span>{addon}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* For coffee - show milk type and special instructions */}
          {item.category === 'קפה' && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                סוג חלב והוראות מדויקות:
              </label>
              <textarea
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="לדוגמה: חלב סויה, ללא סוכר, כפית אחת..."
                rows={4}
              />
            </div>
          )}

          {/* For other items with addons or pre-selected variation (not מאפים, not קפה) */}
          {(preSelectedVariation || (item.has_addons && !preSelectedVariation)) && item.category !== 'קפה' && item.category !== 'מאפים' && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                הוראות מיוחדות (אופציונלי):
              </label>
              <textarea
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="לדוגמה: ללא בצל, ללא עגבניות..."
                rows={3}
              />
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border-2 border-blue-300 text-blue-700 rounded-md hover:bg-blue-50 font-medium"
            >
              ביטול
            </button>
            <button
              onClick={handleAdd}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-md hover:from-blue-700 hover:to-blue-800 font-semibold shadow-md"
            >
              הוסף לעגלה
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

