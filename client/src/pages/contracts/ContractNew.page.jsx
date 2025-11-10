import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText } from 'lucide-react';
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
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadContractTypes();
  }, []);

  const loadContractTypes = async () => {
    try {
      const response = await fetch('${import.meta.env.VITE_API_URL}/api/contract-types');
      const data = await response.json();
      setContractTypes(data.types || []);
    } catch (error) {
    }
  };

  const loadTemplates = async (contractTypeId) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/contract-templates?contract_type_id=${contractTypeId}&is_available=true`);
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

    // ?œí”Œë¦??•ë³´ë¡????ë™ ?…ë ¥
    if (template) {
      updateFormWithTemplate(template, formData);
    }
  };

  const updateFormWithTemplate = (template, currentFormData) => {
    const newFormData = { ...currentFormData };

    // ?œí”Œë¦¿ì˜ ê¸°í?ì§€?ê¸ˆ ?ìš©
    if (template.other_support_amount !== null && template.other_support_amount !== undefined) {
      newFormData.other_support = template.other_support_amount;
    } else {
      newFormData.other_support = 0;
    }

    // ê³„ì•½ê¸°ê°„???ˆê³  ê³„ì•½?¼ì´ ?ˆìœ¼ë©?ê³„ì•½ì¢…ë£Œ???ë™ ê³„ì‚° (ê³„ì•½??+ ê³„ì•½ê¸°ê°„ - 1??
    if (template.contract_period && newFormData.contract_date) {
      const [year, month, day] = newFormData.contract_date.split('-').map(Number);
      const startDate = new Date(year, month - 1, day); // ë¡œì»¬ ?œê°„?€ ?¬ìš©
      startDate.setMonth(startDate.getMonth() + template.contract_period);
      startDate.setDate(startDate.getDate() - 1);
      
      const endYear = startDate.getFullYear();
      const endMonth = String(startDate.getMonth() + 1).padStart(2, '0');
      const endDay = String(startDate.getDate()).padStart(2, '0');
      newFormData.contract_end_date = `${endYear}-${endMonth}-${endDay}`;
    }

    // ì²«ì?ê¸‰ì¼ ?ë™ ê³„ì‚°
    if (template.first_payment_months && newFormData.contract_date) {
      const [year, month, day] = newFormData.contract_date.split('-').map(Number);
      const firstPaymentDate = new Date(year, month - 1, day); // ë¡œì»¬ ?œê°„?€ ?¬ìš©
      firstPaymentDate.setMonth(firstPaymentDate.getMonth() + template.first_payment_months);
      
      const fpYear = firstPaymentDate.getFullYear();
      const fpMonth = String(firstPaymentDate.getMonth() + 1).padStart(2, '0');
      const fpDay = String(firstPaymentDate.getDate()).padStart(2, '0');
      newFormData.first_payment = `${fpYear}-${fpMonth}-${fpDay}`;
    }

    // ??ì§€ê¸‰ì•¡ ?ë™ ?…ë ¥ (?¬ìê¸ˆì•¡ê³?ì§€ê¸‰ì•¡/Unit???ˆìœ¼ë©?
    if (template.monthly_payment_amount && newFormData.amount) {
      // ?œí”Œë¦¿ì˜ unit_amountë¥??¬ìš©, ?†ìœ¼ë©?ê¸°ë³¸ê°?10000000 (1ì²œë§Œ??
      const unitAmount = template.unit_amount || 10000000;
      const units = parseInt(newFormData.amount) / unitAmount;
      const calculatedPayment = Math.round(template.monthly_payment_amount * units);
      newFormData.monthly_payment = calculatedPayment;
      
      // ??ì§€ê¸‰ì´??= ?¬ì?˜ìµê¸?+ ê¸°í?ì§€?ê¸ˆ
      const templateOtherSupport = newFormData.other_support || 0;
      newFormData.total_monthly_payment = calculatedPayment + parseInt(templateOtherSupport);
    }

    setFormData(newFormData);
  };

  const handleContractDateChange = (e) => {
    const newContractDate = e.target.value;
    const newFormData = { ...formData, contract_date: newContractDate };

    // ?œí”Œë¦¿ì´ ? íƒ?˜ì–´ ?ˆìœ¼ë©??ë™ ê³„ì‚°
    if (selectedTemplate && newContractDate) {
      // ê³„ì•½ì¢…ë£Œ???ë™ ê³„ì‚° (ê³„ì•½??+ ê³„ì•½ê¸°ê°„ - 1??
      if (selectedTemplate.contract_period) {
        const [year, month, day] = newContractDate.split('-').map(Number);
        const startDate = new Date(year, month - 1, day); // ë¡œì»¬ ?œê°„?€ ?¬ìš©
        startDate.setMonth(startDate.getMonth() + selectedTemplate.contract_period);
        startDate.setDate(startDate.getDate() - 1);
        
        const endYear = startDate.getFullYear();
        const endMonth = String(startDate.getMonth() + 1).padStart(2, '0');
        const endDay = String(startDate.getDate()).padStart(2, '0');
        newFormData.contract_end_date = `${endYear}-${endMonth}-${endDay}`;
      }

      // ì²«ì?ê¸‰ì¼ ?ë™ ê³„ì‚°
      if (selectedTemplate.first_payment_months) {
        const [year, month, day] = newContractDate.split('-').map(Number);
        const firstPaymentDate = new Date(year, month - 1, day); // ë¡œì»¬ ?œê°„?€ ?¬ìš©
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

    // ?œí”Œë¦¿ì´ ? íƒ?˜ì–´ ?ˆìœ¼ë©??¬ì?˜ìµê¸??ë™ ê³„ì‚°
    if (selectedTemplate && value) {
      // ?œí”Œë¦¿ì˜ unit_amountë¥??¬ìš©, ?†ìœ¼ë©?ê¸°ë³¸ê°?10000000 (1ì²œë§Œ??
      const unitAmount = selectedTemplate.unit_amount || 10000000;
      const paymentPerUnit = selectedTemplate.monthly_payment_amount || 0;
      const units = parseInt(value) / unitAmount;
      const calculatedPayment = Math.round(paymentPerUnit * units);
      
      newFormData.monthly_payment = calculatedPayment;
      
      // ?œí”Œë¦¿ì˜ ê¸°í?ì§€?ê¸ˆ ?ë™ ?ìš©
      const templateOtherSupport = selectedTemplate.other_support_amount || 0;
      newFormData.other_support = templateOtherSupport;
      
      // ??ì§€ê¸‰ì´??= ?¬ì?˜ìµê¸?+ ê¸°í?ì§€?ê¸ˆ
      const totalAmount = calculatedPayment + templateOtherSupport;
      newFormData.total_monthly_payment = totalAmount;

      // ì²«ì?ê¸‰ì¼ ?ë™ ê³„ì‚°
      if (selectedTemplate.first_payment_months && newFormData.contract_date) {
        const [year, month, day] = newFormData.contract_date.split('-').map(Number);
        const firstPaymentDate = new Date(year, month - 1, day);
        firstPaymentDate.setMonth(firstPaymentDate.getMonth() + selectedTemplate.first_payment_months);
        
        const fpYear = firstPaymentDate.getFullYear();
        const fpMonth = String(firstPaymentDate.getMonth() + 1).padStart(2, '0');
        const fpDay = String(firstPaymentDate.getDate()).padStart(2, '0');
        newFormData.first_payment = `${fpYear}-${fpMonth}-${fpDay}`;
      }
    } else {
      // ?œí”Œë¦¿ì´ ?†ìœ¼ë©??”ì?ê¸‰ì´??ê³„ì‚°
      const mp = parseInt(newFormData.monthly_payment) || 0;
      const os = parseInt(newFormData.other_support) || 0;
      newFormData.total_monthly_payment = mp + os;
    }

    setFormData(newFormData);
  };

  const handleOtherSupportChange = (value) => {
    const newFormData = { ...formData, other_support: value };

    // ??ì§€ê¸‰ì´??ê³„ì‚° (?¬ì?˜ìµê¸?+ ê¸°í?ì§€?ê¸ˆ)
    const monthlyPayment = parseInt(newFormData.monthly_payment || 0) || 0;
    const otherSupport = parseInt(value || 0) || 0;
    newFormData.total_monthly_payment = monthlyPayment + otherSupport;

    setFormData(newFormData);
  };






  const validateForm = () => {
    const newErrors = {};

    if (!formData.contract_type_id) newErrors.contract_type_id = 'ê³„ì•½ì¢…ë¥˜???„ìˆ˜?…ë‹ˆ??;
    if (!formData.contractor_name) newErrors.contractor_name = 'ê³„ì•½?ëª…?€ ?„ìˆ˜?…ë‹ˆ??;
    if (!formData.contract_date) newErrors.contract_date = 'ê³„ì•½?¼ì? ?„ìˆ˜?…ë‹ˆ??;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      alert('?„ìˆ˜ ??ª©???…ë ¥?´ì£¼?¸ìš”');
      return;
    }

    setSaving(true);

    try {
      // ë¹?ê°??œê±°
      const dataToSend = {};
      Object.keys(formData).forEach(key => {
        if (formData[key] !== '' && formData[key] !== null && formData[key] !== undefined) {
          dataToSend[key] = formData[key];
        }
      });

      // ?”ì?ê¸‰ì´???¬ê³„??(DB ?€??ì§ì „)
      const monthlyPayment = parseInt(dataToSend.monthly_payment) || 0;
      const otherSupport = parseInt(dataToSend.other_support) || 0;
      dataToSend.total_monthly_payment = monthlyPayment + otherSupport;

      const response = await fetch('${import.meta.env.VITE_API_URL}/api/contracts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSend),
      });

      if (!response.ok) {
        throw new Error('ê³„ì•½ ?ì„± ?¤íŒ¨');
      }

      alert('ê³„ì•½???ì„±?˜ì—ˆ?µë‹ˆ??);
      navigate('/contracts');

    } catch (error) {
      alert('ê³„ì•½ ?ì„±???¤íŒ¨?ˆìŠµ?ˆë‹¤');
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
            ê³„ì•½???±ë¡
          </h1>
        </div>


        {/* ê³„ì•½ ?•ë³´ ??*/}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg p-5 space-y-4">
          <h2 className="font-bold" style={{ color: '#115e59', fontSize: '18px' }}>
            ê³„ì•½ ?•ë³´
          </h2>

          {/* ê³„ì•½ì¢…ë¥˜ / ?œí–‰??? íƒ */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="flex items-center justify-between mb-2">
                <span className="font-bold" style={{ color: '#115e59', fontSize: '15px' }}>
                  ê³„ì•½ì¢…ë¥˜ <span style={{ color: '#ef4444' }}>*</span>
                </span>
              </label>
              <select
                value={formData.contract_type_id}
                onChange={handleContractTypeChange}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
                style={{ 
                  borderColor: errors.contract_type_id ? '#ef4444' : '#e5e7eb',
                  fontSize: '15px'
                }}
              >
                <option value="">? íƒ?˜ì„¸??/option>
                {contractTypes.map(type => (
                  <option key={type.id} value={type.id}>{type.name}</option>
                ))}
              </select>
            </div>

            {/* ?œí–‰??? íƒ */}
            <div>
              <label className="block mb-2 font-bold" style={{ color: '#115e59', fontSize: '15px' }}>
                ?œí–‰??? íƒ
              </label>
              {templates.length > 0 ? (
                <>
                  <select
                    value={selectedTemplate?.id || ''}
                    onChange={handleTemplateSelect}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
                    style={{ fontSize: '15px' }}
                    disabled={!formData.contract_type_id}
                  >
                    <option value="">?œí–‰?¼ì„ ? íƒ?˜ì„¸??/option>
                    {templates.map(template => (
                      <option key={template.id} value={template.id}>
                        {template.effective_date}
                      </option>
                    ))}
                  </select>
                  {selectedTemplate && (
                    <p className="text-xs mt-1" style={{ color: '#10b981' }}>
                      ??? íƒ???œí–‰?¼ì˜ ê³„ì•½ ì¡°ê±´???ë™?¼ë¡œ ?ìš©?˜ì—ˆ?µë‹ˆ??
                    </p>
                  )}
                </>
              ) : (
                <p className="text-sm py-2" style={{ color: '#6b7280' }}>
                  {formData.contract_type_id ? '? íƒ ê°€?¥í•œ ?œí–‰?¼ì´ ?†ìŠµ?ˆë‹¤' : 'ë¨¼ì? ê³„ì•½ì¢…ë¥˜ë¥?? íƒ?˜ì„¸??}
                </p>
              )}
            </div>
          </div>

          {/* ê³„ì•½??/ ê³„ì•½ì¢…ë£Œ??*/}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="flex items-center justify-between mb-2">
                <span className="font-bold" style={{ color: '#115e59', fontSize: '15px' }}>
                  ê³„ì•½??<span style={{ color: '#ef4444' }}>*</span>
                </span>
              </label>
              <input
                type="date"
                value={formData.contract_date}
                onChange={handleContractDateChange}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
                style={{ 
                  fontSize: '15px'
                }}
              />
            </div>

            <div>
              <label className="flex items-center justify-between mb-2">
                <span className="font-bold" style={{ color: '#115e59', fontSize: '15px' }}>
                  ê³„ì•½ì¢…ë£Œ??
                </span>
              </label>
              <input
                type="date"
                value={formData.contract_end_date}
                onChange={(e) => setFormData({ ...formData, contract_end_date: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
                style={{ 
                  fontSize: '15px'
                }}
              />
            </div>
          </div>

          {/* ê³„ì•½?ëª… / ?°ë½ì²?/ ?´ë©”??*/}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="flex items-center justify-between mb-2">
                <span className="font-bold" style={{ color: '#115e59', fontSize: '15px' }}>
                  ê³„ì•½?ëª… <span style={{ color: '#ef4444' }}>*</span>
                </span>
              </label>
              <input
                type="text"
                value={formData.contractor_name}
                onChange={(e) => setFormData({ ...formData, contractor_name: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
                style={{ 
                  fontSize: '15px'
                }}
                placeholder="?ê¸¸??
              />
            </div>

            <div>
              <label className="flex items-center justify-between mb-2">
                <span className="font-bold" style={{ color: '#115e59', fontSize: '15px' }}>
                  ?°ë½ì²?
                </span>
              </label>
              <input
                type="tel"
                value={formData.phone_number}
                onChange={(e) => {
                  let value = e.target.value.replace(/[^0-9]/g, '');
                  if (value.length <= 11) {
                    if (value.length > 3 && value.length <= 7) {
                      value = value.slice(0, 3) + '-' + value.slice(3);
                    } else if (value.length > 7) {
                      value = value.slice(0, 3) + '-' + value.slice(3, 7) + '-' + value.slice(7);
                    }
                    setFormData({ ...formData, phone_number: value });
                  }
                }}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
                style={{ 
                  fontSize: '15px'
                }}
                placeholder="010-1234-5678"
              />
            </div>

            <div>
              <label className="flex items-center justify-between mb-2">
                <span className="font-bold" style={{ color: '#115e59', fontSize: '15px' }}>
                  ?´ë©”??
                </span>
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
                style={{ 
                  fontSize: '15px'
                }}
                placeholder="example@email.com"
              />
            </div>
          </div>

          {/* ì£¼ì†Œ */}
          <div>
            <label className="flex items-center justify-between mb-2">
              <span className="font-bold" style={{ color: '#115e59', fontSize: '15px' }}>
                ì£¼ì†Œ
              </span>
            </label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
              style={{ 
                fontSize: '15px'
              }}
              placeholder="?œìš¸??ê°•ë‚¨êµ?.."
            />
          </div>

          {/* ?€?‰ëª… / ê³„ì¢Œë²ˆí˜¸ / ?ˆê¸ˆì£?*/}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="flex items-center justify-between mb-2">
                <span className="font-bold" style={{ color: '#115e59', fontSize: '15px' }}>
                  ?€?‰ëª…
                </span>
              </label>
              <input
                type="text"
                value={formData.recipient_bank}
                onChange={(e) => setFormData({ ...formData, recipient_bank: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
                style={{ 
                  fontSize: '15px'
                }}
                placeholder="? í•œ?€??
              />
            </div>

            <div>
              <label className="flex items-center justify-between mb-2">
                <span className="font-bold" style={{ color: '#115e59', fontSize: '15px' }}>
                  ê³„ì¢Œë²ˆí˜¸
                </span>
              </label>
              <input
                type="text"
                value={formData.recipient_account}
                onChange={(e) => setFormData({ ...formData, recipient_account: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
                style={{ 
                  fontSize: '15px'
                }}
                placeholder="110-123-456789"
              />
            </div>

            <div>
              <label className="block mb-2 font-bold" style={{ color: '#115e59', fontSize: '15px' }}>
                ?ˆê¸ˆì£?
              </label>
              <input
                type="text"
                value={formData.recipient_name}
                onChange={(e) => setFormData({ ...formData, recipient_name: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
                style={{ fontSize: '15px' }}
                placeholder="?ê¸¸??
              />
            </div>
          </div>

          {/* ?¬ìê¸ˆì•¡ / ì²?ì§€ê¸‰ì¼ */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="flex items-center justify-between mb-2">
                <span className="font-bold" style={{ color: '#115e59', fontSize: '15px' }}>
                  ?¬ìê¸ˆì•¡
                </span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.amount ? parseInt(formData.amount).toLocaleString() : ''}
                  onChange={(e) => {
                    const value = e.target.value.replace(/,/g, '');
                    if (!isNaN(value) || value === '') {
                      setFormData({ ...formData, amount: value });
                    }
                  }}
                  onBlur={(e) => {
                    const value = e.target.value.replace(/,/g, '');
                    if (value && selectedTemplate) {
                      const unitAmount = selectedTemplate.unit_amount || 10000000;
                      if (parseInt(value) < unitAmount) {
                        alert(`ìµœì†Œ?¬ì?¨ìœ„??${unitAmount.toLocaleString()}???…ë‹ˆ??`);
                        return;
                      }
                      handleAmountChange(value);
                    }
                  }}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
                  style={{ 
                    fontSize: '15px',
                    textAlign: 'right',
                    paddingRight: '40px'
                  }}
                  placeholder="30,000,000"
                />
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2" style={{ color: '#6b7280', fontSize: '15px' }}>
                  ??
                </span>
              </div>
            </div>

            <div>
              <label className="block mb-2 font-bold" style={{ color: '#115e59', fontSize: '15px' }}>
                ì²?ì§€ê¸‰ì¼
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

          {/* ?¬ì?˜ìµê¸?/ ê¸°í?ì§€?ê¸ˆ / ??ì§€ê¸‰ì´??*/}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="flex items-center justify-between mb-2">
                <span className="font-bold" style={{ color: '#115e59', fontSize: '15px' }}>
                  ?¬ì?˜ìµê¸?
                </span>
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
                    fontSize: '15px',
                    textAlign: 'right',
                    paddingRight: '40px'
                  }}
                  placeholder="1,500,000"
                />
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2" style={{ color: '#6b7280', fontSize: '15px' }}>
                  ??
                </span>
              </div>
            </div>

            <div>
              <label className="block mb-2 font-bold" style={{ color: '#115e59', fontSize: '15px' }}>
                ê¸°í?ì§€?ê¸ˆ
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
                  ??
                </span>
              </div>
            </div>

            <div>
              <label className="block mb-2 font-bold" style={{ color: '#115e59', fontSize: '15px' }}>
                ??ì§€ê¸‰ì´??
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
                  ??
                </span>
              </div>
            </div>
          </div>

          {/* ë©”ëª¨ */}
          <div>
            <label className="block mb-2 font-bold" style={{ color: '#115e59', fontSize: '15px' }}>
              ë©”ëª¨
            </label>
            <textarea
              value={formData.memo}
              onChange={(e) => setFormData({ ...formData, memo: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
              style={{ fontSize: '15px' }}
              rows="2"
              placeholder="ë©”ëª¨ë¥??…ë ¥?˜ì„¸??
            />
          </div>

          {/* ë²„íŠ¼ */}
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
              ì·¨ì†Œ
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
              {saving ? '?€??ì¤?..' : '?±ë¡'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}