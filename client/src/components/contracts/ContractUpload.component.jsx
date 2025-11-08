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

    // 파일 타입 검증
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(selectedFile.type)) {
      setError('PDF, JPG, PNG 파일만 업로드 가능합니다.');
      return;
    }

    // 파일 크기 검증 (10MB)
    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('파일 크기는 10MB 이하여야 합니다.');
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
      const response = await fetch('http://localhost:5000/api/contracts/analyze', {
        method: 'POST',
        // 임시: 인증 헤더 제거
        // headers: {
        //   'Authorization': `Bearer ${localStorage.getItem('token')}`
        // },
        body: formData
      });

      if (!response.ok) {
        throw new Error('계약서 분석에 실패했습니다.');
      }

      const data = await response.json();
      setResult(data);

    } catch (err) {
      setError(err.message || '분석 중 오류가 발생했습니다.');
      console.error('분석 오류:', err);
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 파일 업로드 영역 */}
      {!result && (
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div 
            className="border-2 border-dashed rounded-lg p-12 text-center hover:border-opacity-100 transition-all cursor-pointer"
            style={{ borderColor: '#249689', borderRadius: '10px' }}
          >
            <Upload size={64} style={{ color: '#249689' }} className="mx-auto mb-4" />
            
            <label className="cursor-pointer">
              <span className="font-bold hover:opacity-70 transition-opacity" style={{ color: '#249689', fontSize: '15px' }}>
                파일 선택
              </span>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileSelect}
                className="hidden"
              />
            </label>
            
            <p className="mt-3" style={{ color: '#6b7280', fontSize: '15px' }}>
              또는 파일을 드래그하여 업로드
            </p>
            <p className="mt-2" style={{ color: '#9ca3af', fontSize: '15px' }}>
              PDF, JPG, PNG (최대 10MB)
            </p>
          </div>
        </div>
      )}

      {/* 선택된 파일 정보 */}
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

      {/* 에러 메시지 */}
      {error && (
        <div className="bg-white rounded-lg shadow-lg p-4">
          <div className="flex items-start" style={{ borderLeft: '4px solid #dc2626', paddingLeft: '12px' }}>
            <AlertCircle size={20} style={{ color: '#dc2626' }} className="mr-3 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold" style={{ color: '#dc2626', fontSize: '15px' }}>오류 발생</p>
              <p style={{ color: '#dc2626', fontSize: '15px' }} className="mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* 분석 중 */}
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
            AI가 계약서를 분석하고 있습니다
          </h3>
          <p style={{ color: '#6b7280', fontSize: '15px' }}>
            잠시만 기다려주세요... (약 10-30초 소요)
          </p>
          <div className="mt-6 space-y-2">
            <p style={{ color: '#6b7280', fontSize: '15px' }}>✓ 계약서 텍스트 추출 중</p>
            <p style={{ color: '#6b7280', fontSize: '15px' }}>✓ 계약 정보 분석 중</p>
            <p style={{ color: '#6b7280', fontSize: '15px' }}>✓ 지급 조건 계산 중</p>
          </div>
        </div>
      )}

      {/* 분석 결과 */}
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