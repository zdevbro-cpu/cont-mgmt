import { useEffect, useState } from 'react';
import { Download, Check, Calendar, DollarSign, Users } from 'lucide-react';
import * as XLSX from 'xlsx';
import Navigation from '../../components/Navigation.component';

export default function PaymentDashboardPage() {
  const [todayPayments, setTodayPayments] = useState([]);
  const [upcomingPayments, setUpcomingPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    today_count: 0,
    today_amount: 0,
    upcoming_count: 0,
    upcoming_amount: 0
  });

  useEffect(() => {
    loadPayments();
  }, []);

  const loadPayments = async () => {
    setLoading(true);
    try {
      // ?¤ëŠ˜ ì§€ê¸?
      const todayRes = await fetch('${import.meta.env.VITE_API_URL}/api/payments/today');
      const todayData = await todayRes.json();
      
      // 7???´ë‚´ ì§€ê¸?
      const upcomingRes = await fetch('${import.meta.env.VITE_API_URL}/api/payments/upcoming');
      const upcomingData = await upcomingRes.json();

      setTodayPayments(todayData.payments || []);
      setUpcomingPayments(upcomingData.payments || []);
      
      setStats({
        today_count: todayData.count || 0,
        today_amount: todayData.total_amount || 0,
        upcoming_count: upcomingData.count || 0,
        upcoming_amount: upcomingData.total_amount || 0
      });

    } catch (error) {
      alert('ì§€ê¸?ëª©ë¡??ë¶ˆëŸ¬?¤ëŠ”???¤íŒ¨?ˆìŠµ?ˆë‹¤.');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsPaid = async (paymentId) => {
    if (!confirm('????ª©??ì§€ê¸??„ë£Œë¡??œì‹œ?˜ì‹œê² ìŠµ?ˆê¹Œ?')) return;

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/payments/${paymentId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'paid',
          paid_date: new Date().toISOString().split('T')[0]
        })
      });

      if (!response.ok) throw new Error('?íƒœ ë³€ê²??¤íŒ¨');

      alert('ì§€ê¸??„ë£Œë¡??œì‹œ?˜ì—ˆ?µë‹ˆ??');
      loadPayments();

    } catch (error) {
      alert('?íƒœ ë³€ê²½ì— ?¤íŒ¨?ˆìŠµ?ˆë‹¤.');
    }
  };

  const handleExportToday = async () => {
    try {
      const response = await fetch('${import.meta.env.VITE_API_URL}/api/payments/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: new Date().toISOString().split('T')[0],
          status: 'pending'
        })
      });

      const result = await response.json();
      
      if (!result.data || result.data.length === 0) {
        alert('?¤ìš´ë¡œë“œ???°ì´?°ê? ?†ìŠµ?ˆë‹¤.');
        return;
      }

      // ?‘ì? ?ì„±
      const ws = XLSX.utils.json_to_sheet(result.data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, '?¤ëŠ˜ ì§€ê¸?);
      
      // ?¤ìš´ë¡œë“œ
      const today = new Date().toISOString().split('T')[0];
      XLSX.writeFile(wb, `ì§€ê¸‰ëª©ë¡?${today}.xlsx`);

    } catch (error) {
      alert('?‘ì? ?¤ìš´ë¡œë“œ???¤íŒ¨?ˆìŠµ?ˆë‹¤.');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('ko-KR').format(amount) + '??;
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f3f4f6' }}>
      {/* ?¤ë¹„ê²Œì´??*/}
      <Navigation />

      {/* ë©”ì¸ ì»¨í…ì¸?*/}
      <div className="max-w-7xl mx-auto p-6">
        {/* ?µê³„ ì¹´ë“œ */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-lg p-6" style={{ borderRadius: '10px' }}>
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold" style={{ color: '#6b7280', fontSize: '15px' }}>
                ê¸ˆì¼ ì§€ê¸??ˆìƒ??
              </span>
              <DollarSign size={24} style={{ color: '#249689' }} />
            </div>
            <p className="font-bold text-right" style={{ color: '#000000', fontSize: '28px' }}>
              {formatCurrency(stats.today_amount)}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6" style={{ borderRadius: '10px' }}>
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold" style={{ color: '#6b7280', fontSize: '15px' }}>
                ê¸ˆì¼ ì§€ê¸?ê±´ìˆ˜
              </span>
              <Calendar size={24} style={{ color: '#249689' }} />
            </div>
            <p className="font-bold text-right" style={{ color: '#000000', fontSize: '28px' }}>
              {stats.today_count.toLocaleString('ko-KR')}ê±?
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6" style={{ borderRadius: '10px' }}>
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold" style={{ color: '#6b7280', fontSize: '15px' }}>
                7???´ë‚´ ì§€ê¸??ˆìƒ??
              </span>
              <DollarSign size={24} style={{ color: '#249689' }} />
            </div>
            <p className="font-bold text-right" style={{ color: '#000000', fontSize: '28px' }}>
              {formatCurrency(stats.upcoming_amount)}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6" style={{ borderRadius: '10px' }}>
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold" style={{ color: '#6b7280', fontSize: '15px' }}>
                7???´ë‚´ ì§€ê¸?ê±´ìˆ˜
              </span>
              <Users size={24} style={{ color: '#249689' }} />
            </div>
            <p className="font-bold text-right" style={{ color: '#000000', fontSize: '28px' }}>
              {stats.upcoming_count.toLocaleString('ko-KR')}ê±?
            </p>
          </div>
        </div>

        {/* ?¤ëŠ˜ ì§€ê¸?ëª©ë¡ */}
        <div className="bg-white rounded-lg shadow-lg mb-6" style={{ borderRadius: '10px' }}>
          <div className="p-4 border-b flex items-center justify-between">
            <h2 className="font-bold" style={{ color: '#000000', fontSize: '18px' }}>
              ?¤ëŠ˜ ì§€ê¸?({todayPayments.length}ê±?
            </h2>
            <button
              onClick={handleExportToday}
              className="flex items-center gap-2 px-4 py-2 text-white font-bold rounded-lg hover:opacity-90"
              style={{ backgroundColor: '#249689', fontSize: '15px', borderRadius: '10px' }}
            >
              <Download size={18} />
              ?‘ì? ?¤ìš´ë¡œë“œ
            </button>
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-12 text-center">
                <div className="inline-block w-8 h-8 border-4 border-t-transparent rounded-full animate-spin" 
                     style={{ borderColor: '#249689' }}></div>
              </div>
            ) : todayPayments.length === 0 ? (
              <div className="p-12 text-center">
                <Calendar size={60} style={{ color: '#d1d5db' }} className="mx-auto mb-4" />
                <p className="font-bold mb-2" style={{ color: '#000000', fontSize: '18px' }}>
                  ?¤ëŠ˜ ì§€ê¸‰í•  ??ª©???†ìŠµ?ˆë‹¤
                </p>
                <p style={{ color: '#6b7280', fontSize: '15px' }}>
                  ëª¨ë“  ì§€ê¸‰ì´ ?„ë£Œ?˜ì—ˆê±°ë‚˜ ?ˆì •??ì§€ê¸‰ì´ ?†ìŠµ?ˆë‹¤
                </p>
              </div>
            ) : (
              <table className="w-full">
                <thead style={{ backgroundColor: '#f9fafb' }}>
                  <tr>
                    <th className="px-4 py-3 text-left font-bold" style={{ color: '#6b7280', fontSize: '15px' }}>ê³„ì•½ë²ˆí˜¸</th>
                    <th className="px-4 py-3 text-left font-bold" style={{ color: '#6b7280', fontSize: '15px' }}>ê³„ì•½?ëª…</th>
                    <th className="px-4 py-3 text-left font-bold" style={{ color: '#6b7280', fontSize: '15px' }}>?˜ë ¹?ëª…</th>
                    <th className="px-4 py-3 text-left font-bold" style={{ color: '#6b7280', fontSize: '15px' }}>?€??/th>
                    <th className="px-4 py-3 text-left font-bold" style={{ color: '#6b7280', fontSize: '15px' }}>ê³„ì¢Œë²ˆí˜¸</th>
                    <th className="px-4 py-3 text-right font-bold" style={{ color: '#6b7280', fontSize: '15px' }}>ì§€ê¸‰ê¸ˆ??/th>
                    <th className="px-4 py-3 text-center font-bold" style={{ color: '#6b7280', fontSize: '15px' }}>?¡ì…˜</th>
                  </tr>
                </thead>
                <tbody>
                  {todayPayments.map((payment) => (
                    <tr key={payment.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3" style={{ fontSize: '15px' }}>{payment.contracts?.contract_number}</td>
                      <td className="px-4 py-3 font-bold" style={{ fontSize: '15px' }}>{payment.contracts?.contractor_name}</td>
                      <td className="px-4 py-3" style={{ fontSize: '15px' }}>{payment.recipient_name}</td>
                      <td className="px-4 py-3" style={{ fontSize: '15px' }}>{payment.recipient_bank}</td>
                      <td className="px-4 py-3" style={{ fontSize: '15px' }}>{payment.recipient_account}</td>
                      <td className="px-4 py-3 text-right font-bold" style={{ color: '#249689', fontSize: '15px' }}>
                        {formatCurrency(payment.amount)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => handleMarkAsPaid(payment.id)}
                          className="inline-flex items-center gap-1 px-3 py-1 text-white font-bold hover:opacity-90"
                          style={{ backgroundColor: '#249689', fontSize: '14px', borderRadius: '10px' }}
                        >
                          <Check size={16} />
                          ?„ë£Œ
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* 7???´ë‚´ ì§€ê¸??ˆì • */}
        <div className="bg-white rounded-lg shadow-lg" style={{ borderRadius: '10px' }}>
          <div className="p-4 border-b">
            <h2 className="font-bold" style={{ color: '#000000', fontSize: '18px' }}>
              7???´ë‚´ ì§€ê¸??ˆì • ({upcomingPayments.length}ê±?
            </h2>
          </div>

          <div className="overflow-x-auto">
            {upcomingPayments.length === 0 ? (
              <div className="p-12 text-center">
                <Users size={60} style={{ color: '#d1d5db' }} className="mx-auto mb-4" />
                <p className="font-bold mb-2" style={{ color: '#000000', fontSize: '18px' }}>
                  7???´ë‚´ ?ˆì •??ì§€ê¸‰ì´ ?†ìŠµ?ˆë‹¤
                </p>
              </div>
            ) : (
              <table className="w-full">
                <thead style={{ backgroundColor: '#f9fafb' }}>
                  <tr>
                    <th className="px-4 py-3 text-left font-bold" style={{ color: '#6b7280', fontSize: '15px' }}>ì§€ê¸‰ì¼</th>
                    <th className="px-4 py-3 text-left font-bold" style={{ color: '#6b7280', fontSize: '15px' }}>ê³„ì•½ë²ˆí˜¸</th>
                    <th className="px-4 py-3 text-left font-bold" style={{ color: '#6b7280', fontSize: '15px' }}>ê³„ì•½?ëª…</th>
                    <th className="px-4 py-3 text-left font-bold" style={{ color: '#6b7280', fontSize: '15px' }}>?˜ë ¹?ëª…</th>
                    <th className="px-4 py-3 text-right font-bold" style={{ color: '#6b7280', fontSize: '15px' }}>ì§€ê¸‰ê¸ˆ??/th>
                  </tr>
                </thead>
                <tbody>
                  {upcomingPayments.map((payment) => (
                    <tr key={payment.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3" style={{ fontSize: '15px' }}>{payment.scheduled_date}</td>
                      <td className="px-4 py-3" style={{ fontSize: '15px' }}>{payment.contracts?.contract_number}</td>
                      <td className="px-4 py-3 font-bold" style={{ fontSize: '15px' }}>{payment.contracts?.contractor_name}</td>
                      <td className="px-4 py-3" style={{ fontSize: '15px' }}>{payment.recipient_name}</td>
                      <td className="px-4 py-3 text-right font-bold" style={{ color: '#249689', fontSize: '15px' }}>
                        {formatCurrency(payment.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}