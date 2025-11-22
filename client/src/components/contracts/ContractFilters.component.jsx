import { Search, Filter, X } from 'lucide-react';

export default function ContractFilters({ filters, onFilterChange, onReset, contractTypes }) {
  const handleChange = (key, value) => {
    onFilterChange({ ...filters, [key]: value });
  };

  const hasActiveFilters = () => {
    return filters.startDate || filters.search || (filters.contractTypeId && filters.contractTypeId !== 'all');
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 mb-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Filter size={18} style={{ color: '#249689' }} />
          <span className="font-bold" style={{ color: '#000000', fontSize: '15px' }}>
            검색 및 필터
          </span>
          {hasActiveFilters() && (
            <span
              className="px-2 py-1 text-white text-xs font-bold rounded-full"
              style={{ backgroundColor: '#249689' }}
            >
              {[
                filters.startDate,
                filters.search,
                filters.contractTypeId && filters.contractTypeId !== 'all'
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

      {/* 필터 옵션 - 한 줄 배치 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* 검색 */}
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
            placeholder="계약번호, 계약자명, 전화번호 검색"
            className="w-full pl-10 pr-4 py-2 border border-gray-300"
            style={{ borderRadius: '10px', fontSize: '15px' }}
          />
        </div>

        {/* 계약일 */}
        <div>
          <input
            type="date"
            value={filters.startDate || ''}
            onChange={(e) => handleChange('startDate', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300"
            style={{ borderRadius: '10px', fontSize: '15px' }}
            placeholder="계약일 선택"
          />
        </div>

        {/* 계약종류 */}
        <div>
          <select
            value={filters.contractTypeId || 'all'}
            onChange={(e) => handleChange('contractTypeId', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300"
            style={{ borderRadius: '10px', fontSize: '15px' }}
          >
            <option value="all">전체 계약종류</option>
            {contractTypes && contractTypes.map((type) => (
              <option key={type.id} value={type.id}>
                {type.name}
              </option>
            ))}
          </select>
        </div>

        {/* 정렬 */}
        <div>
          <select
            value={filters.sortBy || 'contract_date'}
            onChange={(e) => handleChange('sortBy', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300"
            style={{ borderRadius: '10px', fontSize: '15px' }}
          >
            <option value="contract_date">계약일 순</option>
            <option value="contractor_name">계약자명 순</option>
            <option value="contract_type_id">계약종류 순</option>
          </select>
        </div>
      </div>
    </div>
  );
}