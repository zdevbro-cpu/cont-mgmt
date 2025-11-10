// API URL 중앙 관리
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const API_URL = API_BASE_URL;

// API 엔드포인트
export const API = {
  // 인증
  AUTH: `${API_BASE_URL}/api/auth`,
  
  // 계약
  CONTRACTS: `${API_BASE_URL}/api/contracts`,
  CONTRACT_TYPES: `${API_BASE_URL}/api/contract-types`,
  CONTRACT_TEMPLATES: `${API_BASE_URL}/api/contract-templates`,
  
  // 지급
  PAYMENTS: `${API_BASE_URL}/api/payments`,
  
  // 사용자
  USERS: `${API_BASE_URL}/api/users`,
};

export default API;