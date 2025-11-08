import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Upload, Loader, CheckCircle, AlertCircle } from 'lucide-react';
import Navigation from '../../components/Navigation.component';

export default function ContractNewPage() {
  const navigate = useNavigate();
  const [contractTypes, setContractTypes] = useState([]);
  const [formData, setFormData] = useState({
    contract_type_id: '',
    contractor_name: '',
    contract_date: '',
    contract_end_date: '',
    phone_number: '',
    address: '',
    email: '',
    recipient_bank: '',
    recipient_account: '',
    recipient_name: '',
    amount: '',
    monthly_payment: '',
    first_payment: '',
    memo: ''
  });
  const [fieldConfidence, setFieldConfidence] = useState({});
  const [pdfFile, setPdfFile] = useState(null);
  const [parsing, setParsing] = useState(false);
  const [parseComplete, setParseComplete] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadContractTypes();
  }, []);

  const loadContractTypes = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/contract-types');
      const data = await response.json();
      setContractTypes(data.types || []);
    } catch (error) {
      console.error('계약종류 조회 오류:', error);
    }
  };

  const handlePDFUpload = async (file) => {
    if (!file) return;

    setPdfFile(file);
    setParsing(true);
    setParseComplete(false);

    const formDataToSend = new FormData();
    formDataToSend.append('pdf', file);

    try {
      const response = await fetch('http://localhost:5000/api/contracts/parse-pdf', {
        method: 'POST',
        body: formDataToSend
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'PDF 파싱 실패');
      }

      // 파싱 결과를 폼에 자동 입력
      const parsedData = result.data;
      const newFormData = { ...formData };
      const newConfidence = {};

      // 매핑 (파싱 결과 → 폼 필드)
      const fieldMapping = {
        '계약종류': 'contract_type_name',
        '계약자명': 'contractor_name',
        '계약일': 'contract_date',
        '계약종료일': 'contract_end_date',
        '연락처': 'phone_number',
        '주소': 'address',
        '이메일': 'email',
        '은행명': 'recipient_bank',
        '계좌번호': 'recipient_account',
        '투자금액': 'amount',
        '매월지급액': 'monthly_payment'
      };

      Object.keys(fieldMapping).forEach(koreanKey => {
        const englishKey = fieldMapping[koreanKey];
        const parsedValue = parsedData[koreanKey];

        if (parsedValue && parsedValue.value) {
          newFormData[englishKey] = parsedValue.value;
          newConfidence[englishKey] = parsedValue.confidence;
        }
      });

      // 계약종류명으로 contract_type_id 찾기
      if (newFormData.contract_type_name) {
        const matchedType = contractTypes.find(
          type => type.name === newFormData.contract_type_name || 
                  type.code === newFormData.contract_type_name
        );
        if (matchedType) {
          newFormData.contract_type_id = matchedType.id;
        }
        delete newFormData.contract_type_name; // 임시 필드 삭제
      }

      setFormData(newFormData);
      setFieldConfidence(newConfidence);
      setParseComplete(true);
      alert('PDF 파싱이 완료되었습니다. 자동 입력된 내용을 확인해주세요.');

    } catch (error) {
      console.error('PDF 파싱 오류:', error);
      alert('PDF 파싱에 실패했습니다: ' + error.message);
    } finally {
      setParsing(false);
    }
  };

  const getFieldStyle = (fieldName) => {
    const confidence = fieldConfidence[fieldName];
    if (!confidence) return {};

    if (confidence >= 85) {
      return { borderColor: '#10b981', backgroundColor: '#f0fdf4' }; // 초록
    } else if (confidence >= 60) {
      return { borderColor: '#f59e0b', backgroundColor: '#fffbeb' }; // 노랑
    } else {
      return { borderColor: '#ef4444', backgroundColor: '#fef2f2' }; // 빨강
    }
  };

  const getConfidenceBadge = (fieldName) => {
    const confidence = fieldConfidence[fieldName];
    if (!confidence) return null;

    if (confidence >= 85) {
      return (
        <span className="flex items-center gap-1 text-xs" style={{ color: '#10b981' }}>
          <CheckCircle size={14} /> {confidence}%
        </span>
      );
    } else if (confidence >= 60) {
      return (
        <span className="flex items-center gap-1 text-xs" style={{ color: '#f59e0b' }}>
          <AlertCircle size={14} /> {confidence}% - 확인 필요
        </span>
      );
    } else {
      return (
        <span className="flex items-center gap-1 text-xs" style={{ color: '#ef4444' }}>
          <AlertCircle size={14} /> {confidence}% - 필수 확인
        </span>
      );
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type === 'application/pdf') {
        handlePDFUpload(file);
      } else {
        alert('PDF 파일만 업로드 가능합니다.');
      }
    }
  };

  const handleFileInput = (e) => {
    const file = e.target.files[0];
    if (file) {
      handlePDFUpload(file);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.contract_type_id) newErrors.contract_type_id = '계약종류는 필수입니다';
    if (!formData.contractor_name) newErrors.contractor_name = '계약자명은 필수입니다';
    if (!formData.contract_date) newErrors.contract_date = '계약일은 필수입니다';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      alert('필수 항목을 입력해주세요');
      return;
    }

    setSaving(true);

    try {
      // 빈 값 제거
      const dataToSend = {};
      Object.keys(formData).forEach(key => {
        if (formData[key] !== '' && formData[key] !== null && formData[key] !== undefined) {
          dataToSend[key] = formData[key];
        }
      });

      const response = await fetch('http://localhost:5000/api/contracts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSend),
      });

      if (!response.ok) {
        throw new Error('계약 생성 실패');
      }

      alert('계약이 생성되었습니다');
      navigate('/contracts');

    } catch (error) {
      console.error('계약 생성 오류:', error);
      alert('계약 생성에 실패했습니다');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f9fafb' }}>
      <Navigation />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="font-bold" style={{ color: '#115e59', fontSize: '28px' }}>
            계약서 등록
          </h1>
          <p className="mt-2" style={{ color: '#6b7280', fontSize: '15px' }}>
            PDF 파일을 업로드하면 자동으로 정보를 추출합니다
          </p>
        </div>

        {/* PDF 업로드 */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="font-bold mb-4" style={{ color: '#115e59', fontSize: '18px' }}>
            📄 PDF 파일 업로드
          </h2>

          <label 
            className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            style={{
              borderColor: dragActive ? '#249689' : '#d1d5db',
              backgroundColor: dragActive ? '#f0fdfa' : 'transparent'
            }}
          >
            <input
              type="file"
              accept="application/pdf"
              onChange={handleFileInput}
              disabled={parsing}
              className="hidden"
            />
            
            {parsing ? (
              <div className="flex flex-col items-center">
                <Loader className="animate-spin mb-2" size={32} style={{ color: '#249689' }} />
                <span style={{ color: '#6b7280', fontSize: '15px' }}>PDF 분석 중...</span>
              </div>
            ) : pdfFile ? (
              <div className="flex flex-col items-center">
                <FileText size={32} style={{ color: '#249689' }} className="mb-2" />
                <span style={{ color: '#115e59', fontSize: '15px' }}>{pdfFile.name}</span>
                {parseComplete && (
                  <span className="flex items-center gap-1 mt-2" style={{ color: '#10b981', fontSize: '14px' }}>
                    <CheckCircle size={16} /> 파싱 완료
                  </span>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <Upload size={32} style={{ color: dragActive ? '#249689' : '#9ca3af' }} className="mb-2" />
                <span className="font-bold" style={{ color: dragActive ? '#249689' : '#6b7280', fontSize: '15px' }}>
                  {dragActive ? 'PDF 파일을 놓아주세요' : '클릭하거나 PDF 파일을 드래그하세요'}
                </span>
              </div>
            )}
          </label>
        </div>

        {/* 계약 정보 폼 */}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg p-6 space-y-6">
          <h2 className="font-bold" style={{ color: '#115e59', fontSize: '18px' }}>
            계약 정보
          </h2>

          {/* 계약종류 / 계약일 / 계약 종료일 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block mb-2 font-bold" style={{ color: '#115e59', fontSize: '15px' }}>
                계약종류 <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <select
                value={formData.contract_type_id}
                onChange={(e) => setFormData({ ...formData, contract_type_id: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2"
                style={{ 
                  borderColor: errors.contract_type_id ? '#ef4444' : '#e5e7eb',
                  fontSize: '15px'
                }}
              >
                <option value="">선택하세요</option>
                {contractTypes.map(type => (
                  <option key={type.id} value={type.id}>{type.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="flex items-center justify-between mb-2">
                <span className="font-bold" style={{ color: '#115e59', fontSize: '15px' }}>
                  계약일 <span style={{ color: '#ef4444' }}>*</span>
                </span>
                {getConfidenceBadge('contract_date')}
              </label>
              <input
                type="date"
                value={formData.contract_date}
                onChange={(e) => setFormData({ ...formData, contract_date: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2"
                style={{ 
                  ...getFieldStyle('contract_date'),
                  fontSize: '15px'
                }}
              />
            </div>

            <div>
              <label className="flex items-center justify-between mb-2">
                <span className="font-bold" style={{ color: '#115e59', fontSize: '15px' }}>
                  계약 종료일
                </span>
                {getConfidenceBadge('contract_end_date')}
              </label>
              <input
                type="date"
                value={formData.contract_end_date}
                onChange={(e) => setFormData({ ...formData, contract_end_date: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2"
                style={{ 
                  ...getFieldStyle('contract_end_date'),
                  fontSize: '15px'
                }}
              />
            </div>
          </div>

          {/* 계약자명 / 연락처 / 이메일 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="flex items-center justify-between mb-2">
                <span className="font-bold" style={{ color: '#115e59', fontSize: '15px' }}>
                  계약자명 <span style={{ color: '#ef4444' }}>*</span>
                </span>
                {getConfidenceBadge('contractor_name')}
              </label>
              <input
                type="text"
                value={formData.contractor_name}
                onChange={(e) => setFormData({ ...formData, contractor_name: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2"
                style={{ 
                  ...getFieldStyle('contractor_name'),
                  fontSize: '15px'
                }}
                placeholder="홍길동"
              />
            </div>

            <div>
              <label className="flex items-center justify-between mb-2">
                <span className="font-bold" style={{ color: '#115e59', fontSize: '15px' }}>
                  연락처
                </span>
                {getConfidenceBadge('phone_number')}
              </label>
              <input
                type="tel"
                value={formData.phone_number}
                onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2"
                style={{ 
                  ...getFieldStyle('phone_number'),
                  fontSize: '15px'
                }}
                placeholder="010-1234-5678"
              />
            </div>

            <div>
              <label className="flex items-center justify-between mb-2">
                <span className="font-bold" style={{ color: '#115e59', fontSize: '15px' }}>
                  이메일
                </span>
                {getConfidenceBadge('email')}
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2"
                style={{ 
                  ...getFieldStyle('email'),
                  fontSize: '15px'
                }}
                placeholder="example@email.com"
              />
            </div>
          </div>

          {/* 주소 */}
          <div>
            <label className="flex items-center justify-between mb-2">
              <span className="font-bold" style={{ color: '#115e59', fontSize: '15px' }}>
                주소
              </span>
              {getConfidenceBadge('address')}
            </label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2"
              style={{ 
                ...getFieldStyle('address'),
                fontSize: '15px'
              }}
              placeholder="서울시 강남구..."
            />
          </div>

          {/* 은행명 / 계좌번호 / 예금주 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="flex items-center justify-between mb-2">
                <span className="font-bold" style={{ color: '#115e59', fontSize: '15px' }}>
                  은행명
                </span>
                {getConfidenceBadge('recipient_bank')}
              </label>
              <input
                type="text"
                value={formData.recipient_bank}
                onChange={(e) => setFormData({ ...formData, recipient_bank: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2"
                style={{ 
                  ...getFieldStyle('recipient_bank'),
                  fontSize: '15px'
                }}
                placeholder="신한은행"
              />
            </div>

            <div>
              <label className="flex items-center justify-between mb-2">
                <span className="font-bold" style={{ color: '#115e59', fontSize: '15px' }}>
                  계좌번호
                </span>
                {getConfidenceBadge('recipient_account')}
              </label>
              <input
                type="text"
                value={formData.recipient_account}
                onChange={(e) => setFormData({ ...formData, recipient_account: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2"
                style={{ 
                  ...getFieldStyle('recipient_account'),
                  fontSize: '15px'
                }}
                placeholder="110-123-456789"
              />
            </div>

            <div>
              <label className="block mb-2 font-bold" style={{ color: '#115e59', fontSize: '15px' }}>
                예금주
              </label>
              <input
                type="text"
                value={formData.recipient_name}
                onChange={(e) => setFormData({ ...formData, recipient_name: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2"
                style={{ fontSize: '15px' }}
                placeholder="홍길동"
              />
            </div>
          </div>

          {/* 투자금액 / 첫지급일 / 매월지급액 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="flex items-center justify-between mb-2">
                <span className="font-bold" style={{ color: '#115e59', fontSize: '15px' }}>
                  투자금액
                </span>
                {getConfidenceBadge('amount')}
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.amount ? parseInt(formData.amount).toLocaleString() : ''}
                  onChange={(e) => {
                    const value = e.target.value.replace(/,/g, '');
                    if (!isNaN(value)) {
                      setFormData({ ...formData, amount: value });
                    }
                  }}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2"
                  style={{ 
                    ...getFieldStyle('amount'),
                    fontSize: '15px',
                    textAlign: 'right',
                    paddingRight: '40px'
                  }}
                  placeholder="20,000,000"
                />
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2" style={{ color: '#6b7280', fontSize: '15px' }}>
                  원
                </span>
              </div>
            </div>

            <div>
              <label className="block mb-2 font-bold" style={{ color: '#115e59', fontSize: '15px' }}>
                첫 지급일
              </label>
              <input
                type="date"
                value={formData.first_payment}
                onChange={(e) => setFormData({ ...formData, first_payment: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2"
                style={{ fontSize: '15px' }}
              />
            </div>

            <div>
              <label className="flex items-center justify-between mb-2">
                <span className="font-bold" style={{ color: '#115e59', fontSize: '15px' }}>
                  매월 지급액
                </span>
                {getConfidenceBadge('monthly_payment')}
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.monthly_payment ? parseInt(formData.monthly_payment).toLocaleString() : ''}
                  onChange={(e) => {
                    const value = e.target.value.replace(/,/g, '');
                    if (!isNaN(value)) {
                      setFormData({ ...formData, monthly_payment: value });
                    }
                  }}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2"
                  style={{ 
                    ...getFieldStyle('monthly_payment'),
                    fontSize: '15px',
                    textAlign: 'right',
                    paddingRight: '40px'
                  }}
                  placeholder="1,500,000"
                />
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2" style={{ color: '#6b7280', fontSize: '15px' }}>
                  원
                </span>
              </div>
            </div>
          </div>

          {/* 메모 */}
          <div>
            <label className="block mb-2 font-bold" style={{ color: '#115e59', fontSize: '15px' }}>
              메모
            </label>
            <textarea
              value={formData.memo}
              onChange={(e) => setFormData({ ...formData, memo: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2"
              style={{ fontSize: '15px' }}
              rows="3"
              placeholder="메모를 입력하세요"
            />
          </div>

          {/* 버튼 */}
          <div className="flex gap-3 justify-end pt-4 border-t">
            <button
              type="button"
              onClick={() => navigate('/contracts')}
              className="px-6 py-2 rounded-lg font-bold hover:bg-gray-100 transition-colors"
              style={{ 
                border: '1px solid #e5e7eb',
                color: '#6b7280',
                fontSize: '15px'
              }}
            >
              취소
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 rounded-lg font-bold text-white hover:opacity-90 transition-opacity disabled:opacity-50"
              style={{ 
                backgroundColor: '#249689',
                fontSize: '15px'
              }}
            >
              {saving ? '저장 중...' : '등록'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}