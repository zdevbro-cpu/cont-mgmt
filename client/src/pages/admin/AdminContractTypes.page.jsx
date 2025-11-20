import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, Search, Check, AlertCircle } from 'lucide-react';
import Navigation from '../../components/Navigation.component';
import API from '../../config/api';

export default function AdminContractTypesPage() {
    const [types, setTypes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // 모달 상태
    const [isModalOpen, setIsModalOpen] = useState(false);
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
        loadTypes();
    }, []);

    const loadTypes = async () => {
        setLoading(true);
        try {
            const response = await fetch(API.CONTRACT_TYPES);
            if (!response.ok) throw new Error('조회 실패');
            const data = await response.json();
            setTypes(data.types || []);
        } catch (error) {
            console.error('Error:', error);
            alert('계약종류 목록을 불러오는데 실패했습니다.');
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
        setErrors({});
        setIsModalOpen(true);
    };

    const openEditModal = (type) => {
        setModalMode('edit');
        setSelectedType(type);
        setFormData({
            code: type.code,
            name: type.name,
            description: type.description || '',
            is_active: type.is_active
        });
        setErrors({});
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedType(null);
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

        if (!validateForm()) return;

        setSaving(true);
        try {
            const url = modalMode === 'create'
                ? API.CONTRACT_TYPES
                : `${API.CONTRACT_TYPES}/${selectedType.id}`;

            const method = modalMode === 'create' ? 'POST' : 'PUT';

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || '저장 실패');
            }

            alert(modalMode === 'create' ? '등록되었습니다.' : '수정되었습니다.');
            closeModal();
            loadTypes();

        } catch (error) {
            console.error('Save error:', error);
            alert(error.message || '저장에 실패했습니다.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('정말 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) return;

        try {
            const response = await fetch(`${API.CONTRACT_TYPES}/${id}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || '삭제 실패');
            }

            alert('삭제되었습니다.');
            loadTypes();

        } catch (error) {
            console.error('Delete error:', error);
            alert(error.message || '삭제에 실패했습니다.');
        }
    };

    const filteredTypes = types.filter(type =>
        type.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        type.code.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-gray-50">
            <Navigation />

            <div className="max-w-7xl mx-auto p-6">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">계약종류 관리</h1>
                        <p className="text-gray-600 mt-1">계약서의 종류와 코드를 관리합니다.</p>
                    </div>
                    <button
                        onClick={openCreateModal}
                        className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
                        style={{ backgroundColor: '#249689' }}
                    >
                        <Plus size={20} />
                        새 계약종류 등록
                    </button>
                </div>

                {/* 검색 및 필터 */}
                <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="계약종류 이름 또는 코드 검색..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                    </div>
                </div>

                {/* 목록 테이블 */}
                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                    {loading ? (
                        <div className="p-12 text-center">
                            <div className="inline-block w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
                            <p className="mt-4 text-gray-600">로딩 중...</p>
                        </div>
                    ) : filteredTypes.length === 0 ? (
                        <div className="p-12 text-center text-gray-500">
                            등록된 계약종류가 없습니다.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">코드</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">이름</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">설명</th>
                                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">상태</th>
                                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">관리</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {filteredTypes.map((type) => (
                                        <tr key={type.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap font-mono font-bold text-primary-600">
                                                {type.code}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                                                {type.name}
                                            </td>
                                            <td className="px-6 py-4 text-gray-500">
                                                {type.description || '-'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${type.is_active
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-gray-100 text-gray-800'
                                                    }`}>
                                                    {type.is_active ? '사용중' : '미사용'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                <div className="flex justify-center gap-2">
                                                    <button
                                                        onClick={() => openEditModal(type)}
                                                        className="p-1 text-gray-400 hover:text-primary-600 transition-colors"
                                                        title="수정"
                                                    >
                                                        <Edit2 size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(type.id)}
                                                        className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                                                        title="삭제"
                                                    >
                                                        <Trash2 size={18} />
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

            {/* 생성/수정 모달 */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-gray-900">
                                {modalMode === 'create' ? '새 계약종류 등록' : '계약종류 수정'}
                            </h2>
                            <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    코드 <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    maxLength={1}
                                    value={formData.code}
                                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                    disabled={modalMode === 'edit'}
                                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${errors.code ? 'border-red-500' : 'border-gray-300'
                                        } ${modalMode === 'edit' ? 'bg-gray-100' : ''}`}
                                    placeholder="A"
                                />
                                {errors.code && <p className="mt-1 text-sm text-red-500">{errors.code}</p>}
                                <p className="mt-1 text-xs text-gray-500">영문 대문자 1글자 (예: A, B, C)</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    이름 <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${errors.name ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                    placeholder="예: 일반투자계약"
                                />
                                {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    설명
                                </label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    rows="3"
                                    placeholder="계약종류에 대한 설명..."
                                />
                            </div>

                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    id="is_active"
                                    checked={formData.is_active}
                                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                                />
                                <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
                                    사용 가능
                                </label>
                            </div>

                            <div className="flex gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                                >
                                    취소
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors disabled:opacity-50"
                                    style={{ backgroundColor: '#249689' }}
                                >
                                    {saving ? '저장 중...' : (modalMode === 'create' ? '등록' : '수정')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
