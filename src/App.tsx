// import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { Layout } from './components/Layout';
import {
  Login,
  Dashboard,
  Customers,
  InvoiceList,
  InvoiceForm,
  InvoiceDetail,
  Reports,
  Profile,
  BishiList,
  BishiCreate,
  BishiDetail
} from './pages';
import { ThemeProvider } from './context/ThemeContext';
import { ProfileProvider } from './context/ProfileContext';

function App() {
  return (
    <ThemeProvider>
      <ProfileProvider>
        <Toaster position="top-right" richColors />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="login" element={<Login />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="customers" element={<Customers />} />
              <Route path="invoices" element={<InvoiceList />} />
              <Route path="invoices/new" element={<InvoiceForm />} />
              <Route path="invoices/:id/edit" element={<InvoiceForm />} />
              <Route path="invoices/:id" element={<InvoiceDetail />} />
              <Route path="reports" element={<Reports />} />
              <Route path="profile" element={<Profile />} />
              <Route path="bishi" element={<BishiList />} />
              <Route path="bishi/create" element={<BishiCreate />} />
              <Route path="bishi/:id" element={<BishiDetail />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </ProfileProvider>
    </ThemeProvider>
  );
}

export default App;

