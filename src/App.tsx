import React, { type JSX } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router';
import { AdminLayout } from './layouts/AdminLayout';
import { Dashboard } from './pages/Dashboard';
import { Login } from './pages/Login';
import { Products } from './pages/Products';
import { ProductForm } from './pages/ProductForm';
import { Categories } from './pages/Categories';
import { Orders } from './pages/Orders';
import { Users } from './pages/Users';
import { Settings } from './pages/Settings';
import { Coupons } from './pages/Coupons';
import { Reviews } from './pages/Reviews';
import { Payments } from './pages/Payments';
import { Pages } from './pages/Pages';
import { PageForm } from './pages/PageForm';
import { Blogs } from './pages/Blogs';
import { BlogForm } from './pages/BlogForm';
import { Events } from './pages/Events';
import { Crawler } from './pages/Crawler';
import { GiftBuilder } from './pages/GiftBuilder';
import { Subscribers } from './pages/Subscribers';
import { ComposeMail } from './pages/ComposeMail';
import { Toaster } from 'sonner';
import { SWRConfig } from 'swr';

const RequireAuth = ({ children }: { children: JSX.Element }) => {
  const token = localStorage.getItem('adminToken');
  const location = useLocation();

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return children;
};

const App: React.FC = () => {
  return (
    <SWRConfig
      value={{
        revalidateOnFocus: false,
        revalidateIfStale: false,
        revalidateOnReconnect: false,
        shouldRetryOnError: false
      }}
    >
      <Router>
        <Toaster position="top-right" richColors />
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route path="/" element={
            <RequireAuth>
              <AdminLayout />
            </RequireAuth>
          }>
            <Route index element={<Dashboard />} />
            {/* We can add these later as needed */}
            <Route path="orders" element={<Orders />} />
            <Route path="products" element={<Products />} />
            <Route path="products/new" element={<ProductForm />} />
            <Route path="products/edit/:id" element={<ProductForm />} />
            <Route path="gift-builder" element={<GiftBuilder />} />
            <Route path="boxes" element={<GiftBuilder />} />
            <Route path="cards" element={<GiftBuilder />} />
            <Route path="categories" element={<Categories />} />
            <Route path="users" element={<Users />} />
            <Route path="coupons" element={<Coupons />} />
            <Route path="reviews" element={<Reviews />} />
            <Route path="payments" element={<Payments />} />
            <Route path="pages" element={<Pages />} />
            <Route path="pages/new" element={<PageForm />} />
            <Route path="pages/edit/:id" element={<PageForm />} />
            <Route path="blogs" element={<Blogs />} />
            <Route path="blogs/new" element={<BlogForm />} />
            <Route path="blogs/edit/:id" element={<BlogForm />} />
            <Route path="events" element={<Events />} />
            <Route path="crawler" element={<Crawler />} />
            <Route path="subscribers" element={<Subscribers />} />
            <Route path="subscribers/compose" element={<ComposeMail />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      </Router>
    </SWRConfig>
  );
};

export default App;