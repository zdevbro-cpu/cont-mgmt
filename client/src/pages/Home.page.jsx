import { useNavigate } from 'react-router-dom';
import { FileText, DollarSign, ArrowRight } from 'lucide-react';

export default function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f3f4f6' }}>
      {/* 헤더 */}
      <div className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="text-center">
            <img 
              src="/images/logo.png" 
              alt="Logo" 
              className="h-16 mx-auto mb-4"
              onError={(e) => e.target.style.display = 'none'}
            />
            <h1 className="font-bold" style={{ color: '#249689', fontSize: '42px' }}>
              계약서 등록
            </h1>
            <p className="mt-2" style={{ color: '#6b7280', fontSize: '16px' }}>
              계약서 관리 및 지급 스케줄을 한 곳에서
            </p>
          </div>
        </div>
      </div>

      {/* 메인 컨텐츠 */}
      <div className="max-w-5xl mx-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
          {/* 계약 관리 카드 */}
          <button
            onClick={() => navigate('/contracts')}
            className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition-all group text-left"
            style={{ borderRadius: '15px' }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-16 h-16 rounded-full flex items-center justify-center"
                   style={{ backgroundColor: '#e6f7f5' }}>
                <FileText size={32} style={{ color: '#249689' }} />
              </div>
              <ArrowRight size={24} style={{ color: '#249689' }} 
                          className="group-hover:translate-x-2 transition-transform" />
            </div>
            
            <h2 className="font-bold mb-2" style={{ color: '#000000', fontSize: '24px' }}>
              계약 관리
            </h2>
            
            <p className="mb-4" style={{ color: '#6b7280', fontSize: '15px' }}>
              계약서 등록, 조회, 수정 및 삭제를 관리합니다
            </p>

            <ul className="space-y-2" style={{ color: '#6b7280', fontSize: '14px' }}>
              <li>• 계약서 자동 분석 (AI)</li>
              <li>• 계약서 목록 검색 및 필터</li>
              <li>• 계약 정보 상세 조회/수정</li>
              <li>• 중복 계약 방지</li>
            </ul>
          </button>

          {/* 지급 관리 카드 */}
          <button
            onClick={() => navigate('/payments')}
            className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition-all group text-left"
            style={{ borderRadius: '15px' }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-16 h-16 rounded-full flex items-center justify-center"
                   style={{ backgroundColor: '#fff7ed' }}>
                <DollarSign size={32} style={{ color: '#f59e0b' }} />
              </div>
              <ArrowRight size={24} style={{ color: '#f59e0b' }} 
                          className="group-hover:translate-x-2 transition-transform" />
            </div>
            
            <h2 className="font-bold mb-2" style={{ color: '#000000', fontSize: '24px' }}>
              지급 관리
            </h2>
            
            <p className="mb-4" style={{ color: '#6b7280', fontSize: '15px' }}>
              지급 스케줄 및 지급 내역을 관리합니다
            </p>

            <ul className="space-y-2" style={{ color: '#6b7280', fontSize: '14px' }}>
              <li>• 자동 지급 스케줄 생성</li>
              <li>• 오늘/7일 이내 지급 목록</li>
              <li>• 지급 완료 처리</li>
              <li>• 엑셀 다운로드</li>
            </ul>
          </button>
        </div>

        {/* 빠른 시작 가이드 */}
        <div className="bg-white rounded-lg shadow-lg p-8 mt-8" style={{ borderRadius: '15px' }}>
          <h3 className="font-bold mb-4" style={{ color: '#000000', fontSize: '20px' }}>
            빠른 시작 가이드
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="w-10 h-10 rounded-full flex items-center justify-center mb-3"
                   style={{ backgroundColor: '#249689', color: '#ffffff', fontSize: '18px', fontWeight: 'bold' }}>
                1
              </div>
              <h4 className="font-bold mb-2" style={{ color: '#000000', fontSize: '16px' }}>
                계약서 등록
              </h4>
              <p style={{ color: '#6b7280', fontSize: '14px' }}>
                PDF 파일을 업로드하거나 직접 입력하여 계약서를 등록하세요
              </p>
            </div>

            <div>
              <div className="w-10 h-10 rounded-full flex items-center justify-center mb-3"
                   style={{ backgroundColor: '#249689', color: '#ffffff', fontSize: '18px', fontWeight: 'bold' }}>
                2
              </div>
              <h4 className="font-bold mb-2" style={{ color: '#000000', fontSize: '16px' }}>
                자동 스케줄 생성
              </h4>
              <p style={{ color: '#6b7280', fontSize: '14px' }}>
                계약 종류에 따라 지급 스케줄이 자동으로 생성됩니다
              </p>
            </div>

            <div>
              <div className="w-10 h-10 rounded-full flex items-center justify-center mb-3"
                   style={{ backgroundColor: '#249689', color: '#ffffff', fontSize: '18px', fontWeight: 'bold' }}>
                3
              </div>
              <h4 className="font-bold mb-2" style={{ color: '#000000', fontSize: '16px' }}>
                지급 관리
              </h4>
              <p style={{ color: '#6b7280', fontSize: '14px' }}>
                지급 대시보드에서 오늘 지급할 내역을 확인하고 처리하세요
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}