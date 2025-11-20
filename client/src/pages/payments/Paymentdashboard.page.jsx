import { useEffect, useState } from 'react';
import { Download, Check, Calendar, DollarSign, Users } from 'lucide-react';
import * as XLSX from 'xlsx';
import Navigation from '../../components/Navigation.component';
import { API } from '../../config/api';

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
      // 오늘 지급
      const todayRes = await fetch(`${API.PAYMENTS}/today`);
      const todayData = await todayRes.json();

      // 7일 이내 지급
      const upcomingRes = await fetch(`${API.PAYMENTS}/upcoming`);
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
      console.error('지급 목록 로드 실패:', error);
      alert('지급 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsPaid = async (paymentId) => {
    if (!confirm('이 항목을 지급 완료로 표시하시겠습니까?')) return;

    try {
      const response = await fetch(`${API.PAYMENTS}/${paymentId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'paid',
          paid_date: new Date().toISOString().split('T')[0]
        })
      });

      if (!response.ok) throw new Error('상태 변경 실패');

      alert('지급 완료로 표시되었습니다.');
      loadPayments();

    } catch (error) {
      console.error('상태 변경 실패:', error);
      alert('상태 변경에 실패했습니다.');
    }
  };

  const handleExportToday = async () => {
    try {
      const response = await fetch(`${API.PAYMENTS}/export`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: new Date().toISOString().split('T')[0],
          status: 'pending'
        })
      });

      const result = await response.json();

      if (!result.data || result.data.length === 0) {
        alert('다운로드할 데이터가 없습니다.');
        return;
      }

      // 엑셀 생성
      const ws = XLSX.utils.json_to_sheet(result.data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, '오늘 지급');

      // 다운로드
      const today = new Date().toISOString().split('T')[0];
      XLSX.writeFile(wb, `지급목록_${today}.xlsx`);

    } catch (error) {
      console.error('엑셀 다운로드 실패:', error);
      alert('엑셀 다운로드에 실패했습니다.');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('ko-KR').format(amount) + '원';
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f3f4f6' }}>
      {/* 네비게이션 */}
      <Navigation />

      {/* 메인 컨텐츠 */}
      <div className="max-w-7xl mx-auto p-6">
        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-lg p-6" style={{ borderRadius: '10px' }}>
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold" style={{ color: '#6b7280', fontSize: '15px' }}>
                금일 지급 예상액
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
                금일 지급 건수
              </span>
              <Calendar size={24} style={{ color: '#249689' }} />
            </div>
            <p className="font-bold text-right" style={{ color: '#000000', fontSize: '28px' }}>
              {stats.today_count.toLocaleString('ko-KR')}건
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6" style={{ borderRadius: '10px' }}>
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold" style={{ color: '#6b7280', fontSize: '15px' }}>
                7일 이내 지급 예상액
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
                7일 이내 지급 건수
              </span>
              <Users size={24} style={{ color: '#249689' }} />
            </div>
            <p className="font-bold text-right" style={{ color: '#000000', fontSize: '28px' }}>
              {stats.upcoming_count.toLocaleString('ko-KR')}건
            </p>
          </div>
        </div>

        {/* 오늘 지급 목록 */}
        <div className="bg-white rounded-lg shadow-lg mb-6" style={{ borderRadius: '10px' }}>
          <div className="p-4 border-b flex items-center justify-between">
            <h2 className="font-bold" style={{ color: '#000000', fontSize: '18px' }}>
              오늘 지급 ({todayPayments.length}건)
            </h2>
            <button
              onClick={handleExportToday}
              className="flex items-center gap-2 px-4 py-2 text-white font-bold rounded-lg hover:opacity-90"
              style={{ backgroundColor: '#249689', fontSize: '15px', borderRadius: '10px' }}
            >
              <Download size={18} />
              엑셀 다운로드
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
                  오늘 지급할 항목이 없습니다
                </p>
                <p style={{ color: '#6b7280', fontSize: '15px' }}>
                  모든 지급이 완료되었거나 예정된 지급이 없습니다
                </p>
              </div>
            ) : (
              <table className="w-full">
                <thead style={{ backgroundColor: '#f9fafb' }}>
                  <tr>
                    <th className="px-4 py-3 text-left font-bold" style={{ color: '#6b7280', fontSize: '15px' }}>계약번호</th>
                    <th className="px-4 py-3 text-left font-bold" style={{ color: '#6b7280', fontSize: '15px' }}>계약자명</th>
                    <th className="px-4 py-3 text-left font-bold" style={{ color: '#6b7280', fontSize: '15px' }}>수령자명</th>
                    <th className="px-4 py-3 text-left font-bold" style={{ color: '#6b7280', fontSize: '15px' }}>은행</th>
                    <th className="px-4 py-3 text-left font-bold" style={{ color: '#6b7280', fontSize: '15px' }}>계좌번호</th>
                    <th className="px-4 py-3 text-right font-bold" style={{ color: '#6b7280', fontSize: '15px' }}>지급금액</th>
                    <th className="px-4 py-3 text-center font-bold" style={{ color: '#6b7280', fontSize: '15px' }}>액션</th>
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
                          완료
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* 7일 이내 지급 예정 */}
        <div className="bg-white rounded-lg shadow-lg" style={{ borderRadius: '10px' }}>
          <div className="p-4 border-b">
            <h2 className="font-bold" style={{ color: '#000000', fontSize: '18px' }}>
              7일 이내 지급 예정 ({upcomingPayments.length}건)
            </h2>
          </div>

          <div className="overflow-x-auto">
            {upcomingPayments.length === 0 ? (
              <div className="p-12 text-center">
                <Users size={60} style={{ color: '#d1d5db' }} className="mx-auto mb-4" />
                <p className="font-bold mb-2" style={{ color: '#000000', fontSize: '18px' }}>
                  7일 이내 예정된 지급이 없습니다
                </p>
              </div>
            ) : (
              <table className="w-full">
                <thead style={{ backgroundColor: '#f9fafb' }}>
                  <tr>
                    <th className="px-4 py-3 text-left font-bold" style={{ color: '#6b7280', fontSize: '15px' }}>지급일</th>
                    <th className="px-4 py-3 text-left font-bold" style={{ color: '#6b7280', fontSize: '15px' }}>계약번호</th>
                    <th className="px-4 py-3 text-left font-bold" style={{ color: '#6b7280', fontSize: '15px' }}>계약자명</th>
                    <th className="px-4 py-3 text-left font-bold" style={{ color: '#6b7280', fontSize: '15px' }}>수령자명</th>
                    <th className="px-4 py-3 text-right font-bold" style={{ color: '#6b7280', fontSize: '15px' }}>지급금액</th>
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