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
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/payments/schedule/${id}`);
      
      if (!response.ok) {
        throw new Error('?§Ï?Ï§?Ï°∞Ìöå ?§Ìå®');
      }

      const data = await response.json();
      setSchedules(data.schedules || []);

    } catch (error) {
      console.error('?§Ï?Ï§?Ï°∞Ìöå ?§Î•ò:', error);
    } finally {
      setLoadingSchedules(false);
    }
  };

  const loadContract = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/contracts/${id}`);
      
      if (!response.ok) {
        throw new Error('Ï°∞Ìöå ?§Ìå®');
      }

      const data = await response.json();
      setContract(data.contract);
      setEditedData(data.contract);

    } catch (error) {
      console.error('Ï°∞Ìöå ?§Î•ò:', error);
      alert('Í≥ÑÏïΩ?úÎ? Î∂àÎü¨?§Îäî???§Ìå®?àÏäµ?àÎã§.');
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
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/contracts/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editedData)
      });

      if (!response.ok) {
        throw new Error('?Ä???§Ìå®');
      }

      alert('?Ä?•Îêò?àÏäµ?àÎã§.');
      setContract(editedData);
      setEditing(false);

    } catch (error) {
      console.error('?Ä???§Î•ò:', error);
      alert('?Ä?•Ïóê ?§Ìå®?àÏäµ?àÎã§.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('?ïÎßê ??†ú?òÏãúÍ≤†Ïäµ?àÍπå?')) return;

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/contracts/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('??†ú ?§Ìå®');
      }

      alert('??†ú?òÏóà?µÎãà??');
      navigate('/contracts');

    } catch (error) {
      console.error('??†ú ?§Î•ò:', error);
      alert('??†ú???§Ìå®?àÏäµ?àÎã§.');
    }
  };

  const formatCurrency = (amount) => {
    if (!amount) return '-';
    return new Intl.NumberFormat('ko-KR').format(amount) + '??;
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
          <p style={{ color: '#6b7280', fontSize: '15px' }}>Î°úÎî© Ï§?..</p>
        </div>
      </div>
    );
  }

  if (!contract) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ?§ÎπÑÍ≤åÏù¥??*/}
      <Navigation />

      {/* Î©îÏù∏ Ïª®ÌÖêÏ∏?*/}
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* ?§Îçî */}
          <div className="p-6" style={{ background: 'linear-gradient(90deg, #249689 0%, #1e7a6f 100%)' }}>
            <div className="flex items-center justify-between text-white">
              <div>
                <h2 className="font-bold mb-1" style={{ fontSize: '24px' }}>
                  {contract.contract_number}
                </h2>
                <p style={{ fontSize: '15px', opacity: 0.9 }}>
                  ?±Î°ù?? {formatDate(contract.created_at)}
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
                      ?òÏ†ï
                    </button>
                    <button
                      onClick={handleDelete}
                      className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white font-bold rounded-lg hover:opacity-90 transition-opacity"
                      style={{ fontSize: '15px' }}
                    >
                      <Trash2 size={18} />
                      ??†ú
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
                      {saving ? '?Ä??Ï§?..' : '?Ä??}
                    </button>
                    <button
                      onClick={handleCancel}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white font-bold rounded-lg hover:opacity-90 transition-opacity"
                      style={{ fontSize: '15px' }}
                    >
                      <X size={18} />
                      Ï∑®ÏÜå
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* ?ÅÏÑ∏ ?ïÎ≥¥ */}
          <div className="p-6 space-y-6">
            {/* Í∏∞Î≥∏ ?ïÎ≥¥ */}
            <div>
              <h3 className="font-bold mb-4 pb-2 border-b" style={{ color: '#000000', fontSize: '18px' }}>
                Í∏∞Î≥∏ ?ïÎ≥¥
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InfoField
                  label="Í≥ÑÏïΩÎ™?
                  value={editing ? editedData.contract_name : contract.contract_name}
                  editing={editing}
                  onChange={(v) => setEditedData({ ...editedData, contract_name: v })}
                />
                <InfoField
                  label="Í≥ÑÏïΩ?êÎ™Ö"
                  value={editing ? editedData.contractor_name : contract.contractor_name}
                  editing={editing}
                  onChange={(v) => setEditedData({ ...editedData, contractor_name: v })}
                  required
                />
                <InfoField
                  label="?ÑÌôîÎ≤àÌò∏"
                  value={editing ? editedData.phone_number : contract.phone_number}
                  editing={editing}
                  onChange={(v) => setEditedData({ ...editedData, phone_number: v })}
                  required
                />
                <InfoField
                  label="?¥Î©î??
                  value={editing ? editedData.email : contract.email}
                  editing={editing}
                  onChange={(v) => setEditedData({ ...editedData, email: v })}
                />
              </div>
              <div className="mt-4">
                <InfoField
                  label="Ï£ºÏÜå"
                  value={editing ? editedData.address : contract.address}
                  editing={editing}
                  onChange={(v) => setEditedData({ ...editedData, address: v })}
                />
              </div>
            </div>

            {/* Í≥ÑÏïΩ ?ïÎ≥¥ */}
            <div>
              <h3 className="font-bold mb-4 pb-2 border-b" style={{ color: '#000000', fontSize: '18px' }}>
                Í≥ÑÏïΩ ?ïÎ≥¥
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InfoField
                  label="Í≥ÑÏïΩ??
                  value={editing ? editedData.contract_date : contract.contract_date}
                  editing={editing}
                  type="date"
                  onChange={(v) => setEditedData({ ...editedData, contract_date: v })}
                  required
                />
                <InfoField
                  label="?¨ÏûêÍ∏àÏï°"
                  value={editing ? editedData.amount : formatCurrency(contract.amount)}
                  editing={editing}
                  type={editing ? 'number' : 'text'}
                  onChange={(v) => setEditedData({ ...editedData, amount: v })}
                  required
                />
              </div>
            </div>

            {/* Í≤∞Ï†ú ?ïÎ≥¥ */}
            <div>
              <h3 className="font-bold mb-4 pb-2 border-b" style={{ color: '#000000', fontSize: '18px' }}>
                Í≤∞Ï†ú ?ïÎ≥¥
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <InfoField
                  label="Í≤∞Ï†ú Î∞©Î≤ï"
                  value={editing ? editedData.payment_method : contract.payment_method}
                  editing={editing}
                  onChange={(v) => setEditedData({ ...editedData, payment_method: v })}
                />
                <InfoField
                  label="Í∏àÏúµÍ∏∞Í?"
                  value={editing ? editedData.bank_name : contract.bank_name}
                  editing={editing}
                  onChange={(v) => setEditedData({ ...editedData, bank_name: v })}
                />
                <InfoField
                  label="Í≥ÑÏ¢åÎ≤àÌò∏"
                  value={editing ? editedData.account_number : contract.account_number}
                  editing={editing}
                  onChange={(v) => setEditedData({ ...editedData, account_number: v })}
                />
              </div>
              <div className="mt-4">
                <InfoField
                  label="ÏµúÏ¥à ÏßÄÍ∏âÏùº"
                  value={editing ? editedData.first_payment_date : contract.first_payment_date}
                  editing={editing}
                  type="date"
                  onChange={(v) => setEditedData({ ...editedData, first_payment_date: v })}
                />
              </div>
            </div>

            {/* Î©îÎ™® */}
            <div>
              <h3 className="font-bold mb-4 pb-2 border-b" style={{ color: '#000000', fontSize: '18px' }}>
                Î©îÎ™®
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

        {/* ÏßÄÍ∏??§Ï?Ï§?*/}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden mt-6">
          <div className="p-4 border-b flex items-center justify-between">
            <h2 className="font-bold flex items-center gap-2" style={{ color: '#000000', fontSize: '18px' }}>
              <Calendar size={20} style={{ color: '#249689' }} />
              ÏßÄÍ∏??§Ï?Ï§?
            </h2>
            {schedules.length > 0 && (
              <div className="text-sm" style={{ color: '#6b7280' }}>
                Ï¥?{schedules.length}??/ 
                ?ÑÎ£å {schedules.filter(s => s.payment_status === 'paid').length}??/ 
                ?ÄÍ∏?{schedules.filter(s => s.payment_status === 'pending').length}??
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
                  ÏßÄÍ∏??§Ï?Ï§ÑÏù¥ ?ÜÏäµ?àÎã§
                </p>
                <p style={{ color: '#6b7280', fontSize: '14px' }}>
                  Í≥ÑÏïΩ ?ïÎ≥¥Í∞Ä Î∂ÄÏ°±ÌïòÍ±∞ÎÇò ?ÑÏßÅ ?ùÏÑ±?òÏ? ?äÏïò?µÎãà??
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
                              ?ÑÎ£å
                            </span>
                          )}
                          {schedule.payment_status === 'pending' && (
                            <span className="flex items-center gap-1 px-2 py-0.5 text-xs font-bold rounded"
                                  style={{ backgroundColor: '#fef3c7', color: '#92400e' }}>
                              <Clock size={12} />
                              ?ÄÍ∏?
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
                          ?§Ï†ú: {schedule.paid_date}
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

// ?ïÎ≥¥ ?ÑÎìú Ïª¥Ìè¨?åÌä∏
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