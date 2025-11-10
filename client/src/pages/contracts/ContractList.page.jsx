import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Eye, Trash2, FileText } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import ContractFilters from '../../components/contracts/ContractFilters.component';
import Navigation from '../../components/Navigation.component';
import API from '../../config/api';

export default function ContractListPage() {
  const navigate = useNavigate();
  const { userRole } = useAuth();
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    startDate: '',
    endDate: '',
    minAmount: '',
    maxAmount: '',
    paymentMethod: 'all',
    sortBy: 'created_at',
    sortOrder: 'desc'
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });

  useEffect(() => {
    loadContracts();
  }, [pagination.page, filters]);

  const loadContracts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        ...filters
      });

      // 빈값 제거
      for (const [key, value] of params.entries()) {
        if (!value || value === 'all') {
          params.delete(key);
        }
      }

      const response = await fetch(`${API.CONTRACTS}?${params}`);
      
      if (!response.ok) {
        throw new Error('목록 조회 실패');
      }

      const data = await response.json();
      setContracts(data.contracts || []);
      
      if (data.pagination) {
        setPagination({
          page: data.pagination.page || 1,
          limit: data.pagination.limit || 20,
          total: data.pagination.total || 0,
          totalPages: data.pagination.totalPages || 0
        });
      }

    } catch (error) {
      alert('계약서 목록을 불러오는데 실패했습니다.');
      setContracts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleFilterReset = () => {
    setFilters({
      search: '',
      startDate: '',
      endDate: '',
      minAmount: '',
      maxAmount: '',
      paymentMethod: 'all',
      sortBy: 'created_at',
      sortOrder: 'desc'
    });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleDelete = async (contract, event) => {
    event.stopPropagation(); // 클릭 이벤트 방지
    
    if (!confirm(`"${contract.contractor_name}" 계약을 삭제하시겠습니까?`)) {
      return;
    }

    try {
      const response = await fetch(`${API.CONTRACTS}/${contract.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '삭제 실패');
      }

      alert('계약이 삭제되었습니다');
      loadContracts();

    } catch (error) {
      alert(error.message || '삭제하는데 실패했습니다.');
    }
  };

  const formatCurrency = (amount) => {
    if (!amount) return '-';
    return new Intl.NumberFormat('ko-KR').format(amount) + '원';
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('ko-KR');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 네비게이션 */}
      <Navigation />

      {/* 메인 컨텐츠 */}
      <div className="max-w-7xl mx-auto p-6">
        {/* 필터 */}
        <ContractFilters 
          filters={filters}
          onFilterChange={handleFilterChange}
          onReset={handleFilterReset}
        />

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* 헤더 영역 */}
          <div className="p-4 border-b">
            <div className="flex items-center justify-between">
              <h2 className="font-bold" style={{ color: '#000000', fontSize: '18px' }}>
                등록된 계약서 목록
                {(pagination?.total > 0) && (
                  <span style={{ color: '#6b7280', fontSize: '15px' }} className="ml-2">
                    ({pagination.total}건)
                  </span>
                )}
              </h2>
              <button
                onClick={() => navigate('/contracts/new')}
                className="flex items-center gap-2 px-4 py-2 text-white font-bold rounded-lg hover:opacity-90 transition-opacity"
                style={{ backgroundColor: '#249689', fontSize: '15px' }}
              >
                <Plus size={18} />
                계약서 등록
              </button>
            </div>
          </div>

          {/* 테이블 */}
          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block w-8 h-8 border-4 rounded-full animate-spin" 
                   style={{ borderColor: '#249689', borderTopColor: 'transparent' }}>
              </div>
              <p className="mt-4" style={{ color: '#6b7280', fontSize: '15px' }}>
                로딩 중...
              </p>
            </div>
          ) : contracts.length === 0 ? (
            <div className="p-12 text-center">
              <FileText size={80} style={{ color: '#d1d5db' }} className="mx-auto mb-4" />
              <h3 className="font-bold mb-2" style={{ color: '#000000', fontSize: '18px' }}>
                {filters.search || filters.startDate || filters.minAmount ? '검색 결과가 없습니다' : '등록된 계약서가 없습니다'}
              </h3>
              <p className="mb-6" style={{ color: '#6b7280', fontSize: '15px' }}>
                {filters.search || filters.startDate || filters.minAmount ? '다른 조건으로 검색해보세요' : '새 계약서를 등록하여 관리를 시작하세요'}
              </p>
              {!(filters.search || filters.startDate || filters.minAmount) && (
                <button
                  onClick={() => navigate('/contracts/new')}
                  className="inline-flex items-center gap-2 px-6 py-2 text-white font-bold rounded-lg hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: '#249689', fontSize: '15px' }}
                >
                  <Plus size={18} />
                  첫 계약서 등록하기
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-bold" style={{ color: '#000000', fontSize: '15px' }}>
                      계약종류
                    </th>
                    <th className="px-4 py-3 text-left font-bold" style={{ color: '#000000', fontSize: '15px' }}>
                      계약번호
                    </th>
                    <th className="px-4 py-3 text-left font-bold" style={{ color: '#000000', fontSize: '15px' }}>
                      계약자
                    </th>
                    <th className="px-4 py-3 text-left font-bold" style={{ color: '#000000', fontSize: '15px' }}>
                      전화번호
                    </th>
                    <th className="px-4 py-3 text-right font-bold" style={{ color: '#000000', fontSize: '15px' }}>
                      투자금액
                    </th>
                    <th className="px-4 py-3 text-left font-bold" style={{ color: '#000000', fontSize: '15px' }}>
                      계약일
                    </th>
                    <th className="px-4 py-3 text-center font-bold" style={{ color: '#000000', fontSize: '15px' }}>
                      관리
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {contracts.map((contract) => (
                    <tr 
                      key={contract.id} 
                      className="border-t hover:bg-gray-50"
                    >
                      <td className="px-4 py-3" style={{ fontSize: '15px' }}>
                        {contract.contract_types?.name || '-'}
                      </td>
                      <td className="px-4 py-3" style={{ fontSize: '15px', color: '#249689', fontWeight: 'bold' }}>
                        {contract.contract_number}
                      </td>
                      <td className="px-4 py-3" style={{ fontSize: '15px' }}>
                        {contract.contractor_name}
                      </td>
                      <td className="px-4 py-3" style={{ fontSize: '15px' }}>
                        {contract.phone_number}
                      </td>
                      <td className="px-4 py-3 text-right" style={{ fontSize: '15px', fontWeight: 'bold' }}>
                        {formatCurrency(contract.amount)}
                      </td>
                      <td className="px-4 py-3" style={{ fontSize: '15px' }}>
                        {formatDate(contract.contract_date)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-center gap-1">
                          <button
                            onClick={() => navigate(`/contracts/${contract.id}`)}
                            className="p-2 hover:bg-gray-100 rounded"
                            title="자세보기"
                          >
                            <Eye size={18} style={{ color: '#249689' }} />
                          </button>
                          {userRole === 'admin' && (
                            <button
                              onClick={(e) => handleDelete(contract, e)}
                              className="p-2 hover:bg-gray-100 rounded"
                              title="삭제"
                            >
                              <Trash2 size={18} style={{ color: '#ef4444' }} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* 페이지네이션 */}
          {(pagination?.totalPages > 1) && (
            <div className="p-4 border-t flex items-center justify-center gap-2">
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                disabled={pagination.page === 1}
                className="px-4 py-2 font-bold rounded-lg disabled:opacity-50"
                style={{ 
                  backgroundColor: pagination.page === 1 ? '#e5e7eb' : '#249689',
                  color: pagination.page === 1 ? '#9ca3af' : '#ffffff',
                  fontSize: '15px'
                }}
              >
                이전
              </button>
              
              <span style={{ color: '#000000', fontSize: '15px' }} className="px-4">
                {pagination.page} / {pagination.totalPages}
              </span>

              <button
                onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.totalPages, prev.page + 1) }))}
                disabled={pagination.page === pagination.totalPages}
                className="px-4 py-2 font-bold rounded-lg disabled:opacity-50"
                style={{ 
                  backgroundColor: pagination.page === pagination.totalPages ? '#e5e7eb' : '#249689',
                  color: pagination.page === pagination.totalPages ? '#9ca3af' : '#ffffff',
                  fontSize: '15px'
                }}
              >
                다음
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}