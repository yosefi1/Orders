'use client';

export default function InfoSection() {
  return (
    <div className="bg-white rounded-lg shadow-lg p-6" dir="rtl">
      <h3 className="text-xl font-bold text-yellow-600 mb-4">איך זה עובד?</h3>
      <ul className="space-y-3 text-gray-700">
        <li className="flex items-start">
          <span className="text-blue-600 font-bold ml-2">•</span>
          <span>מזמינים דרך האתר עד השעה 10:30</span>
        </li>
        <li className="flex items-start">
          <span className="text-blue-600 font-bold ml-2">•</span>
          <span>מינימום הזמנה 25 ₪</span>
        </li>
        <li className="flex items-start">
          <span className="text-blue-600 font-bold ml-2">•</span>
          <span>ההזמנות יגיעו סביב השעה 12:15 בשקית ארוזה עם שם המזמין + סכום התשלום</span>
        </li>
        <li className="flex items-start">
          <span className="text-blue-600 font-bold ml-2">•</span>
          <span>השליח יגיע עם מסופון לחיוב באשראי</span>
        </li>
      </ul>
    </div>
  );
}

