import React, { useEffect, useState } from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { Sidebar, MobileMenuButton } from './Sidebar';

const SIDEBAR_KEY = 'swarna-sidebar-collapsed';

export const Layout: React.FC = () => {
  const { isAuthenticated } = useStore();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    return localStorage.getItem(SIDEBAR_KEY) === 'true';
  });
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleToggle = () => {
    const next = !isCollapsed;
    setIsCollapsed(next);
    localStorage.setItem(SIDEBAR_KEY, String(next));
  };

  // Close mobile sidebar on route change
  const pathname = location.pathname;
  useEffect(() => {
    if (mobileOpen) setMobileOpen(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  if (!isAuthenticated && location.pathname !== '/login') {
    return <Navigate to="/login" replace />;
  }
  if (isAuthenticated && location.pathname === '/login') {
    return <Navigate to="/dashboard" replace />;
  }
  if (!isAuthenticated) {
    return <Outlet />;
  }

  return (
    <div className="flex h-screen bg-[#FAFAF7] dark:bg-[#0A0A0A] overflow-hidden">
      <Sidebar
        isCollapsed={isCollapsed}
        onToggle={handleToggle}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />
      {/* Mobile hamburger */}
      <MobileMenuButton onClick={() => setMobileOpen(true)} />
      <main
        className={`flex-1 overflow-y-auto transition-all duration-[250ms] ease-in-out ${
          mobileOpen ? 'md:ml-0' : ''
        }`}
        style={{ paddingLeft: 0 }}
      >
        <div className="p-4 md:p-8 max-w-7xl mx-auto pt-16 md:pt-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
