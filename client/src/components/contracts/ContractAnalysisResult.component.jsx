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
      // ê³„ì•½ ë²ˆí˜¸ ?ì„±
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

      console.log('?’¾ ê³„ì•½ ?€???”ì²­:', contractData);

      const response = await fetch('${import.meta.env.VITE_API_URL}/api/contracts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(contractData)
      });

      console.log('?” ?‘ë‹µ ?íƒœ:', response.status);

      // ?±ê³µ/?¤íŒ¨ ?ê??†ì´ ?‘ë‹µ ?Œì‹±
      let responseData;
      try {
        responseData = await response.json();
      } catch (parseError) {
        console.error('??JSON ?Œì‹± ?¤íŒ¨:', parseError);
        throw new Error('?œë²„ ?‘ë‹µ???½ì„ ???†ìŠµ?ˆë‹¤.');
      }

      if (!response.ok) {
        console.error('???€???¤íŒ¨:', responseData);
        
        // ì¤‘ë³µ ê³„ì•½ ë²ˆí˜¸ ?ëŸ¬ - ?ë™ ?¬ì‹œ??
        if (responseData.duplicate === true) {
          console.log('? ï¸ ê³„ì•½ë²ˆí˜¸ ì¤‘ë³µ, ?¬ì‹œ??ì¤?..');
          setSaving(false);
          await new Promise(resolve => setTimeout(resolve, 1000));
          setSaving(true);
          return handleSave();
        }
        
        // ê°™ì? ?´ìš©??ê³„ì•½ ì¤‘ë³µ ?ëŸ¬ - ?¬ìš©?ì—ê²??Œë¦¼
        if (responseData.duplicateContent === true) {
          setSaving(false);
          alert('? ï¸ ì¤‘ë³µ??ê³„ì•½?…ë‹ˆ??\n\n' + responseData.error);
          return;
        }
        
        setSaving(false);
        throw new Error(responseData.error || 'ê³„ì•½???€?¥ì— ?¤íŒ¨?ˆìŠµ?ˆë‹¤.');
      }

      console.log('???€???±ê³µ:', responseData);

      // ê²€ì¦??„ë£Œ ê¸°ë¡
      if (result.confidence < 100) {
        const corrections = {};
        for (const key in editedData) {
          if (editedData[key] !== result.data[key]) {
            corrections[key] = editedData[key];
          }
        }

        if (Object.keys(corrections).length > 0) {
          await fetch(`${import.meta.env.VITE_API_URL}/api/contracts/${responseData.contract.id}/verify`, {
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
      console.error('?€???¤ë¥˜:', error);
      alert(error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* ?¤ë” */}
      <div className="p-6" style={{ background: 'linear-gradient(90deg, #249689 0%, #1e7a6f 100%)' }}>
        <div className="flex items-center justify-between text-white">
          <div>
            <h3 className="font-bold mb-1" style={{ fontSize: '18px' }}>ë¶„ì„ ?„ë£Œ</h3>
            <p style={{ fontSize: '15px', opacity: 0.9 }}>
              {fileName} ??{result.method === 'template' ? '?œí”Œë¦?ê¸°ë°˜' : 'AI ë¶„ì„'}
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
            <p style={{ fontSize: '15px', opacity: 0.75 }}>? ë¢°??/p>
          </div>
        </div>
      </div>

      {/* ê²€???„ìš” ?Œë¦¼ */}
      {result.needsReview && (
        <div className="p-4" style={{ backgroundColor: '#fef3c7', borderLeft: '4px solid #f59e0b' }}>
          <div className="flex items-start">
            <AlertCircle size={20} style={{ color: '#f59e0b' }} className="mr-3 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold" style={{ color: '#92400e', fontSize: '15px' }}>
                ì¶”ì¶œ???•ë³´ë¥??•ì¸?´ì£¼?¸ìš”
              </p>
              <p style={{ color: '#92400e', fontSize: '15px' }} className="mt-1">
                ? ë¢°?„ê? ??•„ ?¼ë? ?•ë³´ê°€ ?•í™•?˜ì? ?Šì„ ???ˆìŠµ?ˆë‹¤. ê°???ª©??ê²€? í•˜ê³??„ìš”???˜ì •?´ì£¼?¸ìš”.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ì¶”ì¶œ???°ì´??*/}
      <div className="p-6 space-y-4">
        <EditableField
          label="ê³„ì•½ëª?
          value={editedData.contract_name}
          onChange={(v) => handleFieldEdit('contract_name', v)}
          required
        />

        <EditableField
          label="ê³„ì•½???´ë¦„"
          value={editedData.contractor_name}
          onChange={(v) => handleFieldEdit('contractor_name', v)}
          required
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <EditableField
            label="?„í™”ë²ˆí˜¸"
            value={editedData.phone_number}
            onChange={(v) => handleFieldEdit('phone_number', v)}
            required
          />

          <EditableField
            label="?´ë©”??
            value={editedData.email}
            onChange={(v) => handleFieldEdit('email', v)}
            type="email"
          />
        </div>

        <EditableField
          label="ì£¼ì†Œ"
          value={editedData.address}
          onChange={(v) => handleFieldEdit('address', v)}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <EditableField
            label="ê³„ì•½??
            value={editedData.contract_date}
            onChange={(v) => handleFieldEdit('contract_date', v)}
            type="date"
            required
          />

          <EditableField
            label="?¬ìê¸ˆì•¡"
            value={editedData.amount}
            onChange={(v) => handleFieldEdit('amount', v)}
            type="number"
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <EditableField
            label="ê²°ì œ ë°©ë²•"
            value={editedData.payment_method}
            onChange={(v) => handleFieldEdit('payment_method', v)}
            type="select"
            options={['?„ê¸ˆ', 'ì¹´ë“œ', '?…ê¸ˆ']}
          />

          <EditableField
            label="ê¸ˆìœµê¸°ê?"
            value={editedData.bank_name}
            onChange={(v) => handleFieldEdit('bank_name', v)}
          />

          <EditableField
            label="ê³„ì¢Œë²ˆí˜¸"
            value={editedData.account_number}
            onChange={(v) => handleFieldEdit('account_number', v)}
          />
        </div>

        <EditableField
          label="ìµœì´ˆ ì§€ê¸‰ì¼"
          value={editedData.first_payment_date}
          onChange={(v) => handleFieldEdit('first_payment_date', v)}
          type="date"
        />

        <EditableField
          label="ë©”ëª¨"
          value={editedData.memo}
          onChange={(v) => handleFieldEdit('memo', v)}
          multiline
        />
      </div>

      {/* ?¡ì…˜ ë²„íŠ¼ */}
      <div className="bg-gray-50 px-6 py-4 flex justify-between items-center">
        <button
          onClick={onRetry}
          className="font-bold hover:opacity-70 transition-opacity"
          style={{ color: '#6b7280', fontSize: '15px' }}
        >
          ?¤ì‹œ ?…ë¡œ??
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
              ?€??ì¤?..
            </>
          ) : (
            <>
              <Save size={18} className="mr-2" />
              ?•ì¸ ë°??€??
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// ?¸ì§‘ ê°€?¥í•œ ?„ë“œ ì»´í¬?ŒíŠ¸
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
              <option value="">? íƒ?˜ì„¸??/option>
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
            {value || '?…ë ¥?˜ì? ?ŠìŒ'}
          </span>
          <Edit2 size={16} style={{ color: '#9ca3af' }} className="group-hover:opacity-100" />
        </div>
      )}
    </div>
  );
}