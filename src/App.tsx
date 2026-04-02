import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { TicketsPage } from './pages/TicketsPage';
import { UsersPage } from './pages/UsersPage';
import { RolesPage } from './pages/RolesPage';
import { DashboardLayout } from './components/layout/DashboardLayout';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false, // Don't loop on errors
      refetchOnWindowFocus: false,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<DashboardLayout children={<DashboardPage />} />} />
          <Route path="/tickets" element={<DashboardLayout children={<TicketsPage />} />} />
          <Route path="/users" element={<DashboardLayout children={<UsersPage />} />} />
          <Route path="/roles" element={<DashboardLayout children={<RolesPage />} />} />
        </Routes>
      </Router>
    </QueryClientProvider>
  );
}
