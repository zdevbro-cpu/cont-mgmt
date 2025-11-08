import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function ProtectedRoute({ children, requireAdmin = false }) {
  const { user, userRole, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f9fafb' }}>
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 rounded-full animate-spin" 
               style={{ borderColor: '#249689', borderTopColor: 'transparent' }}>
          </div>
          <p className="mt-4" style={{ color: '#6b7280', fontSize: '15px' }}>
            로딩 중...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && userRole !== 'admin') {
    return <Navigate to="/contracts" replace />;
  }

  return children;
}