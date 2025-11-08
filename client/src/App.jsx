import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ContractListPage from './pages/contracts/ContractList.page';
import ContractNewPage from './pages/contracts/ContractNew.page';
import ContractDetailPage from './pages/contracts/ContractDetail.page';
import PaymentDashboardPage from './pages/payments/PaymentDashboard.page';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/contracts" replace />} />
        <Route path="/contracts" element={<ContractListPage />} />
        <Route path="/contracts/new" element={<ContractNewPage />} />
        <Route path="/contracts/:id" element={<ContractDetailPage />} />
        <Route path="/payments" element={<PaymentDashboardPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;