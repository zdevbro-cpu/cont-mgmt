import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, Settings, Users, FileText } from 'lucide-react';

export default function Navigation() {
  const navigate = useNavigate();
  const { user, userRole, signOut } = useAuth();

  const handleLogout = async () => {
    if (confirm('로그아웃 하시겠습니까?')) {
      try {
        await signOut();
        navigate('/login');
      } catch (error) {
        console.error('로그아웃 오류:', error);
        alert('로그아웃에 실패했습니다.');
      }
    }
  };

  return (
    <nav className="bg-white border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* 로고 */}
          <Link to="/contracts" className="flex items-center gap-3">
            <img src="/images/logo.png" alt="Logo" className="h-10" />
            <span className="font-bold" style={{ color: '#249689', fontSize: '24px' }}>
              계약관리시스템
            </span>
          </Link>

          {/* 메뉴 */}
          <div className="flex items-center gap-4">
            {/* 계약서 관리 */}
            <Link
              to="/contracts"
              className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
              style={{ fontSize: '15px', color: '#000000' }}
            >
              <FileText size={18} style={{ color: '#249689' }} />
              계약서 관리
            </Link>

            {/* 지급 관리 */}
            <Link
              to="/payments"
              className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
              style={{ fontSize: '15px', color: '#000000' }}
            >
              <FileText size={18} style={{ color: '#249689' }} />
              지급 관리
            </Link>

            {/* 관리자 메뉴 */}
            {userRole === 'admin' && (
              <>
                <Link
                  to="/admin/contract-types"
                  className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                  style={{ fontSize: '15px', color: '#000000' }}
                >
                  <Settings size={18} style={{ color: '#249689' }} />
                  계약종류 관리
                </Link>

                <Link
                  to="/admin/users"
                  className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                  style={{ fontSize: '15px', color: '#000000' }}
                >
                  <Users size={18} style={{ color: '#249689' }} />
                  유저 관리
                </Link>
              </>
            )}

            {/* 로그아웃 */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
              style={{ fontSize: '15px', color: '#000000' }}
            >
              <LogOut size={18} style={{ color: '#ef4444' }} />
              로그아웃
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}