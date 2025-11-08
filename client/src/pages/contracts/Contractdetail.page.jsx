import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit2, Save, X, Trash2, Calendar, Check, Clock } from 'lucide-react';
import Navigation from '../../components/Navigation.component';

export default function ContractDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editedData, setEditedData] = useState({});
  const [saving, setSaving] = useState(false);
  const [schedules, setSchedules] = useState([]);
  const [loadingSchedules, setLoadingSchedules] = useState(false);

  useEffect(() => {
    if (id) {
      loadContract();
      loadSchedules();
    }
  }, [id]);

  const loadSchedules = async () => {
    if (!id) return;
    
    setLoadingSchedules(true);
    try {
      const response = await fetch(`http://localhost:5000/api/payments/schedule/${id}`);
      
      if (!response.ok) {
        throw new Error('스케줄 조회 실패');
      }

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
      const response = await fetch(`http://localhost:5000/api/contracts/${id}`);
      
      if (!response.ok) {
        throw new Error('조회 실패');
      }

      const data = await response.json();
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

  const handleEdit = () => {
    setEditing(true);
  };

  const handleCancel = () => {
    setEditedData(contract);
    setEditing(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch(`http://localhost:5000/api/contracts/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editedData)
      });

      if (!response.ok) {
        throw new Error('저장 실패');
      }

      alert('저장되었습니다.');
      setContract(editedData);
      setEditing(false);

    } catch (error) {
      console.error('저장 오류:', error);
      alert('저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('정말 삭제하시겠습니까?')) return;

    try {
      const response = await fetch(`http://localhost:5000/api/contracts/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('삭제 실패');
      }

      alert('삭제되었습니다.');
      navigate('/contracts');

    } catch (error) {
      console.error('삭제 오류:', error);
      alert('삭제에 실패했습니다.');
    }
  };

  const formatCurrency = (amount) => {
    if (!amount) return '-';
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
          <p style={{ color: '#6b7280', fontSize: '15px' }}>로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!contract) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 네비게이션 */}
      <Navigation />

      {/* 메인 컨텐츠 */}
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
                {!editing ? (
                  <>
                    <button
                      onClick={handleEdit}
                      className="flex items-center gap-2 px-4 py-2 bg-white font-bold rounded-lg hover:opacity-90 transition-opacity"
                      style={{ color: '#249689', fontSize: '15px' }}
                    >
                      <Edit2 size={18} />
                      수정
                    </button>
                    <button
                      onClick={handleDelete}
                      className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white font-bold rounded-lg hover:opacity-90 transition-opacity"
                      style={{ fontSize: '15px' }}
                    >
                      <Trash2 size={18} />
                      삭제
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="flex items-center gap-2 px-4 py-2 bg-white font-bold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                      style={{ color: '#249689', fontSize: '15px' }}
                    >
                      <Save size={18} />
                      {saving ? '저장 중...' : '저장'}
                    </button>
                    <button
                      onClick={handleCancel}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white font-bold rounded-lg hover:opacity-90 transition-opacity"
                      style={{ fontSize: '15px' }}
                    >
                      <X size={18} />
                      취소
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* 상세 정보 */}
          <div className="p-6 space-y-6">
            {/* 기본 정보 */}
            <div>
              <h3 className="font-bold mb-4 pb-2 border-b" style={{ color: '#000000', fontSize: '18px' }}>
                기본 정보
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InfoField
                  label="계약명"
                  value={editing ? editedData.contract_name : contract.contract_name}
                  editing={editing}
                  onChange={(v) => setEditedData({ ...editedData, contract_name: v })}
                />
                <InfoField
                  label="계약자명"
                  value={editing ? editedData.contractor_name : contract.contractor_name}
                  editing={editing}
                  onChange={(v) => setEditedData({ ...editedData, contractor_name: v })}
                  required
                />
                <InfoField
                  label="전화번호"
                  value={editing ? editedData.phone_number : contract.phone_number}
                  editing={editing}
                  onChange={(v) => setEditedData({ ...editedData, phone_number: v })}
                  required
                />
                <InfoField
                  label="이메일"
                  value={editing ? editedData.email : contract.email}
                  editing={editing}
                  onChange={(v) => setEditedData({ ...editedData, email: v })}
                />
              </div>
              <div className="mt-4">
                <InfoField
                  label="주소"
                  value={editing ? editedData.address : contract.address}
                  editing={editing}
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
                  value={editing ? editedData.contract_date : contract.contract_date}
                  editing={editing}
                  type="date"
                  onChange={(v) => setEditedData({ ...editedData, contract_date: v })}
                  required
                />
                <InfoField
                  label="투자금액"
                  value={editing ? editedData.amount : formatCurrency(contract.amount)}
                  editing={editing}
                  type={editing ? 'number' : 'text'}
                  onChange={(v) => setEditedData({ ...editedData, amount: v })}
                  required
                />
              </div>
            </div>

            {/* 결제 정보 */}
            <div>
              <h3 className="font-bold mb-4 pb-2 border-b" style={{ color: '#000000', fontSize: '18px' }}>
                결제 정보
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <InfoField
                  label="결제 방법"
                  value={editing ? editedData.payment_method : contract.payment_method}
                  editing={editing}
                  onChange={(v) => setEditedData({ ...editedData, payment_method: v })}
                />
                <InfoField
                  label="금융기관"
                  value={editing ? editedData.bank_name : contract.bank_name}
                  editing={editing}
                  onChange={(v) => setEditedData({ ...editedData, bank_name: v })}
                />
                <InfoField
                  label="계좌번호"
                  value={editing ? editedData.account_number : contract.account_number}
                  editing={editing}
                  onChange={(v) => setEditedData({ ...editedData, account_number: v })}
                />
              </div>
              <div className="mt-4">
                <InfoField
                  label="최초 지급일"
                  value={editing ? editedData.first_payment_date : contract.first_payment_date}
                  editing={editing}
                  type="date"
                  onChange={(v) => setEditedData({ ...editedData, first_payment_date: v })}
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
                value={editing ? editedData.memo : contract.memo}
                editing={editing}
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
                총 {schedules.length}회 / 
                완료 {schedules.filter(s => s.payment_status === 'paid').length}회 / 
                대기 {schedules.filter(s => s.payment_status === 'pending').length}회
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
                {schedules.map((schedule, index) => (
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
                          {schedule.payment_status === 'paid' && (
                            <span className="flex items-center gap-1 px-2 py-0.5 text-xs font-bold text-white rounded"
                                  style={{ backgroundColor: '#249689' }}>
                              <Check size={12} />
                              완료
                            </span>
                          )}
                          {schedule.payment_status === 'pending' && (
                            <span className="flex items-center gap-1 px-2 py-0.5 text-xs font-bold rounded"
                                  style={{ backgroundColor: '#fef3c7', color: '#92400e' }}>
                              <Clock size={12} />
                              대기
                            </span>
                          )}
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

// 정보 필드 컴포넌트
function InfoField({ label, value, editing, type = 'text', multiline = false, required = false, onChange }) {
  if (!editing) {
    return (
      <div>
        {label && (
          <label className="block mb-2 font-bold" style={{ color: '#6b7280', fontSize: '15px' }}>
            {label}
            {required && <span style={{ color: '#ef4444' }} className="ml-1">*</span>}
          </label>
        )}
        <div className="px-4 py-3 bg-gray-50 rounded-lg" style={{ fontSize: '15px', color: '#000000' }}>
          {multiline ? (
            <div className="whitespace-pre-wrap">{value || '-'}</div>
          ) : (
            value || '-'
          )}
        </div>
      </div>
    );
  }

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