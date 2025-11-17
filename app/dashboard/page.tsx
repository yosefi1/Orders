'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

interface OrderItem {
  quantity: number;
  price: number;
  selected_addons: any;
  selected_variation: string | null;
  special_instructions: string | null;
  menu_items: {
    name: string;
  };
}

interface Order {
  id: string;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string | null;
  total_amount: number;
  status: string;
  order_date: string;
  created_at: string;
  order_items: OrderItem[];
}

export default function Dashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterDate, setFilterDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const router = useRouter();

  useEffect(() => {
    fetchOrders();
  }, [filterDate]);

  const fetchOrders = async () => {
    try {
      const response = await fetch(`/api/orders?date=${filterDate}`);
      const data = await response.json();
      // Ensure data is always an array
      if (Array.isArray(data)) {
        setOrders(data);
      } else if (data.error) {
        console.error('API Error:', data.error);
        setOrders([]);
      } else {
        setOrders([]);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('he-IL', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const totalAmount = Array.isArray(orders) 
    ? orders.reduce((sum, order) => sum + parseFloat(order.total_amount.toString()), 0)
    : 0;

  return (
    <main className="min-h-screen bg-gray-50" dir="rtl">
      {/* Header */}
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
                לוח בקרה - הזמנות
              </h1>
            </div>
            <button
              onClick={() => router.push('/')}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
            >
              חזור לאתר
            </button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-gray-700">
              סינון לפי תאריך:
            </label>
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="mr-auto">
              <span className="text-lg font-semibold text-blue-900">
                סה"כ הזמנות: {orders.length} | סה"כ סכום: {totalAmount.toFixed(2)} ₪
              </span>
            </div>
          </div>
        </div>

        {/* Orders List */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">טוען הזמנות...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-lg">
            <p className="text-gray-600">אין הזמנות לתאריך זה</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="bg-white rounded-lg shadow-lg p-6 border-2 border-blue-200">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      הזמנה #{order.id.slice(0, 8)}
                    </h3>
                    <p className="text-sm text-gray-600">
                      <strong>שם:</strong> {order.customer_name}
                    </p>
                    {order.customer_email && (
                      <p className="text-sm text-gray-600">
                        <strong>אימייל:</strong> {order.customer_email}
                      </p>
                    )}
                    {order.customer_phone && (
                      <p className="text-sm text-gray-600">
                        <strong>טלפון:</strong> {order.customer_phone}
                      </p>
                    )}
                    <p className="text-sm text-gray-600">
                      <strong>תאריך:</strong> {formatDate(order.created_at)}
                    </p>
                    <p className="text-sm text-gray-600">
                      <strong>סטטוס:</strong>{' '}
                      <span className={`px-2 py-1 rounded ${
                        order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        order.status === 'completed' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {order.status === 'pending' ? 'ממתין' : order.status === 'completed' ? 'הושלם' : order.status}
                      </span>
                    </p>
                  </div>
                  <div className="text-left">
                    <p className="text-2xl font-bold text-blue-600">
                      {parseFloat(order.total_amount.toString()).toFixed(2)} ₪
                    </p>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-semibold text-gray-900 mb-2">פריטים:</h4>
                  <div className="space-y-2">
                    {order.order_items.map((item, index) => (
                      <div key={index} className="bg-gray-50 p-3 rounded">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">
                              {item.menu_items.name} × {item.quantity}
                            </p>
                            {item.selected_variation && (
                              <p className="text-sm text-gray-600">
                                אפשרות: {item.selected_variation}
                              </p>
                            )}
                            {item.selected_addons && Array.isArray(item.selected_addons) && item.selected_addons.length > 0 && (
                              <p className="text-sm text-gray-600">
                                תוספות: {item.selected_addons.join(', ')}
                              </p>
                            )}
                            {item.special_instructions && (
                              <p className="text-sm text-gray-600">
                                הוראות: {item.special_instructions}
                              </p>
                            )}
                          </div>
                          <p className="font-semibold text-gray-900">
                            {(parseFloat(item.price.toString()) * item.quantity).toFixed(2)} ₪
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

