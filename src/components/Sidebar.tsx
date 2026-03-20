import React from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, FileText, LogOut,
  PieChart, ChevronLeft, ChevronRight, Menu, X, Building2
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { useProfile } from '../context/ProfileContext';

import mjLogo from '../assets/mj_logo.png';

const navItems = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Customers', path: '/customers', icon: Users },
  { name: 'Invoices', path: '/invoices', icon: FileText },
  { name: 'Reports', path: '/reports', icon: PieChart },
  { name: 'Profile', path: '/profile', icon: Building2 },
];

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

const NavTooltip: React.FC<{ label: string; visible: boolean; children: React.ReactNode }> = ({ label, visible, children }) => (
  <div className="relative group/tooltip">
    {children}
    {visible && (
      <span className="absolute left-full ml-3 top-1/2 -translate-y-1/2 bg-[#2A2A1A] text-[#F5F5F0] text-xs px-2.5 py-1.5 rounded-md whitespace-nowrap opacity-0 group-hover/tooltip:opacity-100 transition-opacity duration-150 pointer-events-none z-[999] border border-[#B8860B]/30 shadow-lg">
        {label}
      </span>
    )}
  </div>
);

export const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, onToggle, mobileOpen, onMobileClose }) => {
  const { logout, user } = useStore();
  const { profile } = useProfile();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const sidebarContent = (isMobile = false) => (
    <div className="flex flex-col h-full relative">
      {/* Toggle button (not on mobile) */}
      {!isMobile && (
        <button
          onClick={onToggle}
          className="absolute -right-3 top-7 w-6 h-6 rounded-full bg-[#B8860B] text-white flex items-center justify-center shadow-lg cursor-pointer hover:bg-[#FFD700] transition-colors z-50"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>
      )}

      {/* Logo */}
      {isCollapsed && !isMobile ? (
        <div className="relative group">
          <div className="flex items-center justify-center py-5 border-b border-[#2E2E2E]">
            <img
              src={mjLogo}
              alt="MJ"
              onError={(e) => {
                e.currentTarget.src = '/mj_logo.png';
              }}
              className="w-9 h-9 rounded-md object-contain"
              style={{ background: '#FBF0E4', padding: '2px' }}
            />
          </div>
          <span className="
            absolute left-full ml-3 top-1/2 -translate-y-1/2
            bg-[#1A1A1A] text-[#F5F5F0] text-xs font-medium
            px-3 py-1.5 rounded-md whitespace-nowrap
            border border-[#B8860B]/30
            opacity-0 group-hover:opacity-100
            transition-opacity duration-150
            pointer-events-none z-50
          ">
            {profile.name}
          </span>
        </div>
      ) : (
        <div className="flex items-center gap-3 px-3 py-5 border-b border-[#2E2E2E] overflow-hidden">
          <img
            src={mjLogo}
            alt={`${profile.name} Logo`}
            onError={(e) => {
              e.currentTarget.src = '/mj_logo.png';
            }}
            className="w-10 h-10 rounded-lg object-contain flex-shrink-0"
            style={{ background: '#FBF0E4', padding: '2px' }}
          />
          <div className="flex flex-col leading-tight min-w-0 flex-1">
            <span className="text-[#FFD700] font-bold text-[15px] xl:text-base uppercase line-clamp-2 leading-tight break-words pr-1">
              {profile.name}
            </span>
            <span className="text-[#9A9A8A] text-xs uppercase truncate">
              Billing System
            </span>
          </div>
          {/* Mobile close button */}
          {isMobile && (
            <button onClick={onMobileClose} className="ml-auto text-[#9A9A8A] hover:text-[#F5F5F0] p-1">
              <X size={20} />
            </button>
          )}
        </div>
      )}

      {/* Navigation */}
      <div className="flex flex-col flex-1 py-6 px-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname.startsWith(item.path);
          return (
            <NavTooltip key={item.name} label={item.name} visible={isCollapsed && !isMobile}>
              <NavLink
                to={item.path}
                onClick={isMobile ? onMobileClose : undefined}
                className={`flex items-center rounded-lg transition-all duration-200 ${
                  isCollapsed && !isMobile ? 'justify-center px-0 py-3' : 'gap-3 px-4 py-3'
                } ${
                  isActive
                    ? 'bg-[#B8860B]/20 text-[#FFD700] border border-[#B8860B]/30'
                    : 'text-[#9A9A8A] hover:bg-[#1F1A0E] hover:text-[#F5F5F0]'
                }`}
              >
                <Icon size={20} className={`flex-shrink-0 ${isActive ? 'text-[#FFD700]' : ''}`} />
                {(!isCollapsed || isMobile) && (
                  <span className="font-medium text-sm whitespace-nowrap overflow-hidden">{item.name}</span>
                )}
              </NavLink>
            </NavTooltip>
          );
        })}
      </div>

      {/* Bottom Section */}
      <div className="p-3 border-t border-[#2E2E2E] space-y-2">
        {/* User info */}
        {(!isCollapsed || isMobile) && (
          <div className="px-3 py-2 rounded-lg bg-[#1A1A1A]">
            <p className="text-[#9A9A8A] text-xs uppercase tracking-wider mb-0.5">Logged in as</p>
            <p className="text-[#F5F5F0] font-medium text-sm">{user?.username || 'Admin'}</p>
          </div>
        )}

        {/* Sign Out */}
        <NavTooltip label="Sign Out" visible={isCollapsed && !isMobile}>
          <button
            onClick={handleLogout}
            className={`w-full flex items-center text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-lg transition-colors text-sm ${
              isCollapsed && !isMobile ? 'justify-center py-2.5' : 'gap-3 px-4 py-2.5'
            }`}
          >
            <LogOut size={18} />
            {(!isCollapsed || isMobile) && <span>Sign Out</span>}
          </button>
        </NavTooltip>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <div
        className={`hidden md:flex flex-col h-screen bg-[#0A0A0A] border-r border-[#2E2E2E] relative flex-shrink-0 transition-[width] duration-[250ms] cubic-bezier(0.4,0,0.2,1) ${
          isCollapsed ? 'w-16' : 'w-[230px]'
        }`}
      >
        {sidebarContent(false)}
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <>
          <div className="md:hidden fixed inset-0 bg-black/60 z-40" onClick={onMobileClose} />
          <div className="md:hidden fixed left-0 top-0 bottom-0 w-[230px] bg-[#0A0A0A] border-r border-[#2E2E2E] z-50 flex flex-col">
            {sidebarContent(true)}
          </div>
        </>
      )}
    </>
  );
};

// Hamburger button for mobile — exported for use in Layout
export const MobileMenuButton: React.FC<{ onClick: () => void }> = ({ onClick }) => (
  <button
    onClick={onClick}
    className="md:hidden fixed top-4 left-4 z-30 p-2 bg-[#0A0A0A] border border-[#2E2E2E] rounded-lg text-[#9A9A8A] hover:text-[#F5F5F0] hover:border-[#B8860B]/50 transition-all"
  >
    <Menu size={22} />
  </button>
);
