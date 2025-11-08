import React, { useState, useEffect } from 'react'
import Modal from '../components/Modal'

const ContractForm = ({ isOpen, onClose, contract, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    manager: '',
    phone: '',
    contractDate: '',
    startDate: '',
    endDate: '',
    amount: '',
    paymentMethod: '카드',
    paymentTerms: '',
    notes: ''
  })

  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (contract) {
      setFormData(contract)
    } else {
      setFormData({
        name: '',
        address: '',
        manager: '',
        phone: '',
        contractDate: '',
        startDate: '',
        endDate: '',
        amount: '',
        paymentMethod: '카드',
        paymentTerms: '',
        notes: ''
      })
    }
    setErrors({})
  }, [contract, isOpen])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    // 에러 초기화
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const validate = () => {
    const newErrors = {}

    if (!formData.name.trim()) {
      newErrors.name = '지점명을 입력해주세요'
    }
    if (!formData.address.trim()) {
      newErrors.address = '주소를 입력해주세요'
    }
    if (!formData.manager.trim()) {
      newErrors.manager = '지점장명을 입력해주세요'
    }
    if (!formData.phone.trim()) {
      newErrors.phone = '연락처를 입력해주세요'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (validate()) {
      onSave(formData)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={contract ? '계약 정보 수정' : '계약 정보 등록'}
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 지점명 */}
        <div>
          <label className="label-text">
            지점명 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className={`input-field ${errors.name ? 'border-red-500' : ''}`}
            placeholder="지점명을 입력하세요"
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name}</p>
          )}
        </div>

        {/* 주소 */}
        <div>
          <label className="label-text">
            주소 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="address"
            value={formData.address}
            onChange={handleChange}
            className={`input-field ${errors.address ? 'border-red-500' : ''}`}
            placeholder="주소를 입력하세요"
          />
          {errors.address && (
            <p className="mt-1 text-sm text-red-600">{errors.address}</p>
          )}
        </div>

        {/* 지점장 */}
        <div>
          <label className="label-text">
            지점장 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="manager"
            value={formData.manager}
            onChange={handleChange}
            className={`input-field ${errors.manager ? 'border-red-500' : ''}`}
            placeholder="지점장명을 입력하세요"
          />
          {errors.manager && (
            <p className="mt-1 text-sm text-red-600">{errors.manager}</p>
          )}
        </div>

        {/* 연락처 */}
        <div>
          <label className="label-text">
            연락처 <span className="text-red-500">*</span>
          </label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            className={`input-field ${errors.phone ? 'border-red-500' : ''}`}
            placeholder="010-0000-0000"
          />
          {errors.phone && (
            <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
          )}
        </div>

        {/* 계약일 */}
        <div>
          <label className="label-text">계약일</label>
          <input
            type="date"
            name="contractDate"
            value={formData.contractDate}
            onChange={handleChange}
            className="input-field"
          />
        </div>

        {/* 계약 기간 */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label-text">시작일</label>
            <input
              type="date"
              name="startDate"
              value={formData.startDate}
              onChange={handleChange}
              className="input-field"
            />
          </div>
          <div>
            <label className="label-text">종료일</label>
            <input
              type="date"
              name="endDate"
              value={formData.endDate}
              onChange={handleChange}
              className="input-field"
            />
          </div>
        </div>

        {/* 결제 정보 */}
        <div>
          <label className="label-text">결제 방법</label>
          <div className="flex gap-4 mt-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="paymentMethod"
                value="카드"
                checked={formData.paymentMethod === '카드'}
                onChange={handleChange}
                className="w-4 h-4 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700">카드</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="paymentMethod"
                value="입금"
                checked={formData.paymentMethod === '입금'}
                onChange={handleChange}
                className="w-4 h-4 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700">입금</span>
            </label>
          </div>
        </div>

        {/* 계약금액 */}
        <div>
          <label className="label-text">계약금액</label>
          <input
            type="text"
            name="amount"
            value={formData.amount}
            onChange={handleChange}
            className="input-field"
            placeholder="금액을 입력하세요"
          />
        </div>

        {/* 지급 조건 */}
        <div>
          <label className="label-text">지급 조건</label>
          <textarea
            name="paymentTerms"
            value={formData.paymentTerms}
            onChange={handleChange}
            className="input-field"
            rows="3"
            placeholder="지급 조건을 입력하세요"
          />
        </div>

        {/* 특이사항 */}
        <div>
          <label className="label-text">특이사항</label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            className="input-field"
            rows="3"
            placeholder="특이사항을 입력하세요"
          />
        </div>

        {/* 버튼 */}
        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            className="flex-1 bg-primary-600 hover:bg-primary-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
          >
            저장
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 bg-white hover:bg-gray-50 text-gray-700 font-medium py-3 px-4 rounded-lg border border-gray-300 transition-colors"
          >
            나가기
          </button>
        </div>
      </form>
    </Modal>
  )
}

export default ContractForm
