import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/auth/Login.page';
import SignupPage from './pages/auth/Signup.page';
import ContractListPage from './pages/contracts/ContractList.page';
import ContractNewPage from './pages/contracts/ContractNew.page';
import ContractDetailPage from './pages/contracts/ContractDetail.page';
import PaymentDashboardPage from './pages/payments/PaymentDashboard.page';
import AdminContractTypesPage from './pages/admin/AdminContractTypes.page.jsx';
import AdminUsersPage from './pages/admin/AdminUsers.page.jsx';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* 인증 페이지 */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          
          <Route path="/" element={<Navigate to="/login" replace />} />
          
          {/* 보호된 페이지 */}
          <Route path="/contracts" element={
            <ProtectedRoute>
              <ContractListPage />
            </ProtectedRoute>
          } />
          <Route path="/contracts/new" element={
            <ProtectedRoute>
              <ContractNewPage />
            </ProtectedRoute>
          } />
          <Route path="/contracts/:id" element={
            <ProtectedRoute>
              <ContractDetailPage />
            </ProtectedRoute>
          } />
          <Route path="/payments" element={
            <ProtectedRoute>
              <PaymentDashboardPage />
            </ProtectedRoute>
          } />
          
          {/* 관리자 페이지 */}
          <Route path="/admin/contract-types" element={
            <ProtectedRoute requireAdmin>
              <AdminContractTypesPage />
            </ProtectedRoute>
          } />
          <Route path="/admin/users" element={
            <ProtectedRoute requireAdmin>
              <AdminUsersPage />
            </ProtectedRoute>
          } />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;