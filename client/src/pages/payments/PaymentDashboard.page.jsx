import { useEffect, useState } from 'react';
import { Download, Check, Calendar, Users } from 'lucide-react';
import Navigation from '../../components/Navigation.component';
import { API } from '../../config/api';

export default function PaymentDashboardPage() {
  const [upcomingPayments, setUpcomingPayments] = useState([]);
  const [selectedDatePayments, setSelectedDatePayments] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');

  useEffect(() => {
    loadPayments();
  }, []);

  const loadPayments = async () => {
    try {
      const upcomingRes = await fetch(`${API.PAYMENTS}/upcoming`);
      const upcomingData = await upcomingRes.json();

      setUpcomingPayments(upcomingData.payments || []);

    } catch (error) {
      console.error('지급 목록 로드 오류:', error);
      alert('지급 목록을 불러오는데 실패했습니다.');
    }
  };

  const loadPaymentsByDate = async (date) => {
    if (!date) {
      setSelectedDatePayments([]);
      return;
    }

    try {
      const response = await fetch(`${API.PAYMENTS}/by-date?date=${date}`);
      const data = await response.json();
      setSelectedDatePayments(data.payments || []);
    } catch (error) {
      console.error('날짜별 지급 목록 로드 오류:', error);
      alert('지급 목록을 불러오는데 실패했습니다.');
    }
  };

  const handleDateChange = (e) => {
    const date = e.target.value;
    setSelectedDate(date);
    loadPaymentsByDate(date);
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
      if (selectedDate) {
        loadPaymentsByDate(selectedDate);
      }

    } catch (error) {
      console.error('상태 변경 실패:', error);
      alert('상태 변경에 실패했습니다.');
    }
  };

  const handleExportSelectedDate = () => {
    if (!selectedDate || selectedDatePayments.length === 0) {
      alert('다운로드할 데이터가 없습니다.');
      return;
    }

    try {
      // CSV 형식으로 데이터 준비
      const csvData = selectedDatePayments.map(payment => {
        // 지급액 자릿수 포맷 적용 (쉼표 추가)
        const formattedAmount = new Intl.NumberFormat('ko-KR').format(payment.amount || 0);

        return {
          '계약일': payment.contracts?.contract_date || '-',
          '지급일': payment.scheduled_date || '-',
          '계약종류': payment.contracts?.contract_types?.name || '-',
          '계약자명': payment.contracts?.contractor_name || '-',
          '지급액': formattedAmount,
          '예금주명': payment.recipient_name || '-',
          '은행명': payment.recipient_bank || '-',
          '계좌번호': payment.recipient_account || '-'
        };
      });

      // CSV 문자열 생성
      const headers = ['계약일', '지급일', '계약종류', '계약자명', '지급액', '예금주명', '은행명', '계좌번호'];
      const csvContent = [
        headers.join(','),
        ...csvData.map(row => headers.map(header => {
          const value = row[header];
          // 쉼표나 따옴표가 포함된 경우 처리
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        }).join(','))
      ].join('\n');

      // BOM 추가 (한글 깨짐 방지)
      const BOM = '\uFEFF';
      const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });

      // 다운로드
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `지급목록_${selectedDate}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

    } catch (error) {
      console.error('CSV 다운로드 오류:', error);
      alert('CSV 다운로드에 실패했습니다.');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('ko-KR').format(amount) + '원';
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f3f4f6' }}>
      <Navigation />

      <div className="max-w-7xl mx-auto p-6">
        {/* 날짜별 지급 섹션 */}
        <div className="bg-white rounded-lg shadow-lg mb-6" style={{ borderRadius: '10px' }}>
          <div className="p-4 border-b">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold" style={{ color: '#000000', fontSize: '18px' }}>
                날짜별 지급 ({selectedDatePayments.length}건)
              </h2>
              <input
                type="date"
                value={selectedDate}
                onChange={handleDateChange}
                className="px-3 py-2 border rounded-lg"
                style={{ fontSize: '15px' }}
              />
            </div>
            {selectedDate && selectedDatePayments.length > 0 && (
              <div className="flex justify-end">
                <button
                  onClick={handleExportSelectedDate}
                  className="flex items-center gap-2 px-4 py-2 text-white font-bold rounded-lg hover:opacity-90"
                  style={{ backgroundColor: '#249689', fontSize: '15px', borderRadius: '10px' }}
                >
                  <Download size={18} />
                  CSV 다운로드
                </button>
              </div>
            )}
          </div>

          {selectedDate && (
            <div className="overflow-x-auto">
              {selectedDatePayments.length === 0 ? (
                <div className="p-12 text-center">
                  <Calendar size={60} style={{ color: '#d1d5db' }} className="mx-auto mb-4" />
                  <p className="font-bold mb-2" style={{ color: '#000000', fontSize: '18px' }}>
                    선택한 날짜에 지급할 항목이 없습니다
                  </p>
                </div>
              ) : (
                <table className="w-full">
                  <thead style={{ backgroundColor: '#f9fafb' }}>
                    <tr>
                      <th className="px-4 py-3 text-left font-bold" style={{ color: '#6b7280', fontSize: '15px' }}>계약종류</th>
                      <th className="px-4 py-3 text-left font-bold" style={{ color: '#6b7280', fontSize: '15px' }}>계약일</th>
                      <th className="px-4 py-3 text-left font-bold" style={{ color: '#6b7280', fontSize: '15px' }}>계약자명</th>
                      <th className="px-4 py-3 text-left font-bold" style={{ color: '#6b7280', fontSize: '15px' }}>예금주명</th>
                      <th className="px-4 py-3 text-left font-bold" style={{ color: '#6b7280', fontSize: '15px' }}>은행명</th>
                      <th className="px-4 py-3 text-left font-bold" style={{ color: '#6b7280', fontSize: '15px' }}>계좌번호</th>
                      <th className="px-4 py-3 text-right font-bold" style={{ color: '#6b7280', fontSize: '15px' }}>지급금액</th>
                      <th className="px-4 py-3 text-center font-bold" style={{ color: '#6b7280', fontSize: '15px' }}>액션</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedDatePayments.map((payment) => (
                      <tr key={payment.id} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-3" style={{ fontSize: '15px' }}>{payment.contracts?.contract_types?.name || '-'}</td>
                        <td className="px-4 py-3" style={{ fontSize: '15px' }}>{payment.contracts?.contract_date}</td>
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
          )}
        </div>

        {/* 7일 이내 지급 예정 섹션 */}
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
                    <th className="px-4 py-3 text-left font-bold" style={{ color: '#6b7280', fontSize: '15px' }}>계약종류</th>
                    <th className="px-4 py-3 text-left font-bold" style={{ color: '#6b7280', fontSize: '15px' }}>계약일</th>
                    <th className="px-4 py-3 text-left font-bold" style={{ color: '#6b7280', fontSize: '15px' }}>계약자명</th>
                    <th className="px-4 py-3 text-left font-bold" style={{ color: '#6b7280', fontSize: '15px' }}>예금주명</th>
                    <th className="px-4 py-3 text-left font-bold" style={{ color: '#6b7280', fontSize: '15px' }}>은행명</th>
                    <th className="px-4 py-3 text-left font-bold" style={{ color: '#6b7280', fontSize: '15px' }}>계좌번호</th>
                    <th className="px-4 py-3 text-right font-bold" style={{ color: '#6b7280', fontSize: '15px' }}>지급금액</th>
                  </tr>
                </thead>
                <tbody>
                  {upcomingPayments.map((payment) => (
                    <tr key={payment.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3" style={{ fontSize: '15px' }}>{payment.scheduled_date}</td>
                      <td className="px-4 py-3" style={{ fontSize: '15px' }}>{payment.contracts?.contract_types?.name || '-'}</td>
                      <td className="px-4 py-3" style={{ fontSize: '15px' }}>{payment.contracts?.contract_date}</td>
                      <td className="px-4 py-3 font-bold" style={{ fontSize: '15px' }}>{payment.contracts?.contractor_name}</td>
                      <td className="px-4 py-3" style={{ fontSize: '15px' }}>{payment.recipient_name}</td>
                      <td className="px-4 py-3" style={{ fontSize: '15px' }}>{payment.recipient_bank}</td>
                      <td className="px-4 py-3" style={{ fontSize: '15px' }}>{payment.recipient_account}</td>
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
