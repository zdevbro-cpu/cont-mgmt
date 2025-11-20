import { Search, Filter, X } from 'lucide-react';

export default function ContractFilters({ filters, onFilterChange, onReset }) {
  const handleChange = (key, value) => {
    onFilterChange({ ...filters, [key]: value });
  };

  const hasActiveFilters = () => {
    return filters.startDate || filters.endDate || 
           filters.minAmount || filters.maxAmount || 
           (filters.paymentMethod && filters.paymentMethod !== 'all');
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 mb-4">
      {/* 검색 */}
      <div className="mb-4">
        <div className="relative">
          <Search 
            size={18} 
            style={{ color: '#9ca3af' }} 
            className="absolute left-3 top-1/2 transform -translate-y-1/2"
          />
          <input
            type="text"
            value={filters.search || ''}
            onChange={(e) => handleChange('search', e.target.value)}
            placeholder="계약번호, 계약자명, 전화번호로 검색"
            className="w-full pl-10 pr-4 py-2 border border-gray-300"
            style={{ borderRadius: '10px', fontSize: '15px' }}
          />
        </div>
      </div>

      {/* 필터 토글 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Filter size={18} style={{ color: '#249689' }} />
          <span className="font-bold" style={{ color: '#000000', fontSize: '15px' }}>
            상세 필터
          </span>
          {hasActiveFilters() && (
            <span 
              className="px-2 py-1 text-white text-xs font-bold rounded-full"
              style={{ backgroundColor: '#249689' }}
            >
              {[
                filters.startDate && '날짜',
                filters.minAmount && '금액',
                filters.paymentMethod && filters.paymentMethod !== 'all' && '결제'
              ].filter(Boolean).length}
            </span>
          )}
        </div>
        {hasActiveFilters() && (
          <button
            onClick={onReset}
            className="flex items-center gap-1 px-3 py-1 text-xs font-bold rounded hover:opacity-70"
            style={{ color: '#ef4444' }}
          >
            <X size={14} />
            초기화
          </button>
        )}
      </div>

      {/* 필터 옵션 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 날짜 범위 */}
        <div>
          <label className="block mb-2 font-bold" style={{ color: '#6b7280', fontSize: '15px' }}>
            계약일 (시작)
          </label>
          <input
            type="date"
            value={filters.startDate || ''}
            onChange={(e) => handleChange('startDate', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300"
            style={{ borderRadius: '10px', fontSize: '15px' }}
          />
        </div>

        <div>
          <label className="block mb-2 font-bold" style={{ color: '#6b7280', fontSize: '15px' }}>
            계약일 (종료)
          </label>
          <input
            type="date"
            value={filters.endDate || ''}
            onChange={(e) => handleChange('endDate', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300"
            style={{ borderRadius: '10px', fontSize: '15px' }}
          />
        </div>

        {/* 금액 범위 */}
        <div>
          <label className="block mb-2 font-bold" style={{ color: '#6b7280', fontSize: '15px' }}>
            최소 금액 (원)
          </label>
          <input
            type="number"
            value={filters.minAmount || ''}
            onChange={(e) => handleChange('minAmount', e.target.value)}
            placeholder="0"
            className="w-full px-4 py-2 border border-gray-300"
            style={{ borderRadius: '10px', fontSize: '15px' }}
          />
        </div>

        <div>
          <label className="block mb-2 font-bold" style={{ color: '#6b7280', fontSize: '15px' }}>
            최대 금액 (원)
          </label>
          <input
            type="number"
            value={filters.maxAmount || ''}
            onChange={(e) => handleChange('maxAmount', e.target.value)}
            placeholder="무제한"
            className="w-full px-4 py-2 border border-gray-300"
            style={{ borderRadius: '10px', fontSize: '15px' }}
          />
        </div>

        {/* 결제 방법 */}
        <div>
          <label className="block mb-2 font-bold" style={{ color: '#6b7280', fontSize: '15px' }}>
            결제 방법
          </label>
          <select
            value={filters.paymentMethod || 'all'}
            onChange={(e) => handleChange('paymentMethod', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300"
            style={{ borderRadius: '10px', fontSize: '15px' }}
          >
            <option value="all">전체</option>
            <option value="현금">현금</option>
            <option value="카드">카드</option>
            <option value="입금">입금</option>
          </select>
        </div>

        {/* 정렬 */}
        <div>
          <label className="block mb-2 font-bold" style={{ color: '#6b7280', fontSize: '15px' }}>
            정렬 기준
          </label>
          <select
            value={filters.sortBy || 'created_at'}
            onChange={(e) => handleChange('sortBy', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300"
            style={{ borderRadius: '10px', fontSize: '15px' }}
          >
            <option value="created_at">등록일</option>
            <option value="contract_date">계약일</option>
            <option value="amount">투자금액</option>
            <option value="contractor_name">계약자명</option>
          </select>
        </div>

        <div>
          <label className="block mb-2 font-bold" style={{ color: '#6b7280', fontSize: '15px' }}>
            정렬 순서
          </label>
          <select
            value={filters.sortOrder || 'desc'}
            onChange={(e) => handleChange('sortOrder', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300"
            style={{ borderRadius: '10px', fontSize: '15px' }}
          >
            <option value="desc">내림차순</option>
            <option value="asc">오름차순</option>
          </select>
        </div>
      </div>
    </div>
  );
}