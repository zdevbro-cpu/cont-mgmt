import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Upload, Loader, CheckCircle, AlertCircle } from 'lucide-react';
import Navigation from '../../components/Navigation.component';

export default function ContractNewPage() {
  const navigate = useNavigate();
  const [contractTypes, setContractTypes] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
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
    other_support: '',
    total_monthly_payment: '',
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
    }
  };

  const loadTemplates = async (contractTypeId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/contract-templates?contract_type_id=${contractTypeId}&is_available=true`);
      const data = await response.json();
      setTemplates(data || []);
    } catch (error) {
      setTemplates([]);
    }
  };

  const handleContractTypeChange = (e) => {
    const typeId = e.target.value;
    setFormData({ ...formData, contract_type_id: typeId });
    setSelectedTemplate(null);
    setTemplates([]);
    
    if (typeId) {
      loadTemplates(typeId);
    }
  };

  const handleTemplateSelect = (e) => {
    const templateId = e.target.value;
    if (!templateId) {
      setSelectedTemplate(null);
      return;
    }

    const template = templates.find(t => t.id === templateId);
    setSelectedTemplate(template);

    // 템플릿 정보로 폼 자동 입력
    if (template) {
      updateFormWithTemplate(template, formData);
    }
  };

  const updateFormWithTemplate = (template, currentFormData) => {
    const newFormData = { ...currentFormData };

    // 템플릿의 기타지원금 적용
    if (template.other_support_amount !== null && template.other_support_amount !== undefined) {
      newFormData.other_support = template.other_support_amount;
    } else {
      newFormData.other_support = 0;
    }

    // 계약기간이 있고 계약일이 있으면 계약종료일 자동 계산 (계약일 + 계약기간 - 1일)
    if (template.contract_period && newFormData.contract_date) {
      const [year, month, day] = newFormData.contract_date.split('-').map(Number);
      const startDate = new Date(year, month - 1, day); // 로컬 시간대 사용
      startDate.setMonth(startDate.getMonth() + template.contract_period);
      startDate.setDate(startDate.getDate() - 1);
      
      const endYear = startDate.getFullYear();
      const endMonth = String(startDate.getMonth() + 1).padStart(2, '0');
      const endDay = String(startDate.getDate()).padStart(2, '0');
      newFormData.contract_end_date = `${endYear}-${endMonth}-${endDay}`;
    }

    // 첫지급일 자동 계산
    if (template.first_payment_months && newFormData.contract_date) {
      const [year, month, day] = newFormData.contract_date.split('-').map(Number);
      const firstPaymentDate = new Date(year, month - 1, day); // 로컬 시간대 사용
      firstPaymentDate.setMonth(firstPaymentDate.getMonth() + template.first_payment_months);
      
      const fpYear = firstPaymentDate.getFullYear();
      const fpMonth = String(firstPaymentDate.getMonth() + 1).padStart(2, '0');
      const fpDay = String(firstPaymentDate.getDate()).padStart(2, '0');
      newFormData.first_payment = `${fpYear}-${fpMonth}-${fpDay}`;
    }

    // 월 지급액 자동 입력 (투자금액과 지급액/Unit이 있으면)
    if (template.monthly_payment_amount && newFormData.amount) {
      // 템플릿의 unit_amount를 사용, 없으면 기본값 10000000 (1천만원)
      const unitAmount = template.unit_amount || 10000000;
      const units = parseInt(newFormData.amount) / unitAmount;
      const calculatedPayment = Math.round(template.monthly_payment_amount * units);
      newFormData.monthly_payment = calculatedPayment;
      
      // 월 지급총액 = 투자수익금 + 기타지원금
      const templateOtherSupport = newFormData.other_support || 0;
      newFormData.total_monthly_payment = calculatedPayment + parseInt(templateOtherSupport);
    }

    setFormData(newFormData);
  };

  const handleContractDateChange = (e) => {
    const newContractDate = e.target.value;
    const newFormData = { ...formData, contract_date: newContractDate };

    // 템플릿이 선택되어 있으면 자동 계산
    if (selectedTemplate && newContractDate) {
      // 계약종료일 자동 계산 (계약일 + 계약기간 - 1일)
      if (selectedTemplate.contract_period) {
        const [year, month, day] = newContractDate.split('-').map(Number);
        const startDate = new Date(year, month - 1, day); // 로컬 시간대 사용
        startDate.setMonth(startDate.getMonth() + selectedTemplate.contract_period);
        startDate.setDate(startDate.getDate() - 1);
        
        const endYear = startDate.getFullYear();
        const endMonth = String(startDate.getMonth() + 1).padStart(2, '0');
        const endDay = String(startDate.getDate()).padStart(2, '0');
        newFormData.contract_end_date = `${endYear}-${endMonth}-${endDay}`;
      }

      // 첫지급일 자동 계산
      if (selectedTemplate.first_payment_months) {
        const [year, month, day] = newContractDate.split('-').map(Number);
        const firstPaymentDate = new Date(year, month - 1, day); // 로컬 시간대 사용
        firstPaymentDate.setMonth(firstPaymentDate.getMonth() + selectedTemplate.first_payment_months);
        
        const fpYear = firstPaymentDate.getFullYear();
        const fpMonth = String(firstPaymentDate.getMonth() + 1).padStart(2, '0');
        const fpDay = String(firstPaymentDate.getDate()).padStart(2, '0');
        newFormData.first_payment = `${fpYear}-${fpMonth}-${fpDay}`;
      }
    }

    setFormData(newFormData);
  };

  const handleAmountChange = (value) => {
    const newFormData = { ...formData, amount: value };

    // 템플릿이 선택되어 있고 지급액/Unit이 있으면 투자수익금 자동 계산
    if (selectedTemplate && selectedTemplate.monthly_payment_amount && value) {
      // 템플릿의 unit_amount를 사용, 없으면 기본값 10000000 (1천만원)
      const unitAmount = selectedTemplate.unit_amount || 10000000;
      const units = parseInt(value) / unitAmount;
      const calculatedPayment = Math.round(selectedTemplate.monthly_payment_amount * units);
      newFormData.monthly_payment = calculatedPayment;
      
      // 템플릿의 기타지원금 자동 적용
      const templateOtherSupport = selectedTemplate.other_support_amount || 0;
      newFormData.other_support = templateOtherSupport;
      
      // 월 지급총액 = 투자수익금 + 기타지원금
      const totalAmount = calculatedPayment + templateOtherSupport;
      newFormData.total_monthly_payment = totalAmount;
    } else {
      // 템플릿이 없으면 월지급총액 계산
      const mp = parseInt(newFormData.monthly_payment) || 0;
      const os = parseInt(newFormData.other_support) || 0;
      newFormData.total_monthly_payment = mp + os;
    }

    setFormData(newFormData);
  };

  const handleOtherSupportChange = (value) => {
    const newFormData = { ...formData, other_support: value };

    // 월 지급총액 계산 (투자수익금 + 기타지원금)
    const monthlyPayment = parseInt(newFormData.monthly_payment || 0) || 0;
    const otherSupport = parseInt(value || 0) || 0;
    newFormData.total_monthly_payment = monthlyPayment + otherSupport;

    setFormData(newFormData);
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
        const parsedTypeName = newFormData.contract_type_name.toLowerCase();
        
        // 정확한 매칭 시도
        let matchedType = contractTypes.find(
          type => type.name.toLowerCase() === parsedTypeName || 
                  type.code.toLowerCase() === parsedTypeName
        );
        
        // 부분 매칭 시도 (정확한 매칭 실패 시)
        if (!matchedType) {
          matchedType = contractTypes.find(type => 
            parsedTypeName.includes(type.name.toLowerCase()) ||
            parsedTypeName.includes(type.code.toLowerCase()) ||
            type.name.toLowerCase().includes(parsedTypeName) ||
            type.code.toLowerCase().includes(parsedTypeName)
          );
        }
        
        if (matchedType) {
          newFormData.contract_type_id = matchedType.id;
          newConfidence.contract_type_id = 90;
        } else {
        }
        
        delete newFormData.contract_type_name; // 임시 필드 삭제
      }

      setFormData(newFormData);
      setFieldConfidence(newConfidence);
      setParseComplete(true);
      
      // 계약종류가 설정되었으면 템플릿 자동 로드
      if (newFormData.contract_type_id) {
        loadTemplates(newFormData.contract_type_id);
      }
      
      alert('PDF 파싱이 완료되었습니다. 자동 입력된 내용을 확인해주세요.');

    } catch (error) {
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

      // 월지급총액 재계산 (DB 저장 직전)
      const monthlyPayment = parseInt(dataToSend.monthly_payment) || 0;
      const otherSupport = parseInt(dataToSend.other_support) || 0;
      dataToSend.total_monthly_payment = monthlyPayment + otherSupport;

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
          <h2 className="font-bold mb-3" style={{ color: '#115e59', fontSize: '18px' }}>
            📄 PDF 파일 업로드
          </h2>

          <label 
            className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
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
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg p-5 space-y-4">
          <h2 className="font-bold" style={{ color: '#115e59', fontSize: '18px' }}>
            계약 정보
          </h2>

          {/* 계약종류 / 시행일 선택 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="flex items-center justify-between mb-2">
                <span className="font-bold" style={{ color: '#115e59', fontSize: '15px' }}>
                  계약종류 <span style={{ color: '#ef4444' }}>*</span>
                </span>
                {getConfidenceBadge('contract_type_id')}
              </label>
              <select
                value={formData.contract_type_id}
                onChange={handleContractTypeChange}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
                style={{ 
                  ...getFieldStyle('contract_type_id'),
                  borderColor: errors.contract_type_id ? '#ef4444' : (getFieldStyle('contract_type_id').borderColor || '#e5e7eb'),
                  fontSize: '15px'
                }}
              >
                <option value="">선택하세요</option>
                {contractTypes.map(type => (
                  <option key={type.id} value={type.id}>{type.name}</option>
                ))}
              </select>
              {parseComplete && fieldConfidence.contract_type_id && (
                <p className="text-xs mt-1" style={{ color: '#10b981' }}>
                  ✓ PDF에서 자동 추출됨
                </p>
              )}
            </div>

            {/* 시행일 선택 */}
            {formData.contract_type_id && (
              <div>
                <label className="block mb-2 font-bold" style={{ color: '#115e59', fontSize: '15px' }}>
                  시행일 선택
                </label>
                {templates.length > 0 ? (
                  <>
                    <select
                      value={selectedTemplate?.id || ''}
                      onChange={handleTemplateSelect}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
                      style={{ fontSize: '15px' }}
                    >
                      <option value="">시행일을 선택하세요</option>
                      {templates.map(template => (
                        <option key={template.id} value={template.id}>
                          {template.effective_date}
                        </option>
                      ))}
                    </select>
                    {selectedTemplate && (
                      <p className="text-xs mt-1" style={{ color: '#10b981' }}>
                        ✓ 선택한 시행일의 계약 조건이 자동으로 적용되었습니다
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-sm py-2" style={{ color: '#6b7280' }}>
                    선택 가능한 시행일이 없습니다
                  </p>
                )}
              </div>
            )}
          </div>

          {/* 계약일 / 계약종료일 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
                onChange={handleContractDateChange}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
                style={{ 
                  ...getFieldStyle('contract_date'),
                  fontSize: '15px'
                }}
              />
            </div>

            <div>
              <label className="flex items-center justify-between mb-2">
                <span className="font-bold" style={{ color: '#115e59', fontSize: '15px' }}>
                  계약종료일
                </span>
                {getConfidenceBadge('contract_end_date')}
              </label>
              <input
                type="date"
                value={formData.contract_end_date}
                onChange={(e) => setFormData({ ...formData, contract_end_date: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
                style={{ 
                  ...getFieldStyle('contract_end_date'),
                  fontSize: '15px'
                }}
              />
            </div>
          </div>

          {/* 계약자명 / 연락처 / 이메일 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
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
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
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
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
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
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
              style={{ 
                ...getFieldStyle('address'),
                fontSize: '15px'
              }}
              placeholder="서울시 강남구..."
            />
          </div>

          {/* 은행명 / 계좌번호 / 예금주 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
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
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
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
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
                style={{ fontSize: '15px' }}
                placeholder="홍길동"
              />
            </div>
          </div>

          {/* 투자금액 / 첫 지급일 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
                      handleAmountChange(value);
                    }
                  }}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
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
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
                style={{ fontSize: '15px' }}
              />
            </div>
          </div>

          {/* 투자수익금 / 기타지원금 / 월 지급총액 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="flex items-center justify-between mb-2">
                <span className="font-bold" style={{ color: '#115e59', fontSize: '15px' }}>
                  투자수익금
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
                      const mp = parseInt(value) || 0;
                      const os = parseInt(formData.other_support) || 0;
                      setFormData({ 
                        ...formData, 
                        monthly_payment: value,
                        total_monthly_payment: mp + os
                      });
                    }
                  }}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
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

            <div>
              <label className="block mb-2 font-bold" style={{ color: '#115e59', fontSize: '15px' }}>
                기타지원금
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.other_support ? parseInt(formData.other_support).toLocaleString() : '0'}
                  readOnly
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 bg-gray-50"
                  style={{ 
                    fontSize: '15px',
                    textAlign: 'right',
                    paddingRight: '40px'
                  }}
                  placeholder="0"
                />
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2" style={{ color: '#6b7280', fontSize: '15px' }}>
                  원
                </span>
              </div>
            </div>

            <div>
              <label className="block mb-2 font-bold" style={{ color: '#115e59', fontSize: '15px' }}>
                월 지급총액
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.total_monthly_payment ? parseInt(formData.total_monthly_payment).toLocaleString() : ''}
                  readOnly
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 bg-gray-50"
                  style={{ 
                    fontSize: '15px',
                    textAlign: 'right',
                    paddingRight: '40px'
                  }}
                  placeholder="2,000,000"
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
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
              style={{ fontSize: '15px' }}
              rows="2"
              placeholder="메모를 입력하세요"
            />
          </div>

          {/* 버튼 */}
          <div className="flex gap-3 justify-end pt-3 border-t">
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