'use client';

import { useState } from 'react';
import { useCart } from '@/contexts/CartContext';
import OrderSuccessModal from './OrderSuccessModal';

const MIN_ORDER_AMOUNT = 25;

export default function Cart() {
  const { cart, updateQuantity, removeItem, clearCart, totalAmount } = useCart();
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [orderId, setOrderId] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (cart.length === 0) {
      setMessage({ type: 'error', text: 'העגלה ריקה' });
      return;
    }

    if (totalAmount < MIN_ORDER_AMOUNT) {
      setMessage({
        type: 'error',
        text: `סכום מינימום להזמנה הוא ${MIN_ORDER_AMOUNT} ₪`,
      });
      return;
    }

    if (!customerName.trim()) {
      setMessage({ type: 'error', text: 'אנא הזן את שמך' });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerName: customerName.trim(),
          customerEmail: customerEmail.trim() || null,
          customerPhone: customerPhone.trim() || null,
          items: cart,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'ההזמנה נכשלה');
      }

      // Send confirmation email
      if (customerEmail.trim()) {
        try {
          await fetch('/api/orders/send-confirmation', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              orderId: data.orderId,
              customerEmail: customerEmail.trim(),
              customerName: customerName.trim(),
            }),
          });
        } catch (emailError) {
          console.error('Failed to send confirmation email:', emailError);
          // Don't fail the order if email fails
        }
      }

      // Show success modal
      setOrderId(data.orderId);
      setShowSuccessModal(true);
      clearCart();
      setCustomerName('');
      setCustomerEmail('');
      setCustomerPhone('');
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 sticky top-4 border-2 border-blue-200" dir="rtl">
      <h2 className="text-2xl font-bold mb-6 text-blue-900">עגלת קניות</h2>

      {cart.length === 0 ? (
        <p className="text-gray-600 text-center py-8">העגלה שלך ריקה</p>
      ) : (
        <>
          <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
            {cart.map((item, index) => (
              <div
                key={`${item.id}-${index}-${item.selectedVariation || ''}-${(item.selectedAddons || []).join(',')}`}
                className="border-b pb-4 last:border-b-0"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">{item.name}</h4>
                    {item.selectedAddons && item.selectedAddons.length > 0 && (
                      <p className="text-xs text-gray-500 mt-1">
                        תוספות: {item.selectedAddons.join(', ')}
                      </p>
                    )}
                    {item.specialInstructions && (
                      <p className="text-xs text-gray-500 mt-1">
                        הוראות: {item.specialInstructions}
                      </p>
                    )}
                    <p className="text-sm text-gray-600">
                      {item.price.toFixed(2)} ₪ × {item.quantity}
                    </p>
                  </div>
                  <button
                    onClick={() => removeItem(index)}
                    className="text-red-600 hover:text-red-800 mr-2"
                    aria-label="הסר פריט"
                  >
                    ×
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateQuantity(index, -1)}
                    className="bg-gray-200 text-gray-700 w-8 h-8 rounded flex items-center justify-center hover:bg-gray-300"
                  >
                    −
                  </button>
                  <span className="w-8 text-center font-medium">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(index, 1)}
                    className="bg-gray-200 text-gray-700 w-8 h-8 rounded flex items-center justify-center hover:bg-gray-300"
                  >
                    +
                  </button>
                  <span className="mr-auto font-semibold text-gray-900">
                    {(item.price * item.quantity).toFixed(2)} ₪
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="mb-6">
            <div className="flex justify-between items-center mb-2 bg-blue-50 p-3 rounded-lg">
              <span className="text-lg font-semibold text-blue-900">סה"כ:</span>
              <span className="text-xl font-bold text-blue-700">
                {totalAmount.toFixed(2)} ₪
              </span>
            </div>
            {totalAmount < MIN_ORDER_AMOUNT && (
              <p className="text-sm text-red-600 mt-2 font-medium">
                סכום מינימום: {MIN_ORDER_AMOUNT} ₪
              </p>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                שם <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="השם שלך"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                אימייל
              </label>
              <input
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="your@email.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                טלפון
              </label>
              <input
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="050-1234567"
              />
            </div>

            {message && (
              <div
                className={`p-3 rounded-md ${
                  message.type === 'success'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {message.text}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting || totalAmount < MIN_ORDER_AMOUNT}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-4 rounded-md hover:from-blue-700 hover:to-blue-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all font-semibold shadow-md hover:shadow-lg"
            >
              {isSubmitting ? 'שולח...' : 'שלח הזמנה'}
            </button>
          </form>
        </>
      )}

      <OrderSuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        orderId={orderId}
        customerName={customerName}
      />
    </div>
  );
}
