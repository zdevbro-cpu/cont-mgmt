import { useNavigate, useLocation } from 'react-router-dom';
import { FileText, DollarSign } from 'lucide-react';

export default function Navigation() {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname.startsWith(path);
  };

  const menuItems = [
    {
      path: '/contracts',
      label: '계약 관리',
      icon: FileText
    },
    {
      path: '/payments',
      label: '지급 관리',
      icon: DollarSign
    }
  ];

  return (
    <div className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between px-6 py-4">
          {/* 로고 */}
          <div 
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => navigate('/')}
          >
            <img 
              src="/images/logo.png" 
              alt="Logo" 
              className="h-10"
              onError={(e) => e.target.style.display = 'none'}
            />
            <h1 className="font-bold" style={{ color: '#249689', fontSize: '36px' }}>
              계약서 등록
            </h1>
          </div>

          {/* 메뉴 */}
          <nav className="flex gap-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className="flex items-center gap-2 px-6 py-3 font-bold rounded-lg transition-all"
                  style={{
                    backgroundColor: active ? '#249689' : '#ffffff',
                    color: active ? '#ffffff' : '#6b7280',
                    fontSize: '15px',
                    border: active ? 'none' : '2px solid #e5e7eb'
                  }}
                >
                  <Icon size={18} />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    </div>
  );
}