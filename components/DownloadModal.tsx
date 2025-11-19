'use client';

interface DownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  filterDate: string;
}

export default function DownloadModal({ isOpen, onClose, filterDate }: DownloadModalProps) {
  if (!isOpen) return null;

  const handleDownload = (format: 'excel' | 'word') => {
    const url = `/api/orders/download?date=${filterDate}&format=${format}`;
    window.open(url, '_blank');
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" 
      dir="rtl"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg max-w-md w-full p-6 shadow-2xl border-2 border-blue-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-2xl font-bold text-gray-900">הורדת הזמנות</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
          >
            ×
          </button>
        </div>
        <p className="text-gray-600 mb-4">בחר פורמט להורדה:</p>
        <div className="space-y-3">
          <button
            onClick={() => handleDownload('excel')}
            className="w-full px-4 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 font-semibold shadow-md flex items-center justify-center gap-2"
          >
            <span>📊</span>
            Excel (.xlsx)
          </button>
          <button
            onClick={() => handleDownload('word')}
            className="w-full px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-semibold shadow-md flex items-center justify-center gap-2"
          >
            <span>📄</span>
            Word (.docx)
          </button>
        </div>
        <button
          onClick={onClose}
          className="w-full mt-4 px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 font-medium"
        >
          ביטול
        </button>
      </div>
    </div>
  );
}

