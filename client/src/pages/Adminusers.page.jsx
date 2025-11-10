import { useEffect, useState } from 'react';
import { Search, Edit2, Trash2, Key, X, Save, AlertCircle } from 'lucide-react';

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
      const response = await fetch('${import.meta.env.VITE_API_URL}/api/users');
      
      if (!response.ok) {
        throw new Error('?¨Ïö©??Ï°∞Ìöå ?§Ìå®');
      }

      const data = await response.json();
      setUsers(data.users || []);

    } catch (error) {
      console.error('?¨Ïö©??Ï°∞Ìöå ?§Î•ò:', error);
      alert('?¨Ïö©?êÎ? Î∂àÎü¨?§Îäî???§Ìå®?àÏäµ?àÎã§.');
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
        newErrors.full_name = '?¥Î¶Ñ???ÖÎ†•?¥Ï£º?∏Ïöî';
      }

      if (!formData.email.trim()) {
        newErrors.email = '?¥Î©î?ºÏùÑ ?ÖÎ†•?¥Ï£º?∏Ïöî';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = '?¨Î∞îÎ•??¥Î©î???ïÏãù???ÑÎãô?àÎã§';
      }
    } else if (modalMode === 'password') {
      if (!newPassword.trim()) {
        newErrors.password = '??ÎπÑÎ?Î≤àÌò∏Î•??ÖÎ†•?¥Ï£º?∏Ïöî';
      } else if (newPassword.length < 6) {
        newErrors.password = 'ÎπÑÎ?Î≤àÌò∏??ÏµúÏÜå 6???¥ÏÉÅ?¥Ïñ¥???©Îãà??;
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
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/users/${selectedUser.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || '?òÏ†ï ?§Ìå®');
        }

        alert('?¨Ïö©???ïÎ≥¥Í∞Ä ?òÏ†ï?òÏóà?µÎãà??');
      } else if (modalMode === 'password') {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/users/${selectedUser.id}/reset-password`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ newPassword }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'ÎπÑÎ?Î≤àÌò∏ Ï¥àÍ∏∞???§Ìå®');
        }

        alert('ÎπÑÎ?Î≤àÌò∏Í∞Ä Ï¥àÍ∏∞?îÎêò?àÏäµ?àÎã§.');
      }

      closeModal();
      loadUsers();

    } catch (error) {
      console.error('?Ä???§Î•ò:', error);
      alert(error.message || '?Ä?•Ìïò?îÎç∞ ?§Ìå®?àÏäµ?àÎã§.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (user) => {
    if (!confirm(`"${user.full_name}" ?¨Ïö©?êÎ? ??†ú?òÏãúÍ≤†Ïäµ?àÍπå?`)) {
      return;
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/users/${user.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '??†ú ?§Ìå®');
      }

      alert('?¨Ïö©?êÍ? ??†ú?òÏóà?µÎãà??');
      loadUsers();

    } catch (error) {
      console.error('??†ú ?§Î•ò:', error);
      alert(error.message || '??†ú?òÎäî???§Ìå®?àÏäµ?àÎã§.');
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
      {/* ?§Îçî */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col items-center gap-4">
            <img src="/images/logo.png" alt="Logo" className="h-12" />
            <h1 className="font-bold text-center" style={{ color: '#000000', fontSize: '36px' }}>
              ?†Ï? Í¥ÄÎ¶?
            </h1>
          </div>
        </div>
      </div>

      {/* Î©îÏù∏ Ïª®ÌÖêÏ∏?*/}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Í≤Ä??*/}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2" 
                    size={20} 
                    style={{ color: '#9ca3af' }} />
            <input
              type="text"
              placeholder="?¥Î¶Ñ, ?¥Î©î?ºÎ°ú Í≤Ä??.."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2"
              style={{ 
                borderColor: '#e5e7eb',
                fontSize: '15px'
              }}
            />
          </div>

          {/* Í≤Ä??Í≤∞Í≥º ??*/}
          <div className="mt-4 pt-4 border-t">
            <span style={{ color: '#6b7280', fontSize: '15px' }}>
              Ï¥?<span className="font-bold" style={{ color: '#249689' }}>{filteredUsers.length}</span>Î™?
            </span>
          </div>
        </div>

        {/* ?¨Ïö©??Î™©Î°ù */}
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
                {searchTerm ? 'Í≤Ä??Í≤∞Í≥ºÍ∞Ä ?ÜÏäµ?àÎã§.' : '?±Î°ù???¨Ïö©?êÍ? ?ÜÏäµ?àÎã§.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead style={{ backgroundColor: '#f9fafb' }}>
                  <tr>
                    <th className="px-6 py-4 text-left font-bold" style={{ color: '#000000', fontSize: '15px' }}>
                      ?¥Î¶Ñ
                    </th>
                    <th className="px-6 py-4 text-left font-bold" style={{ color: '#000000', fontSize: '15px' }}>
                      ?¥Î©î??
                    </th>
                    <th className="px-6 py-4 text-center font-bold" style={{ color: '#000000', fontSize: '15px' }}>
                      ??ï†
                    </th>
                    <th className="px-6 py-4 text-center font-bold" style={{ color: '#000000', fontSize: '15px' }}>
                      Í∞Ä?ÖÏùº
                    </th>
                    <th className="px-6 py-4 text-center font-bold" style={{ color: '#000000', fontSize: '15px' }}>
                      Í¥ÄÎ¶?
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
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {user.role === 'admin' ? 'Í¥ÄÎ¶¨Ïûê' : '?¨Ïö©??}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span style={{ color: '#6b7280', fontSize: '15px' }}>
                          {formatDate(user.created_at)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => openEditModal(user)}
                            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                            title="?òÏ†ï"
                          >
                            <Edit2 size={18} style={{ color: '#249689' }} />
                          </button>
                          <button
                            onClick={() => openPasswordModal(user)}
                            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                            title="ÎπÑÎ?Î≤àÌò∏ Ï¥àÍ∏∞??
                          >
                            <Key size={18} style={{ color: '#f59e0b' }} />
                          </button>
                          <button
                            onClick={() => handleDelete(user)}
                            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                            title="??†ú"
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

      {/* Î™®Îã¨ */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            {/* Î™®Îã¨ ?§Îçî */}
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="font-bold" style={{ color: '#000000', fontSize: '18px' }}>
                {modalMode === 'edit' ? '?¨Ïö©???ïÎ≥¥ ?òÏ†ï' : 'ÎπÑÎ?Î≤àÌò∏ Ï¥àÍ∏∞??}
              </h2>
              <button
                onClick={closeModal}
                className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X size={20} style={{ color: '#6b7280' }} />
              </button>
            </div>

            {/* Î™®Îã¨ ?¥Ïö© */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {modalMode === 'edit' ? (
                <>
                  {/* ?¥Î¶Ñ */}
                  <div>
                    <label className="block mb-2 font-bold" style={{ color: '#000000', fontSize: '15px' }}>
                      ?¥Î¶Ñ <span style={{ color: '#ef4444' }}>*</span>
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
                      placeholder="?¥Î¶Ñ???ÖÎ†•?òÏÑ∏??
                    />
                    {errors.full_name && (
                      <p className="mt-1" style={{ color: '#ef4444', fontSize: '13px' }}>
                        {errors.full_name}
                      </p>
                    )}
                  </div>

                  {/* ?¥Î©î??*/}
                  <div>
                    <label className="block mb-2 font-bold" style={{ color: '#000000', fontSize: '15px' }}>
                      ?¥Î©î??<span style={{ color: '#ef4444' }}>*</span>
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

                  {/* ??ï† */}
                  <div>
                    <label className="block mb-2 font-bold" style={{ color: '#000000', fontSize: '15px' }}>
                      ??ï†
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
                      <option value="user">?¨Ïö©??/option>
                      <option value="admin">Í¥ÄÎ¶¨Ïûê</option>
                    </select>
                  </div>
                </>
              ) : (
                <>
                  {/* ?¨Ïö©???ïÎ≥¥ ?úÏãú */}
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

                  {/* ??ÎπÑÎ?Î≤àÌò∏ */}
                  <div>
                    <label className="block mb-2 font-bold" style={{ color: '#000000', fontSize: '15px' }}>
                      ??ÎπÑÎ?Î≤àÌò∏ <span style={{ color: '#ef4444' }}>*</span>
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
                      placeholder="ÏµúÏÜå 6???¥ÏÉÅ"
                    />
                    {errors.password && (
                      <p className="mt-1" style={{ color: '#ef4444', fontSize: '13px' }}>
                        {errors.password}
                      </p>
                    )}
                  </div>
                </>
              )}

              {/* Î≤ÑÌäº */}
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
                  Ï∑®ÏÜå
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
                  {saving ? '?Ä??Ï§?..' : (modalMode === 'edit' ? '?òÏ†ï' : 'Ï¥àÍ∏∞??)}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}