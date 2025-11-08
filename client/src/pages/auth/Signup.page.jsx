import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../config/supabase';
import { Mail, Lock, User, AlertCircle } from 'lucide-react';

export default function SignupPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // 이름 검증
    if (formData.fullName.trim().length < 2) {
      setError('이름은 최소 2자 이상 입력해주세요.');
      return;
    }

    // 비밀번호 확인
    if (formData.password !== formData.confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }

    // 비밀번호 길이 확인
    if (formData.password.length < 6) {
      setError('비밀번호는 최소 6자 이상이어야 합니다.');
      return;
    }

    setLoading(true);

    try {
      // 1. 회원가입
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
          },
          emailRedirectTo: undefined // 이메일 확인 비활성화
        }
      });

      if (signUpError) throw signUpError;

      // profiles 테이블에 직접 추가
      if (authData.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: authData.user.id,
            email: formData.email,
            full_name: formData.fullName,
            role: 'pending'
          });

        if (profileError) {
          console.error('프로필 생성 오류 상세:', JSON.stringify(profileError, null, 2));
          console.error('에러 코드:', profileError.code);
          console.error('에러 메시지:', profileError.message);
          console.error('에러 상세:', profileError.details);
          throw new Error(profileError.message || '프로필 생성 중 오류가 발생했습니다.');
        }
      }

      alert('회원가입이 완료되었습니다. 관리자 승인 후 로그인이 가능합니다.');
      navigate('/login');

    } catch (error) {
      console.error('회원가입 오류:', error);
      setError(error.message || '회원가입에 실패했습니다.');
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
            계약 관리 시스템에 가입하세요
          </p>
        </div>

        {/* 회원가입 폼 */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 에러 메시지 */}
            {error && (
              <div className="flex items-center gap-2 p-4 rounded-lg" style={{ backgroundColor: '#fef2f2' }}>
                <AlertCircle size={20} style={{ color: '#ef4444' }} />
                <p style={{ color: '#ef4444', fontSize: '14px' }}>{error}</p>
              </div>
            )}

            {/* 이름 */}
            <div>
              <label className="block mb-2 font-bold" style={{ color: '#000000', fontSize: '15px' }}>
                이름
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2" 
                      size={20} 
                      style={{ color: '#9ca3af' }} />
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2"
                  style={{ 
                    borderColor: '#e5e7eb',
                    fontSize: '15px'
                  }}
                  placeholder="홍길동"
                  required
                />
              </div>
            </div>

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
                  placeholder="최소 6자 이상"
                  required
                />
              </div>
            </div>

            {/* 비밀번호 확인 */}
            <div>
              <label className="block mb-2 font-bold" style={{ color: '#000000', fontSize: '15px' }}>
                비밀번호 확인
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2" 
                      size={20} 
                      style={{ color: '#9ca3af' }} />
                <input
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2"
                  style={{ 
                    borderColor: '#e5e7eb',
                    fontSize: '15px'
                  }}
                  placeholder="비밀번호 재입력"
                  required
                />
              </div>
            </div>

            {/* 회원가입 버튼 */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 font-bold text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
              style={{ 
                backgroundColor: '#249689',
                fontSize: '15px'
              }}
            >
              {loading ? '가입 중...' : '회원가입'}
            </button>
          </form>

          {/* 로그인 링크 */}
          <div className="mt-6 text-center">
            <p style={{ color: '#6b7280', fontSize: '14px' }}>
              이미 계정이 있으신가요?{' '}
              <Link 
                to="/login" 
                className="font-bold hover:underline"
                style={{ color: '#249689' }}
              >
                로그인
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}