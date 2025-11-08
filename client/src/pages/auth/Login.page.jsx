import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../config/supabase';
import { Mail, Lock, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) throw error;

      // 승인 상태 확인
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single();

      if (profile?.role === 'pending') {
        await supabase.auth.signOut();
        throw new Error('관리자 승인 대기 중입니다. 승인 후 로그인해주세요.');
      }

      // 로그인 성공
      navigate('/contracts');

    } catch (error) {
      console.error('로그인 오류:', error);
      setError(error.message || '로그인에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f9fafb' }}>
      <div className="w-full max-w-md">
        {/* 로고 및 타이틀 */}
        <div className="text-center mb-8">
          <img src="/images/logo.png" alt="Logo" className="h-16 mx-auto mb-4" />
          <h1 className="font-bold" style={{ color: '#249689', fontSize: '36px' }}>
            계약관리시스템
          </h1>
          <p className="mt-2" style={{ color: '#6b7280', fontSize: '15px' }}>
            계약 관리 시스템에 로그인하세요
          </p>
        </div>

        {/* 로그인 폼 */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 에러 메시지 */}
            {error && (
              <div className="flex items-center gap-2 p-4 rounded-lg" style={{ backgroundColor: '#fef2f2' }}>
                <AlertCircle size={20} style={{ color: '#ef4444' }} />
                <p style={{ color: '#ef4444', fontSize: '14px' }}>{error}</p>
              </div>
            )}

            {/* 이메일 */}
            <div>
              <label className="block mb-2 font-bold" style={{ color: '#000000', fontSize: '15px' }}>
                이메일
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2" 
                      size={20} 
                      style={{ color: '#9ca3af' }} />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2"
                  style={{ 
                    borderColor: '#e5e7eb',
                    fontSize: '15px'
                  }}
                  placeholder="example@email.com"
                  required
                />
              </div>
            </div>

            {/* 비밀번호 */}
            <div>
              <label className="block mb-2 font-bold" style={{ color: '#000000', fontSize: '15px' }}>
                비밀번호
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2" 
                      size={20} 
                      style={{ color: '#9ca3af' }} />
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2"
                  style={{ 
                    borderColor: '#e5e7eb',
                    fontSize: '15px'
                  }}
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {/* 로그인 버튼 */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 font-bold text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
              style={{ 
                backgroundColor: '#249689',
                fontSize: '15px'
              }}
            >
              {loading ? '로그인 중...' : '로그인'}
            </button>
          </form>

          {/* 회원가입 링크 */}
          <div className="mt-6 text-center">
            <p style={{ color: '#6b7280', fontSize: '14px' }}>
              계정이 없으신가요?{' '}
              <Link 
                to="/signup" 
                className="font-bold hover:underline"
                style={{ color: '#249689' }}
              >
                회원가입
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}