import React, { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Download } from 'lucide-react'
import Header from '../components/Header'
import ContractForm from './ContractForm'

const ContractList = () => {
  const [contracts, setContracts] = useState([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedContract, setSelectedContract] = useState(null)
  const [loading, setLoading] = useState(true)

  // 임시 데이터 (실제로는 API에서 가져옴)
  useEffect(() => {
    // API 호출 시뮬레이션
    setTimeout(() => {
      setContracts([
        {
          id: 1,
          name: '강동원',
          address: '서울 강동구 상일로로 1571 플레시스',
          manager: '박영희',
          phone: '010-7227-2614'
        },
        {
          id: 2,
          name: '홍성원',
          address: '경남 양산시 삼성 1길 34 조영마을 1동',
          manager: '김효영',
          phone: '010-4095-0171'
        },
        {
          id: 3,
          name: '서조 라스브라더',
          address: '서울 서조구 논현로 236 1동',
          manager: '권영미',
          phone: '010-4398-5750'
        }
      ])
      setLoading(false)
    }, 500)
  }, [])

  const handleEdit = (contract) => {
    setSelectedContract(contract)
    setIsModalOpen(true)
  }

  const handleDelete = (id) => {
    if (window.confirm('정말 삭제하시겠습니까?')) {
      setContracts(contracts.filter(c => c.id !== id))
    }
  }

  const handleAdd = () => {
    setSelectedContract(null)
    setIsModalOpen(true)
  }

  const handleExport = () => {
    alert('엑셀 다운로드 기능은 개발 중입니다.')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="지점정보관리" showBackButton={false} />

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* 상단 액션 바 */}
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
          </div>
        </div>

        {/* 테이블 */}
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
                {contracts.map((contract) => (
                  <tr key={contract.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm text-primary-600 font-medium">
                      {contract.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {contract.address}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {contract.manager}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {contract.phone}
                    </td>
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
      </div>

      {/* 계약 추가/수정 모달 */}
      <ContractForm
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        contract={selectedContract}
        onSave={(data) => {
          if (selectedContract) {
            // 수정
            setContracts(contracts.map(c => 
              c.id === selectedContract.id ? { ...c, ...data } : c
            ))
          } else {
            // 추가
            setContracts([...contracts, { ...data, id: Date.now() }])
          }
          setIsModalOpen(false)
        }}
      />
    </div>
  )
}

export default ContractList
