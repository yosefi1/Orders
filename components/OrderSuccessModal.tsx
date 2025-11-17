'use client';

interface OrderSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  customerName: string;
}

export default function OrderSuccessModal({ isOpen, onClose, orderId, customerName }: OrderSuccessModalProps) {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" 
      dir="rtl"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg max-w-md w-full p-6 shadow-2xl border-2 border-green-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center">
          <div className="mb-4">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            ההזמנה התקבלה בהצלחה!
          </h3>
          <p className="text-gray-600 mb-4">
            תודה {customerName}, ההזמנה שלך התקבלה.
          </p>
          <p className="text-sm text-gray-500 mb-4">
            מספר הזמנה: {orderId.slice(0, 8)}
          </p>
          <p className="text-sm text-gray-600 mb-6">
            נשלח אליך מייל עם פרטי ההזמנה
          </p>
          <button
            onClick={onClose}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-4 rounded-md hover:from-blue-700 hover:to-blue-800 font-semibold shadow-md"
          >
            סגור
          </button>
        </div>
      </div>
    </div>
  );
}

