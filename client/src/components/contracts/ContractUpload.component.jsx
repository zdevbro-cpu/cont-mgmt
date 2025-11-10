import { useState } from 'react';
import { Upload, FileText, AlertCircle } from 'lucide-react';
import ContractAnalysisResult from './ContractAnalysisResult.component';

export default function ContractUpload({ onComplete }) {
  const [file, setFile] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    // ?Œì¼ ?€??ê²€ì¦?
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(selectedFile.type)) {
      setError('PDF, JPG, PNG ?Œì¼ë§??…ë¡œ??ê°€?¥í•©?ˆë‹¤.');
      return;
    }

    // ?Œì¼ ?¬ê¸° ê²€ì¦?(10MB)
    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('?Œì¼ ?¬ê¸°??10MB ?´í•˜?¬ì•¼ ?©ë‹ˆ??');
      return;
    }

    setFile(selectedFile);
    setError('');
    handleAnalyze(selectedFile);
  };

  const handleAnalyze = async (fileToAnalyze) => {
    setAnalyzing(true);
    setError('');

    const formData = new FormData();
    formData.append('file', fileToAnalyze);

    try {
      const response = await fetch('${import.meta.env.VITE_API_URL}/api/contracts/analyze', {
        method: 'POST',
        // ?„ì‹œ: ?¸ì¦ ?¤ë” ?œê±°
        // headers: {
        //   'Authorization': `Bearer ${localStorage.getItem('token')}`
        // },
        body: formData
      });

      if (!response.ok) {
        throw new Error('ê³„ì•½??ë¶„ì„???¤íŒ¨?ˆìŠµ?ˆë‹¤.');
      }

      const data = await response.json();
      setResult(data);

    } catch (err) {
      setError(err.message || 'ë¶„ì„ ì¤??¤ë¥˜ê°€ ë°œìƒ?ˆìŠµ?ˆë‹¤.');
      console.error('ë¶„ì„ ?¤ë¥˜:', err);
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ?Œì¼ ?…ë¡œ???ì—­ */}
      {!result && (
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div 
            className="border-2 border-dashed rounded-lg p-12 text-center hover:border-opacity-100 transition-all cursor-pointer"
            style={{ borderColor: '#249689', borderRadius: '10px' }}
          >
            <Upload size={64} style={{ color: '#249689' }} className="mx-auto mb-4" />
            
            <label className="cursor-pointer">
              <span className="font-bold hover:opacity-70 transition-opacity" style={{ color: '#249689', fontSize: '15px' }}>
                ?Œì¼ ? íƒ
              </span>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileSelect}
                className="hidden"
              />
            </label>
            
            <p className="mt-3" style={{ color: '#6b7280', fontSize: '15px' }}>
              ?ëŠ” ?Œì¼???œë˜ê·¸í•˜???…ë¡œ??
            </p>
            <p className="mt-2" style={{ color: '#9ca3af', fontSize: '15px' }}>
              PDF, JPG, PNG (ìµœë? 10MB)
            </p>
          </div>
        </div>
      )}

      {/* ? íƒ???Œì¼ ?•ë³´ */}
      {file && !result && !analyzing && (
        <div className="bg-white rounded-lg shadow-lg p-4">
          <div className="flex items-center">
            <FileText size={32} style={{ color: '#249689' }} className="mr-3" />
            <div className="flex-1">
              <p className="font-bold" style={{ color: '#000000', fontSize: '15px' }}>{file.name}</p>
              <p style={{ color: '#6b7280', fontSize: '15px' }}>
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ?ëŸ¬ ë©”ì‹œì§€ */}
      {error && (
        <div className="bg-white rounded-lg shadow-lg p-4">
          <div className="flex items-start" style={{ borderLeft: '4px solid #dc2626', paddingLeft: '12px' }}>
            <AlertCircle size={20} style={{ color: '#dc2626' }} className="mr-3 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold" style={{ color: '#dc2626', fontSize: '15px' }}>?¤ë¥˜ ë°œìƒ</p>
              <p style={{ color: '#dc2626', fontSize: '15px' }} className="mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* ë¶„ì„ ì¤?*/}
      {analyzing && (
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-full" style={{ border: '4px solid #d1fae5' }}></div>
              <div 
                className="w-16 h-16 rounded-full animate-spin absolute top-0 left-0"
                style={{ border: '4px solid #249689', borderTopColor: 'transparent' }}
              ></div>
            </div>
          </div>
          <h3 className="font-bold mb-2" style={{ color: '#000000', fontSize: '18px' }}>
            AIê°€ ê³„ì•½?œë? ë¶„ì„?˜ê³  ?ˆìŠµ?ˆë‹¤
          </h3>
          <p style={{ color: '#6b7280', fontSize: '15px' }}>
            ? ì‹œë§?ê¸°ë‹¤?¤ì£¼?¸ìš”... (??10-30ì´??Œìš”)
          </p>
          <div className="mt-6 space-y-2">
            <p style={{ color: '#6b7280', fontSize: '15px' }}>??ê³„ì•½???ìŠ¤??ì¶”ì¶œ ì¤?/p>
            <p style={{ color: '#6b7280', fontSize: '15px' }}>??ê³„ì•½ ?•ë³´ ë¶„ì„ ì¤?/p>
            <p style={{ color: '#6b7280', fontSize: '15px' }}>??ì§€ê¸?ì¡°ê±´ ê³„ì‚° ì¤?/p>
          </div>
        </div>
      )}

      {/* ë¶„ì„ ê²°ê³¼ */}
      {result && !analyzing && (
        <ContractAnalysisResult
          result={result}
          fileName={file?.name}
          onComplete={onComplete}
          onRetry={() => {
            setResult(null);
            setFile(null);
            setError('');
          }}
        />
      )}
    </div>
  );
}