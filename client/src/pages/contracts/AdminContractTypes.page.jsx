import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, Search, X, Save, AlertCircle } from 'lucide-react';

export default function AdminContractTypesPage() {
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' or 'edit'
  const [selectedType, setSelectedType] = useState(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    is_active: true
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadContractTypes();
  }, []);

  const loadContractTypes = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/contract-types');
      
      if (!response.ok) {
        throw new Error('계약종류 조회 실패');
      }

      const data = await response.json();
      setTypes(data.types || []);

    } catch (error) {
      console.error('계약종류 조회 오류:', error);
      alert('계약종류를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setModalMode('create');
    setFormData({
      code: '',
      name: '',
      description: '',
      is_active: true
    });
    setSelectedType(null);
    setErrors({});
    setShowModal(true);
  };

  const openEditModal = (type) => {
    setModalMode('edit');
    setFormData({
      code: type.code,
      name: type.name,
      description: type.description || '',
      is_active: type.is_active
    });
    setSelectedType(type);
    setErrors({});
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedType(null);
    setFormData({
      code: '',
      name: '',
      description: '',
      is_active: true
    });
    setErrors({});
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.code.trim()) {
      newErrors.code = '코드를 입력해주세요';
    } else if (formData.code.length !== 1) {
      newErrors.code = '코드는 1글자여야 합니다';
    }

    if (!formData.name.trim()) {
      newErrors.name = '이름을 입력해주세요';
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
      const url = modalMode === 'create'
        ? 'http://localhost:5000/api/contract-types'
        : `http://localhost:5000/api/contract-types/${selectedType.id}`;

      const method = modalMode === 'create' ? 'POST' : 'PUT';

      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '저장 실패');
      }

      alert(modalMode === 'create' ? '계약종류가 생성되었습니다.' : '계약종류가 수정되었습니다.');
      closeModal();
      loadContractTypes();

    } catch (error) {
      console.error('저장 오류:', error);
      alert(error.message || '저장하는데 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (type) => {
    if (!confirm(`"${type.name}" 계약종류를 삭제하시겠습니까?`)) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/contract-types/${type.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '삭제 실패');
      }

      alert('계약종류가 삭제되었습니다.');
      loadContractTypes();

    } catch (error) {
      console.error('삭제 오류:', error);
      alert(error.message || '삭제하는데 실패했습니다.');
    }
  };

  const filteredTypes = types.filter(type =>
    type.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    type.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (type.description && type.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f9fafb' }}>
      {/* 헤더 */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col items-center gap-4">
            <img src="/images/logo.png" alt="Logo" className="h-12" />
            <h1 className="font-bold text-center" style={{ color: '#000000', fontSize: '36px' }}>
              계약종류 관리
            </h1>
          </div>
        </div>
      </div>

      {/* 메인 컨텐츠 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* 검색 및 추가 버튼 */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
            {/* 검색 */}
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2" 
                      size={20} 
                      style={{ color: '#9ca3af' }} />
              <input
                type="text"
                placeholder="코드, 이름, 설명으로 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2"
                style={{ 
                  borderColor: '#e5e7eb',
                  fontSize: '15px',
                  focusRingColor: '#249689'
                }}
              />
            </div>

            {/* 추가 버튼 */}
            <button
              onClick={openCreateModal}
              className="flex items-center gap-2 px-6 py-2 rounded-lg font-bold text-white whitespace-nowrap hover:opacity-90 transition-opacity"
              style={{ 
                backgroundColor: '#249689',
                fontSize: '15px'
              }}
            >
              <Plus size={20} />
              계약종류 추가
            </button>
          </div>

          {/* 검색 결과 수 */}
          <div className="mt-4 pt-4 border-t">
            <span style={{ color: '#6b7280', fontSize: '15px' }}>
              총 <span className="font-bold" style={{ color: '#249689' }}>{filteredTypes.length}</span>개
            </span>
          </div>
        </div>

        {/* 계약종류 목록 */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block w-8 h-8 border-4 rounded-full animate-spin" 
                   style={{ borderColor: '#249689', borderTopColor: 'transparent' }}></div>
            </div>
          ) : filteredTypes.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle size={48} className="mx-auto mb-4" style={{ color: '#9ca3af' }} />
              <p style={{ color: '#6b7280', fontSize: '15px' }}>
                {searchTerm ? '검색 결과가 없습니다.' : '등록된 계약종류가 없습니다.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead style={{ backgroundColor: '#f9fafb' }}>
                  <tr>
                    <th className="px-6 py-4 text-left font-bold" style={{ color: '#000000', fontSize: '15px' }}>
                      코드
                    </th>
                    <th className="px-6 py-4 text-left font-bold" style={{ color: '#000000', fontSize: '15px' }}>
                      이름
                    </th>
                    <th className="px-6 py-4 text-left font-bold" style={{ color: '#000000', fontSize: '15px' }}>
                      설명
                    </th>
                    <th className="px-6 py-4 text-center font-bold" style={{ color: '#000000', fontSize: '15px' }}>
                      상태
                    </th>
                    <th className="px-6 py-4 text-center font-bold" style={{ color: '#000000', fontSize: '15px' }}>
                      관리
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTypes.map((type, index) => (
                    <tr key={type.id} 
                        className="border-t hover:bg-gray-50 transition-colors"
                        style={{ borderColor: '#e5e7eb' }}>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center justify-center w-10 h-10 rounded-full font-bold text-white"
                              style={{ backgroundColor: '#249689', fontSize: '18px' }}>
                          {type.code.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-bold" style={{ color: '#000000', fontSize: '15px' }}>
                          {type.name}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span style={{ color: '#6b7280', fontSize: '15px' }}>
                          {type.description || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                          type.is_active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {type.is_active ? '활성' : '비활성'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => openEditModal(type)}
                            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                            title="수정"
                          >
                            <Edit2 size={18} style={{ color: '#249689' }} />
                          </button>
                          <button
                            onClick={() => handleDelete(type)}
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
                {modalMode === 'create' ? '계약종류 추가' : '계약종류 수정'}
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
              {/* 코드 */}
              <div>
                <label className="block mb-2 font-bold" style={{ color: '#000000', fontSize: '15px' }}>
                  코드 <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  maxLength={1}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2"
                  style={{ 
                    borderColor: errors.code ? '#ef4444' : '#e5e7eb',
                    fontSize: '15px'
                  }}
                  placeholder="p, c, l, o, m, a, t 중 1글자"
                  disabled={modalMode === 'edit'}
                />
                {errors.code && (
                  <p className="mt-1" style={{ color: '#ef4444', fontSize: '13px' }}>
                    {errors.code}
                  </p>
                )}
              </div>

              {/* 이름 */}
              <div>
                <label className="block mb-2 font-bold" style={{ color: '#000000', fontSize: '15px' }}>
                  이름 <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2"
                  style={{ 
                    borderColor: errors.name ? '#ef4444' : '#e5e7eb',
                    fontSize: '15px'
                  }}
                  placeholder="사과나무, COOP, LAS COOP 등"
                />
                {errors.name && (
                  <p className="mt-1" style={{ color: '#ef4444', fontSize: '13px' }}>
                    {errors.name}
                  </p>
                )}
              </div>

              {/* 설명 */}
              <div>
                <label className="block mb-2 font-bold" style={{ color: '#000000', fontSize: '15px' }}>
                  설명
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2"
                  style={{ 
                    borderColor: '#e5e7eb',
                    fontSize: '15px'
                  }}
                  placeholder="계약종류에 대한 설명을 입력하세요"
                />
              </div>

              {/* 활성화 여부 */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-5 h-5 rounded"
                  style={{ accentColor: '#249689' }}
                />
                <label htmlFor="is_active" className="font-bold" style={{ color: '#000000', fontSize: '15px' }}>
                  활성화
                </label>
              </div>

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
                  {saving ? '저장 중...' : (modalMode === 'create' ? '추가' : '수정')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}