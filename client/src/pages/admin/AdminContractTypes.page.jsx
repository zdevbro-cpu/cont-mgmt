import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, Search, X, Save, AlertCircle } from 'lucide-react';
import Navigation from '../../components/Navigation.component';

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
      const response = await fetch('${import.meta.env.VITE_API_URL}/api/contract-types');
      
      if (!response.ok) {
        throw new Error('Í≥ÑÏïΩÏ¢ÖÎ•ò Ï°∞Ìöå ?§Ìå®');
      }

      const data = await response.json();
      setTypes(data.types || []);

    } catch (error) {
      console.error('Í≥ÑÏïΩÏ¢ÖÎ•ò Ï°∞Ìöå ?§Î•ò:', error);
      alert('Í≥ÑÏïΩÏ¢ÖÎ•òÎ•?Î∂àÎü¨?§Îäî???§Ìå®?àÏäµ?àÎã§.');
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
      newErrors.code = 'ÏΩîÎìúÎ•??ÖÎ†•?¥Ï£º?∏Ïöî';
    } else if (formData.code.length !== 1) {
      newErrors.code = 'ÏΩîÎìú??1Í∏Ä?êÏó¨???©Îãà??;
    }

    if (!formData.name.trim()) {
      newErrors.name = '?¥Î¶Ñ???ÖÎ†•?¥Ï£º?∏Ïöî';
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
        ? '${import.meta.env.VITE_API_URL}/api/contract-types'
        : `${import.meta.env.VITE_API_URL}/api/contract-types/${selectedType.id}`;

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
        throw new Error(errorData.error || '?Ä???§Ìå®');
      }

      alert(modalMode === 'create' ? 'Í≥ÑÏïΩÏ¢ÖÎ•òÍ∞Ä ?ùÏÑ±?òÏóà?µÎãà??' : 'Í≥ÑÏïΩÏ¢ÖÎ•òÍ∞Ä ?òÏ†ï?òÏóà?µÎãà??');
      closeModal();
      loadContractTypes();

    } catch (error) {
      console.error('?Ä???§Î•ò:', error);
      alert(error.message || '?Ä?•Ìïò?îÎç∞ ?§Ìå®?àÏäµ?àÎã§.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (type) => {
    if (!confirm(`"${type.name}" Í≥ÑÏïΩÏ¢ÖÎ•òÎ•???†ú?òÏãúÍ≤†Ïäµ?àÍπå?`)) {
      return;
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/contract-types/${type.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '??†ú ?§Ìå®');
      }

      alert('Í≥ÑÏïΩÏ¢ÖÎ•òÍ∞Ä ??†ú?òÏóà?µÎãà??');
      loadContractTypes();

    } catch (error) {
      console.error('??†ú ?§Î•ò:', error);
      alert(error.message || '??†ú?òÎäî???§Ìå®?àÏäµ?àÎã§.');
    }
  };

  const filteredTypes = types.filter(type =>
    type.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    type.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (type.description && type.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f9fafb' }}>
      {/* ?§ÎπÑÍ≤åÏù¥??*/}
      <Navigation />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Í≤Ä??Î∞?Ï∂îÍ? Î≤ÑÌäº */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
            {/* Í≤Ä??*/}
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2" 
                      size={20} 
                      style={{ color: '#9ca3af' }} />
              <input
                type="text"
                placeholder="ÏΩîÎìú, ?¥Î¶Ñ, ?§Î™Ö?ºÎ°ú Í≤Ä??.."
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

            {/* Ï∂îÍ? Î≤ÑÌäº */}
            <button
              onClick={openCreateModal}
              className="flex items-center gap-2 px-6 py-2 rounded-lg font-bold text-white whitespace-nowrap hover:opacity-90 transition-opacity"
              style={{ 
                backgroundColor: '#249689',
                fontSize: '15px'
              }}
            >
              <Plus size={20} />
              Í≥ÑÏïΩÏ¢ÖÎ•ò Ï∂îÍ?
            </button>
          </div>

          {/* Í≤Ä??Í≤∞Í≥º ??*/}
          <div className="mt-4 pt-4 border-t">
            <span style={{ color: '#6b7280', fontSize: '15px' }}>
              Ï¥?<span className="font-bold" style={{ color: '#249689' }}>{filteredTypes.length}</span>Í∞?
            </span>
          </div>
        </div>

        {/* Í≥ÑÏïΩÏ¢ÖÎ•ò Î™©Î°ù */}
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
                {searchTerm ? 'Í≤Ä??Í≤∞Í≥ºÍ∞Ä ?ÜÏäµ?àÎã§.' : '?±Î°ù??Í≥ÑÏïΩÏ¢ÖÎ•òÍ∞Ä ?ÜÏäµ?àÎã§.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead style={{ backgroundColor: '#f9fafb' }}>
                  <tr>
                    <th className="px-6 py-4 text-left font-bold" style={{ color: '#000000', fontSize: '15px' }}>
                      ÏΩîÎìú
                    </th>
                    <th className="px-6 py-4 text-left font-bold" style={{ color: '#000000', fontSize: '15px' }}>
                      ?¥Î¶Ñ
                    </th>
                    <th className="px-6 py-4 text-left font-bold" style={{ color: '#000000', fontSize: '15px' }}>
                      ?§Î™Ö
                    </th>
                    <th className="px-6 py-4 text-center font-bold" style={{ color: '#000000', fontSize: '15px' }}>
                      ?ÅÌÉú
                    </th>
                    <th className="px-6 py-4 text-center font-bold" style={{ color: '#000000', fontSize: '15px' }}>
                      Í¥ÄÎ¶?
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
                          {type.is_active ? '?úÏÑ±' : 'ÎπÑÌôú??}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => openEditModal(type)}
                            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                            title="?òÏ†ï"
                          >
                            <Edit2 size={18} style={{ color: '#249689' }} />
                          </button>
                          <button
                            onClick={() => handleDelete(type)}
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
                {modalMode === 'create' ? 'Í≥ÑÏïΩÏ¢ÖÎ•ò Ï∂îÍ?' : 'Í≥ÑÏïΩÏ¢ÖÎ•ò ?òÏ†ï'}
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
              {/* ÏΩîÎìú */}
              <div>
                <label className="block mb-2 font-bold" style={{ color: '#000000', fontSize: '15px' }}>
                  ÏΩîÎìú <span style={{ color: '#ef4444' }}>*</span>
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
                  placeholder="p, c, l, o, m, a, t Ï§?1Í∏Ä??
                  disabled={modalMode === 'edit'}
                />
                {errors.code && (
                  <p className="mt-1" style={{ color: '#ef4444', fontSize: '13px' }}>
                    {errors.code}
                  </p>
                )}
              </div>

              {/* ?¥Î¶Ñ */}
              <div>
                <label className="block mb-2 font-bold" style={{ color: '#000000', fontSize: '15px' }}>
                  ?¥Î¶Ñ <span style={{ color: '#ef4444' }}>*</span>
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
                  placeholder="?¨Í≥º?òÎ¨¥, COOP, LAS COOP ??
                />
                {errors.name && (
                  <p className="mt-1" style={{ color: '#ef4444', fontSize: '13px' }}>
                    {errors.name}
                  </p>
                )}
              </div>

              {/* ?§Î™Ö */}
              <div>
                <label className="block mb-2 font-bold" style={{ color: '#000000', fontSize: '15px' }}>
                  ?§Î™Ö
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
                  placeholder="Í≥ÑÏïΩÏ¢ÖÎ•ò???Ä???§Î™Ö???ÖÎ†•?òÏÑ∏??
                />
              </div>

              {/* ?úÏÑ±???¨Î? */}
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
                  ?úÏÑ±??
                </label>
              </div>

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
                  {saving ? '?Ä??Ï§?..' : (modalMode === 'create' ? 'Ï∂îÍ?' : '?òÏ†ï')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}