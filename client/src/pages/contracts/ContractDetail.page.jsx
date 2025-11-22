import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, X, Calendar, Check, Clock, LogOut } from 'lucide-react';
import Navigation from '../../components/Navigation.component';
import API from '../../config/api';

export default function ContractDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  // 데이터 상태
  const [contract, setContract] = useState(null);
  const [editedData, setEditedData] = useState({});
  const [schedules, setSchedules] = useState([]);
  const [contractTypes, setContractTypes] = useState([]);

  // 로딩 및 처리 상태
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadingSchedules, setLoadingSchedules] = useState(false);

  useEffect(() => {
    loadContractTypes();
    if (id) {
      loadContract();
      loadSchedules();
    }
  }, [id]);

  // 수익금이나 기타지원금이 변경되면 월지급액 자동 계산
  useEffect(() => {
    if (editedData.monthly_payment !== undefined || editedData.other_support !== undefined) {
      const monthly = Number(editedData.monthly_payment || 0);
      const support = Number(editedData.other_support || 0);
      const total = monthly + support;

      setEditedData(prev => ({
        ...prev,
        total_monthly_payment: total
      }));
    }
  }, [editedData.monthly_payment, editedData.other_support]);

  const loadContractTypes = async () => {
    try {
      const response = await fetch(`${API.CONTRACT_TYPES}`);
      if (!response.ok) throw new Error('계약 종류 조회 실패');
      const data = await response.json();
      console.log('📋 Loaded contract types:', data.types);
      setContractTypes(data.types || []);
    } catch (error) {
      console.error('계약 종류 조회 오류:', error);
    }
  };

  const loadSchedules = async () => {
    if (!id) return;

    setLoadingSchedules(true);
    try {
      const response = await fetch(`${API.PAYMENTS}/schedule/${id}`);
      if (!response.ok) throw new Error('스케줄 조회 실패');
      const data = await response.json();
      setSchedules(data.schedules || []);
    } catch (error) {
      console.error('스케줄 조회 오류:', error);
    } finally {
      setLoadingSchedules(false);
    }
  };

  const loadContract = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API.CONTRACTS}/${id}`);
      if (!response.ok) throw new Error('조회 실패');
      const data = await response.json();

      // 데이터 로드 후 editedData 초기화
      setContract(data.contract);
      setEditedData(data.contract);

    } catch (error) {
      console.error('조회 오류:', error);
      alert('계약서를 불러오는데 실패했습니다.');
      navigate('/contracts');
    } finally {
      setLoading(false);
    }
  };

  // 나가기 버튼: 목록으로 이동
  const handleExit = () => {
    if (window.confirm('작성 중인 내용이 저장되지 않습니다. 목록으로 돌아가시겠습니까?')) {
      navigate('/contracts');
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // 저장할 데이터 명시적 선택 (불필요한 관계 데이터 제거)
      const dataToSave = {
        contract_type_id: editedData.contract_type_id || contract.contract_type_id,
        contractor_name: editedData.contractor_name,
        phone_number: editedData.phone_number,
        email: editedData.email,
        address: editedData.address,
        contract_date: editedData.contract_date,
        amount: Number(editedData.amount || 0),
        monthly_payment: Number(editedData.monthly_payment || 0),
        other_support: Number(editedData.other_support || 0),
        total_monthly_payment: Number(editedData.total_monthly_payment || 0),
        recipient_name: editedData.recipient_name,
        recipient_bank: editedData.recipient_bank,
        recipient_account: editedData.recipient_account,
        memo: editedData.memo
      };

      console.log('💾 저장할 데이터:', dataToSave);

      const response = await fetch(`${API.CONTRACTS}/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(dataToSave)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '저장 실패');
      }

      const result = await response.json();
      console.log('✅ 저장 성공:', result);

      alert('저장되었습니다.');
      navigate('/contracts'); // 저장 후 목록으로 이동

    } catch (error) {
      console.error('저장 오류:', error);
      alert(`저장에 실패했습니다: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return '-';
    return new Intl.NumberFormat('ko-KR').format(amount) + '원';
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('ko-KR');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 rounded-full animate-spin mb-4"
            style={{ borderColor: '#249689', borderTopColor: 'transparent' }}>
          </div>
          <p style={{ color: '#6b7280', fontSize: '15px' }}>로딩 중..</p>
        </div>
      </div>
    );
  }

  if (!contract) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* 헤더 */}
          <div className="p-6" style={{ background: 'linear-gradient(90deg, #249689 0%, #1e7a6f 100%)' }}>
            <div className="flex items-center justify-between text-white">
              <div>
                <h2 className="font-bold mb-1" style={{ fontSize: '24px' }}>
                  {contract.contract_number}
                </h2>
                <p style={{ fontSize: '15px', opacity: 0.9 }}>
                  등록일: {formatDate(contract.created_at)}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 bg-white font-bold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                  style={{ color: '#249689', fontSize: '15px' }}
                >
                  <Save size={18} />
                  {saving ? '저장중..' : '저장'}
                </button>
                <button
                  onClick={handleExit}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white font-bold rounded-lg hover:opacity-90 transition-opacity"
                  style={{ fontSize: '15px' }}
                >
                  <LogOut size={18} />
                  나가기
                </button>
              </div>
            </div>
          </div>

          {/* 상세 정보 입력 폼 */}
          <div className="p-6 space-y-6">
            {/* 기본 정보 */}
            <div>
              <h3 className="font-bold mb-4 pb-2 border-b" style={{ color: '#000000', fontSize: '18px' }}>
                기본 정보
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ContractTypeField
                  label="계약종류"
                  value={editedData.contract_type_id}
                  contractTypes={contractTypes}
                  onChange={(v) => setEditedData({ ...editedData, contract_type_id: v })}
                  required
                />
                <InfoField
                  label="계약자명"
                  value={editedData.contractor_name}
                  onChange={(v) => setEditedData({ ...editedData, contractor_name: v })}
                  required
                />
                <InfoField
                  label="전화번호"
                  value={editedData.phone_number}
                  onChange={(v) => setEditedData({ ...editedData, phone_number: v })}
                  required
                />
                <InfoField
                  label="이메일"
                  value={editedData.email}
                  onChange={(v) => setEditedData({ ...editedData, email: v })}
                />
              </div>
              <div className="mt-4">
                <InfoField
                  label="주소"
                  value={editedData.address}
                  onChange={(v) => setEditedData({ ...editedData, address: v })}
                />
              </div>
            </div>

            {/* 계약 정보 */}
            <div>
              <h3 className="font-bold mb-4 pb-2 border-b" style={{ color: '#000000', fontSize: '18px' }}>
                계약 정보
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InfoField
                  label="계약일"
                  value={editedData.contract_date}
                  type="date"
                  onChange={(v) => setEditedData({ ...editedData, contract_date: v })}
                  required
                />
                <CurrencyField
                  label="투자금액"
                  value={editedData.amount}
                  onChange={(v) => setEditedData({ ...editedData, amount: v })}
                  required
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <CurrencyField
                  label="수익금"
                  value={editedData.monthly_payment}
                  onChange={(v) => setEditedData({ ...editedData, monthly_payment: v })}
                />
                <CurrencyField
                  label="기타지원금"
                  value={editedData.other_support}
                  onChange={(v) => setEditedData({ ...editedData, other_support: v })}
                />
                <CurrencyField
                  label="월지급액"
                  value={editedData.total_monthly_payment}
                  onChange={(v) => setEditedData({ ...editedData, total_monthly_payment: v })}
                />
              </div>
            </div>

            {/* 수령자 정보 */}
            <div>
              <h3 className="font-bold mb-4 pb-2 border-b" style={{ color: '#000000', fontSize: '18px' }}>
                수령자 정보
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <InfoField
                  label="예금주명"
                  value={editedData.recipient_name}
                  onChange={(v) => setEditedData({ ...editedData, recipient_name: v })}
                />
                <InfoField
                  label="은행명"
                  value={editedData.recipient_bank}
                  onChange={(v) => setEditedData({ ...editedData, recipient_bank: v })}
                />
                <InfoField
                  label="계좌번호"
                  value={editedData.recipient_account}
                  onChange={(v) => setEditedData({ ...editedData, recipient_account: v })}
                />
              </div>
            </div>

            {/* 메모 */}
            <div>
              <h3 className="font-bold mb-4 pb-2 border-b" style={{ color: '#000000', fontSize: '18px' }}>
                메모
              </h3>
              <InfoField
                label=""
                value={editedData.memo}
                multiline
                onChange={(v) => setEditedData({ ...editedData, memo: v })}
              />
            </div>
          </div>
        </div>

        {/* 지급 스케줄 */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden mt-6">
          <div className="p-4 border-b flex items-center justify-between">
            <h2 className="font-bold flex items-center gap-2" style={{ color: '#000000', fontSize: '18px' }}>
              <Calendar size={20} style={{ color: '#249689' }} />
              지급 스케줄
            </h2>
            {schedules.length > 0 && (
              <div className="text-sm" style={{ color: '#6b7280' }}>
                총 {schedules.length}건 /
                완료 {schedules.filter(s => s.payment_status === 'paid').length}건 /
                대기 {schedules.filter(s => s.payment_status === 'pending').length}건
              </div>
            )}
          </div>

          <div className="p-6">
            {loadingSchedules ? (
              <div className="text-center py-8">
                <div className="inline-block w-8 h-8 border-4 rounded-full animate-spin"
                  style={{ borderColor: '#249689', borderTopColor: 'transparent' }}></div>
              </div>
            ) : schedules.length === 0 ? (
              <div className="text-center py-8">
                <Calendar size={60} style={{ color: '#d1d5db' }} className="mx-auto mb-4" />
                <p className="font-bold mb-2" style={{ color: '#000000', fontSize: '16px' }}>
                  지급 스케줄이 없습니다
                </p>
                <p style={{ color: '#6b7280', fontSize: '14px' }}>
                  계약 정보가 부족하거나 아직 생성되지 않았습니다
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {schedules.map((schedule) => (
                  <div
                    key={schedule.id}
                    className="flex items-center justify-between p-4 rounded-lg border"
                    style={{
                      backgroundColor: schedule.payment_status === 'paid' ? '#f0fdf4' : '#ffffff',
                      borderColor: schedule.payment_status === 'paid' ? '#249689' : '#e5e7eb'
                    }}
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full font-bold"
                        style={{
                          backgroundColor: schedule.payment_status === 'paid' ? '#249689' : '#f3f4f6',
                          color: schedule.payment_status === 'paid' ? '#ffffff' : '#6b7280'
                        }}>
                        {schedule.payment_number}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold" style={{ color: '#000000', fontSize: '15px' }}>
                            {schedule.scheduled_date}
                          </span>
                          {/* 항상 완료로 표시 */}
                          <span className="flex items-center gap-1 px-2 py-0.5 text-xs font-bold text-white rounded"
                            style={{ backgroundColor: '#249689' }}>
                            <Check size={12} />
                            완료
                          </span>
                        </div>
                        <div style={{ color: '#6b7280', fontSize: '14px' }}>
                          {schedule.recipient_name} | {schedule.recipient_bank} {schedule.recipient_account}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold" style={{ color: '#249689', fontSize: '18px' }}>
                        {formatCurrency(schedule.amount)}
                      </div>
                      {schedule.paid_date && (
                        <div style={{ color: '#6b7280', fontSize: '13px' }}>
                          실제: {schedule.paid_date}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// 일반 입력 필드
function InfoField({ label, value, type = 'text', multiline = false, required = false, onChange }) {
  return (
    <div>
      {label && (
        <label className="block mb-2 font-bold" style={{ color: '#000000', fontSize: '15px' }}>
          {label}
          {required && <span style={{ color: '#ef4444' }} className="ml-1">*</span>}
        </label>
      )}
      {multiline ? (
        <textarea
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 focus:border-transparent"
          style={{ borderRadius: '10px', fontSize: '15px', outline: 'none', borderColor: '#249689' }}
          rows={4}
        />
      ) : (
        <input
          type={type}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 focus:border-transparent"
          style={{ borderRadius: '10px', fontSize: '15px', outline: 'none', borderColor: '#249689' }}
        />
      )}
    </div>
  );
}

// 금액 입력 필드 (자동 콤마 + "원" 표시)
function CurrencyField({ label, value, required = false, onChange }) {
  const formatNumber = (num) => {
    if (!num && num !== 0) return '';
    return new Intl.NumberFormat('ko-KR').format(num);
  };

  const handleChange = (e) => {
    const rawValue = e.target.value.replace(/,/g, '');
    if (rawValue === '') {
      onChange('');
      return;
    }
    if (!isNaN(rawValue)) {
      onChange(Number(rawValue));
    }
  };

  return (
    <div>
      {label && (
        <label className="block mb-2 font-bold" style={{ color: '#000000', fontSize: '15px' }}>
          {label}
          {required && <span style={{ color: '#ef4444' }} className="ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        <input
          type="text"
          value={formatNumber(value)}
          onChange={handleChange}
          className="w-full px-4 py-3 border border-gray-300 focus:border-transparent pr-10" // pr-10으로 오른쪽 여백 확보
          style={{ borderRadius: '10px', fontSize: '15px', outline: 'none', borderColor: '#249689' }}
          placeholder="0"
        />
        <span className="absolute right-4 top-1/2 transform -translate-y-1/2 font-bold" style={{ color: '#6b7280' }}>
          원
        </span>
      </div>
    </div>
  );
}

// 계약 종류 드롭다운
function ContractTypeField({ label, value, contractTypes, required = false, onChange }) {
  return (
    <div>
      {label && (
        <label className="block mb-2 font-bold" style={{ color: '#000000', fontSize: '15px' }}>
          {label}
          {required && <span style={{ color: '#ef4444' }} className="ml-1">*</span>}
        </label>
      )}
      <select
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-3 border border-gray-300 focus:border-transparent"
        style={{ borderRadius: '10px', fontSize: '15px', outline: 'none', borderColor: '#249689' }}
      >
        <option value="">계약 종류를 선택하세요</option>
        {contractTypes && contractTypes.length > 0 ? (
          contractTypes.map((type) => (
            <option key={type.id} value={type.id}>
              {type.name}
            </option>
          ))
        ) : (
          <option disabled>계약 종류 로딩 중...</option>
        )}
      </select>
    </div>
  );
}