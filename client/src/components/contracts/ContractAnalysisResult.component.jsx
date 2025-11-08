import { useState } from 'react';
import { CheckCircle, AlertCircle, Edit2, Save, X } from 'lucide-react';

export default function ContractAnalysisResult({ result, fileName, onComplete, onRetry }) {
  const [editedData, setEditedData] = useState({ ...result.data });
  const [saving, setSaving] = useState(false);

  const handleFieldEdit = (field, value) => {
    setEditedData({ ...editedData, [field]: value });
  };

  const handleSave = async () => {
    setSaving(true);

    try {
      // 계약 번호 생성
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      const timestamp = Date.now().toString().slice(-6);
      const contractNumber = `C${year}${month}${day}-${timestamp}`;

      const contractData = {
        contract_number: contractNumber,
        ...editedData,
        analysis_file_path: result.filePath,
        analysis_method: result.method,
        confidence_score: result.confidence,
        original_data: result.data
      };

      console.log('💾 계약 저장 요청:', contractData);

      const response = await fetch('http://localhost:5000/api/contracts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(contractData)
      });

      console.log('🔍 응답 상태:', response.status);

      // 성공/실패 상관없이 응답 파싱
      let responseData;
      try {
        responseData = await response.json();
      } catch (parseError) {
        console.error('❌ JSON 파싱 실패:', parseError);
        throw new Error('서버 응답을 읽을 수 없습니다.');
      }

      if (!response.ok) {
        console.error('❌ 저장 실패:', responseData);
        
        // 중복 계약 번호 에러 - 자동 재시도
        if (responseData.duplicate === true) {
          console.log('⚠️ 계약번호 중복, 재시도 중...');
          setSaving(false);
          await new Promise(resolve => setTimeout(resolve, 1000));
          setSaving(true);
          return handleSave();
        }
        
        // 같은 내용의 계약 중복 에러 - 사용자에게 알림
        if (responseData.duplicateContent === true) {
          setSaving(false);
          alert('⚠️ 중복된 계약입니다!\n\n' + responseData.error);
          return;
        }
        
        setSaving(false);
        throw new Error(responseData.error || '계약서 저장에 실패했습니다.');
      }

      console.log('✅ 저장 성공:', responseData);

      // 검증 완료 기록
      if (result.confidence < 100) {
        const corrections = {};
        for (const key in editedData) {
          if (editedData[key] !== result.data[key]) {
            corrections[key] = editedData[key];
          }
        }

        if (Object.keys(corrections).length > 0) {
          await fetch(`http://localhost:5000/api/contracts/${responseData.contract.id}/verify`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ corrections })
          });
        }
      }

      onComplete(responseData.contract);

    } catch (error) {
      console.error('저장 오류:', error);
      alert(error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* 헤더 */}
      <div className="p-6" style={{ background: 'linear-gradient(90deg, #249689 0%, #1e7a6f 100%)' }}>
        <div className="flex items-center justify-between text-white">
          <div>
            <h3 className="font-bold mb-1" style={{ fontSize: '18px' }}>분석 완료</h3>
            <p style={{ fontSize: '15px', opacity: 0.9 }}>
              {fileName} • {result.method === 'template' ? '템플릿 기반' : 'AI 분석'}
            </p>
          </div>
          <div className="text-right">
            <div className="flex items-center justify-end mb-1">
              {result.confidence >= 85 ? (
                <CheckCircle size={24} className="mr-2" />
              ) : (
                <AlertCircle size={24} className="mr-2" />
              )}
              <span className="font-bold" style={{ fontSize: '24px' }}>{result.confidence}%</span>
            </div>
            <p style={{ fontSize: '15px', opacity: 0.75 }}>신뢰도</p>
          </div>
        </div>
      </div>

      {/* 검토 필요 알림 */}
      {result.needsReview && (
        <div className="p-4" style={{ backgroundColor: '#fef3c7', borderLeft: '4px solid #f59e0b' }}>
          <div className="flex items-start">
            <AlertCircle size={20} style={{ color: '#f59e0b' }} className="mr-3 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold" style={{ color: '#92400e', fontSize: '15px' }}>
                추출된 정보를 확인해주세요
              </p>
              <p style={{ color: '#92400e', fontSize: '15px' }} className="mt-1">
                신뢰도가 낮아 일부 정보가 정확하지 않을 수 있습니다. 각 항목을 검토하고 필요시 수정해주세요.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 추출된 데이터 */}
      <div className="p-6 space-y-4">
        <EditableField
          label="계약명"
          value={editedData.contract_name}
          onChange={(v) => handleFieldEdit('contract_name', v)}
          required
        />

        <EditableField
          label="계약자 이름"
          value={editedData.contractor_name}
          onChange={(v) => handleFieldEdit('contractor_name', v)}
          required
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <EditableField
            label="전화번호"
            value={editedData.phone_number}
            onChange={(v) => handleFieldEdit('phone_number', v)}
            required
          />

          <EditableField
            label="이메일"
            value={editedData.email}
            onChange={(v) => handleFieldEdit('email', v)}
            type="email"
          />
        </div>

        <EditableField
          label="주소"
          value={editedData.address}
          onChange={(v) => handleFieldEdit('address', v)}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <EditableField
            label="계약일"
            value={editedData.contract_date}
            onChange={(v) => handleFieldEdit('contract_date', v)}
            type="date"
            required
          />

          <EditableField
            label="투자금액"
            value={editedData.amount}
            onChange={(v) => handleFieldEdit('amount', v)}
            type="number"
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <EditableField
            label="결제 방법"
            value={editedData.payment_method}
            onChange={(v) => handleFieldEdit('payment_method', v)}
            type="select"
            options={['현금', '카드', '입금']}
          />

          <EditableField
            label="금융기관"
            value={editedData.bank_name}
            onChange={(v) => handleFieldEdit('bank_name', v)}
          />

          <EditableField
            label="계좌번호"
            value={editedData.account_number}
            onChange={(v) => handleFieldEdit('account_number', v)}
          />
        </div>

        <EditableField
          label="최초 지급일"
          value={editedData.first_payment_date}
          onChange={(v) => handleFieldEdit('first_payment_date', v)}
          type="date"
        />

        <EditableField
          label="메모"
          value={editedData.memo}
          onChange={(v) => handleFieldEdit('memo', v)}
          multiline
        />
      </div>

      {/* 액션 버튼 */}
      <div className="bg-gray-50 px-6 py-4 flex justify-between items-center">
        <button
          onClick={onRetry}
          className="font-bold hover:opacity-70 transition-opacity"
          style={{ color: '#6b7280', fontSize: '15px' }}
        >
          다시 업로드
        </button>
        
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center px-6 py-3 text-white font-bold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
          style={{ backgroundColor: '#249689', fontSize: '15px' }}
        >
          {saving ? (
            <>
              <div 
                className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"
              ></div>
              저장 중...
            </>
          ) : (
            <>
              <Save size={18} className="mr-2" />
              확인 및 저장
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// 편집 가능한 필드 컴포넌트
function EditableField({ label, value, onChange, type = 'text', required = false, multiline = false, options = [] }) {
  const [isEditing, setIsEditing] = useState(false);
  const [localValue, setLocalValue] = useState(value || '');

  const handleSave = () => {
    onChange(localValue);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setLocalValue(value || '');
    setIsEditing(false);
  };

  return (
    <div className="relative">
      <label className="block mb-2 font-bold" style={{ color: '#000000', fontSize: '15px' }}>
        {label}
        {required && <span style={{ color: '#ef4444' }} className="ml-1">*</span>}
      </label>

      {isEditing ? (
        <div className="flex gap-2">
          {type === 'select' ? (
            <select
              value={localValue}
              onChange={(e) => setLocalValue(e.target.value)}
              className="flex-1 px-4 py-3 border border-gray-300 focus:ring-2 focus:border-transparent"
              style={{ borderRadius: '10px', fontSize: '15px', outline: 'none', borderColor: '#249689' }}
              autoFocus
            >
              <option value="">선택하세요</option>
              {options.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          ) : multiline ? (
            <textarea
              value={localValue}
              onChange={(e) => setLocalValue(e.target.value)}
              className="flex-1 px-4 py-3 border border-gray-300 focus:ring-2 focus:border-transparent"
              style={{ borderRadius: '10px', fontSize: '15px', outline: 'none', borderColor: '#249689' }}
              rows={3}
              autoFocus
            />
          ) : (
            <input
              type={type}
              value={localValue}
              onChange={(e) => setLocalValue(e.target.value)}
              className="flex-1 px-4 py-3 border border-gray-300 focus:ring-2 focus:border-transparent"
              style={{ borderRadius: '10px', fontSize: '15px', outline: 'none', borderColor: '#249689' }}
              autoFocus
            />
          )}
          <button
            onClick={handleSave}
            className="p-3 text-white rounded-lg hover:opacity-90"
            style={{ backgroundColor: '#249689' }}
          >
            <Save size={18} />
          </button>
          <button
            onClick={handleCancel}
            className="p-3 rounded-lg"
            style={{ backgroundColor: '#e5e7eb', color: '#374151' }}
          >
            <X size={18} />
          </button>
        </div>
      ) : (
        <div
          onClick={() => setIsEditing(true)}
          className="group flex items-center px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg cursor-pointer hover:border-opacity-100 transition-all"
          style={{ borderRadius: '10px', borderColor: '#d1d5db' }}
          onMouseEnter={(e) => e.currentTarget.style.borderColor = '#249689'}
          onMouseLeave={(e) => e.currentTarget.style.borderColor = '#d1d5db'}
        >
          <span className="flex-1" style={{ color: value ? '#000000' : '#9ca3af', fontSize: '15px', fontStyle: value ? 'normal' : 'italic' }}>
            {value || '입력되지 않음'}
          </span>
          <Edit2 size={16} style={{ color: '#9ca3af' }} className="group-hover:opacity-100" />
        </div>
      )}
    </div>
  );
}