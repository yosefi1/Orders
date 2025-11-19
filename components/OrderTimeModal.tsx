'use client';

interface OrderTimeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function OrderTimeModal({ isOpen, onClose }: OrderTimeModalProps) {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" 
      dir="rtl"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg max-w-md w-full shadow-2xl border-2 border-red-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-2xl font-bold text-red-600">
              ⏰ הזמנות להיום נגמרו
            </h3>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
            >
              ×
            </button>
          </div>

          <div className="mb-6">
            <p className="text-gray-700 text-lg">
              ההזמנות להיום נגמרו בשעה 10:30.
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 font-semibold"
          >
            הבנתי
          </button>
        </div>
      </div>
    </div>
  );
}

