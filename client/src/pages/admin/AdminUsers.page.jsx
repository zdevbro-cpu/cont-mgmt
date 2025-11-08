import { useEffect, useState } from 'react';
import { Search, Edit2, Trash2, Key, X, Save, AlertCircle, CheckCircle } from 'lucide-react';
import Navigation from '../../components/Navigation.component';

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('edit'); // 'edit' or 'password'
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    role: 'user'
  });
  const [newPassword, setNewPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/users');
      
      if (!response.ok) {
        throw new Error('사용자 조회 실패');
      }

      const data = await response.json();
      setUsers(data.users || []);

    } catch (error) {
      console.error('사용자 조회 오류:', error);
      alert('사용자를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (user) => {
    setModalMode('edit');
    setFormData({
      full_name: user.full_name || '',
      email: user.email || '',
      role: user.role || 'user'
    });
    setSelectedUser(user);
    setErrors({});
    setShowModal(true);
  };

  const openPasswordModal = (user) => {
    setModalMode('password');
    setSelectedUser(user);
    setNewPassword('');
    setErrors({});
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedUser(null);
    setFormData({
      full_name: '',
      email: '',
      role: 'user'
    });
    setNewPassword('');
    setErrors({});
  };

  const validateForm = () => {
    const newErrors = {};

    if (modalMode === 'edit') {
      if (!formData.full_name.trim()) {
        newErrors.full_name = '이름을 입력해주세요';
      }

      if (!formData.email.trim()) {
        newErrors.email = '이메일을 입력해주세요';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = '올바른 이메일 형식이 아닙니다';
      }
    } else if (modalMode === 'password') {
      if (!newPassword.trim()) {
        newErrors.password = '새 비밀번호를 입력해주세요';
      } else if (newPassword.length < 6) {
        newErrors.password = '비밀번호는 최소 6자 이상이어야 합니다';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSaving(true);

    try {
      if (modalMode === 'edit') {
        const response = await fetch(`http://localhost:5000/api/users/${selectedUser.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || '수정 실패');
        }

        alert('사용자 정보가 수정되었습니다.');
      } else if (modalMode === 'password') {
        const response = await fetch(`http://localhost:5000/api/users/${selectedUser.id}/reset-password`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ newPassword }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || '비밀번호 초기화 실패');
        }

        alert('비밀번호가 초기화되었습니다.');
      }

      closeModal();
      loadUsers();

    } catch (error) {
      console.error('저장 오류:', error);
      alert(error.message || '저장하는데 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (user) => {
    if (!confirm(`"${user.full_name}" 사용자를 삭제하시겠습니까?`)) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/users/${user.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '삭제 실패');
      }

      alert('사용자가 삭제되었습니다.');
      loadUsers();

    } catch (error) {
      console.error('삭제 오류:', error);
      alert(error.message || '삭제하는데 실패했습니다.');
    }
  };

  const handleApprove = async (user) => {
    if (!confirm(`"${user.full_name}" 사용자를 승인하시겠습니까?`)) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/users/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: 'user' }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '승인 실패');
      }

      alert('사용자가 승인되었습니다.');
      loadUsers();

    } catch (error) {
      console.error('승인 오류:', error);
      alert(error.message || '승인하는데 실패했습니다.');
    }
  };

  const filteredUsers = users.filter(user =>
    (user.full_name && user.full_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR');
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f9fafb' }}>
      {/* 네비게이션 */}
      <Navigation />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* 검색 */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2" 
                    size={20} 
                    style={{ color: '#9ca3af' }} />
            <input
              type="text"
              placeholder="이름, 이메일로 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2"
              style={{ 
                borderColor: '#e5e7eb',
                fontSize: '15px'
              }}
            />
          </div>

          {/* 검색 결과 수 */}
          <div className="mt-4 pt-4 border-t">
            <span style={{ color: '#6b7280', fontSize: '15px' }}>
              총 <span className="font-bold" style={{ color: '#249689' }}>{filteredUsers.length}</span>명
            </span>
          </div>
        </div>

        {/* 사용자 목록 */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block w-8 h-8 border-4 rounded-full animate-spin" 
                   style={{ borderColor: '#249689', borderTopColor: 'transparent' }}></div>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle size={48} className="mx-auto mb-4" style={{ color: '#9ca3af' }} />
              <p style={{ color: '#6b7280', fontSize: '15px' }}>
                {searchTerm ? '검색 결과가 없습니다.' : '등록된 사용자가 없습니다.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead style={{ backgroundColor: '#f9fafb' }}>
                  <tr>
                    <th className="px-6 py-4 text-left font-bold" style={{ color: '#000000', fontSize: '15px' }}>
                      이름
                    </th>
                    <th className="px-6 py-4 text-left font-bold" style={{ color: '#000000', fontSize: '15px' }}>
                      이메일
                    </th>
                    <th className="px-6 py-4 text-center font-bold" style={{ color: '#000000', fontSize: '15px' }}>
                      역할
                    </th>
                    <th className="px-6 py-4 text-center font-bold" style={{ color: '#000000', fontSize: '15px' }}>
                      가입일
                    </th>
                    <th className="px-6 py-4 text-center font-bold" style={{ color: '#000000', fontSize: '15px' }}>
                      관리
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id} 
                        className="border-t hover:bg-gray-50 transition-colors"
                        style={{ borderColor: '#e5e7eb' }}>
                      <td className="px-6 py-4">
                        <span className="font-bold" style={{ color: '#000000', fontSize: '15px' }}>
                          {user.full_name || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span style={{ color: '#6b7280', fontSize: '15px' }}>
                          {user.email || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                          user.role === 'admin' 
                            ? 'bg-purple-100 text-purple-800' 
                            : user.role === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {user.role === 'admin' ? '관리자' : user.role === 'pending' ? '승인대기' : '사용자'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span style={{ color: '#6b7280', fontSize: '15px' }}>
                          {formatDate(user.created_at)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          {user.role === 'pending' ? (
                            <button
                              onClick={() => handleApprove(user)}
                              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                              title="승인"
                            >
                              <CheckCircle size={18} style={{ color: '#10b981' }} />
                            </button>
                          ) : (
                            <>
                              <button
                                onClick={() => openEditModal(user)}
                                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                                title="수정"
                              >
                                <Edit2 size={18} style={{ color: '#249689' }} />
                              </button>
                              <button
                                onClick={() => openPasswordModal(user)}
                                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                                title="비밀번호 초기화"
                              >
                                <Key size={18} style={{ color: '#f59e0b' }} />
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => handleDelete(user)}
                            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                            title="삭제"
                          >
                            <Trash2 size={18} style={{ color: '#ef4444' }} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* 모달 */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            {/* 모달 헤더 */}
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="font-bold" style={{ color: '#000000', fontSize: '18px' }}>
                {modalMode === 'edit' ? '사용자 정보 수정' : '비밀번호 초기화'}
              </h2>
              <button
                onClick={closeModal}
                className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X size={20} style={{ color: '#6b7280' }} />
              </button>
            </div>

            {/* 모달 내용 */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {modalMode === 'edit' ? (
                <>
                  {/* 이름 */}
                  <div>
                    <label className="block mb-2 font-bold" style={{ color: '#000000', fontSize: '15px' }}>
                      이름 <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2"
                      style={{ 
                        borderColor: errors.full_name ? '#ef4444' : '#e5e7eb',
                        fontSize: '15px'
                      }}
                      placeholder="이름을 입력하세요"
                    />
                    {errors.full_name && (
                      <p className="mt-1" style={{ color: '#ef4444', fontSize: '13px' }}>
                        {errors.full_name}
                      </p>
                    )}
                  </div>

                  {/* 이메일 */}
                  <div>
                    <label className="block mb-2 font-bold" style={{ color: '#000000', fontSize: '15px' }}>
                      이메일 <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2"
                      style={{ 
                        borderColor: errors.email ? '#ef4444' : '#e5e7eb',
                        fontSize: '15px'
                      }}
                      placeholder="email@example.com"
                    />
                    {errors.email && (
                      <p className="mt-1" style={{ color: '#ef4444', fontSize: '13px' }}>
                        {errors.email}
                      </p>
                    )}
                  </div>

                  {/* 역할 */}
                  <div>
                    <label className="block mb-2 font-bold" style={{ color: '#000000', fontSize: '15px' }}>
                      역할
                    </label>
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2"
                      style={{ 
                        borderColor: '#e5e7eb',
                        fontSize: '15px'
                      }}
                    >
                      <option value="user">사용자</option>
                      <option value="admin">관리자</option>
                    </select>
                  </div>
                </>
              ) : (
                <>
                  {/* 사용자 정보 표시 */}
                  <div className="p-4 rounded-lg" style={{ backgroundColor: '#f9fafb' }}>
                    <div className="mb-2">
                      <span className="font-bold" style={{ color: '#000000', fontSize: '15px' }}>
                        {selectedUser?.full_name}
                      </span>
                    </div>
                    <div style={{ color: '#6b7280', fontSize: '14px' }}>
                      {selectedUser?.email}
                    </div>
                  </div>

                  {/* 새 비밀번호 */}
                  <div>
                    <label className="block mb-2 font-bold" style={{ color: '#000000', fontSize: '15px' }}>
                      새 비밀번호 <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2"
                      style={{ 
                        borderColor: errors.password ? '#ef4444' : '#e5e7eb',
                        fontSize: '15px'
                      }}
                      placeholder="최소 6자 이상"
                    />
                    {errors.password && (
                      <p className="mt-1" style={{ color: '#ef4444', fontSize: '13px' }}>
                        {errors.password}
                      </p>
                    )}
                  </div>
                </>
              )}

              {/* 버튼 */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-2 border rounded-lg font-bold hover:bg-gray-50 transition-colors"
                  style={{ 
                    borderColor: '#e5e7eb',
                    color: '#6b7280',
                    fontSize: '15px'
                  }}
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2 rounded-lg font-bold text-white hover:opacity-90 transition-opacity disabled:opacity-50"
                  style={{ 
                    backgroundColor: '#249689',
                    fontSize: '15px'
                  }}
                >
                  {saving ? '저장 중...' : (modalMode === 'edit' ? '수정' : '초기화')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}