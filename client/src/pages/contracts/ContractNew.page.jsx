import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import ContractUpload from '../../components/contracts/ContractUpload.component';

export default function ContractNewPage() {
  const navigate = useNavigate();

  const handleComplete = (contract) => {
    console.log('계약서 등록 완료:', contract);
    alert('계약서가 성공적으로 등록되었습니다!');
    navigate('/contracts');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white shadow-md p-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* 왼쪽: 나가기 버튼 */}
          <button
            onClick={() => navigate('/contracts')}
            className="flex items-center gap-2 font-bold hover:opacity-70 transition-opacity"
            style={{ color: '#249689', fontSize: '15px' }}
          >
            <ArrowLeft size={20} />
            나가기
          </button>
          
          {/* 중앙: 로고 + 페이지 타이틀 */}
          <div className="flex items-center gap-1.5">
            <img 
              src="/images/logo.png" 
              alt="Logo" 
              className="w-10 h-10 object-cover"
              onError={(e) => e.target.style.display = 'none'}
            />
            <h1 className="font-bold" style={{ color: '#249689', fontSize: '36px' }}>
              계약서 등록
            </h1>
          </div>
          
          {/* 오른쪽: 빈 공간 (균형 유지) */}
          <div style={{ width: '100px' }}></div>
        </div>
      </div>

      {/* 메인 컨텐츠 */}
      <div className="max-w-7xl mx-auto p-6">
        {/* 안내 문구 */}
        <div className="mb-6 text-center">
          <p style={{ color: '#6b7280', fontSize: '15px' }}>
            계약서 PDF, JPG, PNG 파일을 업로드하면 AI가 자동으로 분석합니다
          </p>
        </div>

        {/* 업로드 컴포넌트 */}
        <ContractUpload onComplete={handleComplete} />
      </div>
    </div>
  );
}