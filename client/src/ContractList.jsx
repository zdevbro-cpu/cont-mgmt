import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Download } from 'lucide-react';
import Header from '../components/Header';
import ContractForm from './ContractForm';
import BulkUpload from './BulkUpload';
import { useAuth } from '../context/AuthContext';

const ContractList = () => {
  const [contracts, setContracts] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedContract, setSelectedContract] = useState(null);
  const [loading, setLoading] = useState(true);

  // Auth & Bulk Upload state
  const { isAdmin, token } = useAuth();
  const [isBulkOpen, setIsBulkOpen] = useState(false);

  // Fetch contracts from API
  useEffect(() => {
    const fetchContracts = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/contracts`);
        if (!response.ok) {
          throw new Error('Failed to fetch contracts');
        }
        const data = await response.json();
        // Assuming API returns { contracts: [...] } or just [...]
        setContracts(data.contracts || data);
      } catch (error) {
        console.error('Error fetching contracts:', error);
        // Fallback to empty list or keep loading false to show empty state
        setContracts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchContracts();
  }, []);

  const handleEdit = (contract) => {
    setSelectedContract(contract);
    setIsModalOpen(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('정말 삭제하시겠습니까?')) {
      setContracts(contracts.filter(c => c.id !== id));
    }
  };

  const handleAdd = () => {
    setSelectedContract(null);
    setIsModalOpen(true);
  };

  const handleExport = () => {
    alert('엑셀 다운로드 기능은 개발 중입니다.');
  };

  const handleBulkOpen = () => setIsBulkOpen(true);
  const handleBulkClose = () => setIsBulkOpen(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="지점정보관리" showBackButton={false} />
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Action Bar */}
        <div className="flex justify-between items-center mb-4">
          <div className="text-sm text-gray-600">
            지점 수: <span className="font-semibold">{contracts.length}</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
            >
              <Download size={18} />
              엑셀다운로드(.csv)
            </button>
            <button
              onClick={handleAdd}
              className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              <Plus size={18} />
              지점 생성
            </button>
            {/* Admin Only Bulk Upload Button - Temporarily enabled for all for debugging */}
            <button
              onClick={handleBulkOpen}
              className="flex items-center gap-2 px-4 py-2 bg-primary-700 text-white rounded-lg hover:bg-primary-800 transition-colors"
            >
              <Download size={18} />
              엑셀 일괄 등록
            </button>
          </div>
        </div>
        {/* Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-500">로딩 중...</div>
          ) : contracts.length === 0 ? (
            <div className="p-8 text-center text-gray-500">등록된 지점이 없습니다.</div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">지점명</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">지점주소</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">지점장</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">연락처</th>
                  <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {contracts.map(contract => (
                  <tr key={contract.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm text-primary-600 font-medium">{contract.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{contract.address}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{contract.manager}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{contract.phone}</td>
                    <td className="px-6 py-4 text-sm text-center">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => handleEdit(contract)}
                          className="p-1 text-primary-600 hover:bg-primary-50 rounded transition-colors"
                          title="수정"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(contract.id)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
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
          )}
        </div>
        {/* Modals */}
        <ContractForm
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          contract={selectedContract}
          onSave={(data) => {
            if (selectedContract) {
              setContracts(contracts.map(c => c.id === selectedContract.id ? { ...c, ...data } : c));
            } else {
              setContracts([...contracts, { ...data, id: Date.now() }]);
            }
            setIsModalOpen(false);
          }}
        />
        <BulkUpload
          isOpen={isBulkOpen}
          onClose={handleBulkClose}
          token={token}
        />
      </div>
    </div>
  );
};

export default ContractList;
