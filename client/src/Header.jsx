import React from 'react'
import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const Header = ({ title, onBack, showBackButton = true }) => {
  const navigate = useNavigate()

  const handleBack = () => {
    if (onBack) {
      onBack()
    } else {
      navigate(-1)
    }
  }

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* 좌측: 뒤로가기 + 나가기 */}
          <div className="flex items-center gap-2">
            {showBackButton && (
              <button
                onClick={handleBack}
                className="flex items-center gap-1 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft size={20} />
                <span className="text-sm">나가기</span>
              </button>
            )}
          </div>

          {/* 중앙: 로고 + 제목 */}
          <div className="absolute left-1/2 transform -translate-x-1/2 flex items-center gap-2">
            <img 
              src="/images/logo.png" 
              alt="Logo" 
              className="h-6 w-6"
              onError={(e) => {
                e.target.style.display = 'none'
              }}
            />
            <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
          </div>

          {/* 우측: 여백 */}
          <div className="w-20"></div>
        </div>
      </div>
    </header>
  )
}

export default Header
