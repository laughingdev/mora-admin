import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useSearchParams, useLocation } from 'react-router';
import { LayoutDashboard, Users, ShoppingCart, Package, Settings, LogOut, Bell, FolderTree, Menu, X, ChevronLeft, ChevronRight, Search, Ticket, MessageSquare, CreditCard, FileText, PenTool, Calendar, SlidersHorizontal, Gift, Mail } from 'lucide-react';

const TopbarSearch = React.memo(() => {
  const location = useLocation();
  const allowedPaths = ['/products', '/orders', '/users'];
  const isAllowed = allowedPaths.includes(location.pathname);

  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('search') || '');

  useEffect(() => {
    setQuery(searchParams.get('search') || '');
  }, [searchParams]);

  if (!isAllowed) return <div className="search-bar desktop-only" style={{ width: '280px' }} />; // placeholder to maintain layout

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const newParams = new URLSearchParams(searchParams);
      if (query.trim()) {
        newParams.set('search', query.trim());
      } else {
        newParams.delete('search');
      }
      newParams.delete('page'); // Reset to page 1
      setSearchParams(newParams);
    }
  };

  return (
    <div className="search-bar desktop-only" style={{ position: 'relative' }}>
      <Search size={16} color="var(--text-secondary)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
      <input 
        type="text" 
        placeholder="Search and press Enter..." 
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        style={{
          background: 'var(--surface-color)',
          border: '1px solid var(--border-color)',
          padding: '0.5rem 1rem 0.5rem 2.5rem',
          borderRadius: '8px',
          color: 'var(--text-primary)',
          outline: 'none',
          width: '280px',
          transition: 'all 0.2s',
        }} 
        onFocus={(e) => e.target.style.boxShadow = '0 0 0 2px rgba(107, 41, 57, 0.2)'}
        onBlur={(e) => e.target.style.boxShadow = 'none'}
      />
    </div>
  );
});

export const AdminLayout: React.FC = () => {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(false);
  
  const navItems = [
    { name: 'Dashboard', path: '/', icon: <LayoutDashboard size={20} /> },
    { name: 'Orders', path: '/orders', icon: <ShoppingCart size={20} /> },
    { name: 'Products', path: '/products', icon: <Package size={20} /> },
    { name: 'Gift Boxes & Cards', path: '/gift-builder', icon: <Gift size={20} /> },
    { name: 'Categories', path: '/categories', icon: <FolderTree size={20} /> },
    { name: 'Events / Occasions', path: '/events', icon: <Calendar size={20} /> },
    { name: 'Hero Crawler', path: '/crawler', icon: <SlidersHorizontal size={20} /> },
    { name: 'Users', path: '/users', icon: <Users size={20} /> },
    { name: 'Subscribers', path: '/subscribers', icon: <Mail size={20} /> },
    { name: 'Coupons', path: '/coupons', icon: <Ticket size={20} /> },
    { name: 'Payments', path: '/payments', icon: <CreditCard size={20} /> },
    { name: 'Pages', path: '/pages', icon: <FileText size={20} /> },
    { name: 'Blogs', path: '/blogs', icon: <PenTool size={20} /> },
    { name: 'Reviews', path: '/reviews', icon: <MessageSquare size={20} /> },
    { name: 'Settings', path: '/settings', icon: <Settings size={20} /> },
  ];

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    navigate('/login');
  };

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <div className={`app-container ${isDesktopCollapsed ? 'desktop-collapsed' : ''}`}>
      
      {/* Mobile Drawer Overlay */}
      {isMobileMenuOpen && (
        <div className="mobile-overlay" onClick={closeMobileMenu}></div>
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${isMobileMenuOpen ? 'drawer-open' : ''}`}>
        <div className="sidebar-header" style={{ justifyContent: 'space-between', padding: '0 1rem', position: 'relative' }}>
          <img src="/mora-logo.png" alt="Mora Moments" style={{ height: '40px', objectFit: 'contain', margin: '0 auto' }} className="desktop-logo" />
          
          {/* Desktop Collapse Toggle */}
          <button 
            className="desktop-only" 
            onClick={() => setIsDesktopCollapsed(!isDesktopCollapsed)}
            style={{ 
              background: 'var(--surface-color)', 
              border: '1px solid var(--border-color)', 
              borderRadius: '50%',
              width: '28px', height: '28px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: 'var(--primary-accent)',
              position: 'absolute', right: isDesktopCollapsed ? '50%' : '-14px', top: '50%',
              transform: isDesktopCollapsed ? 'translate(50%, -50%)' : 'translate(0, -50%)',
              zIndex: 10,
              boxShadow: '0 2px 5px rgba(0,0,0,0.05)'
            }}
          >
            {isDesktopCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>

          <button className="mobile-only close-menu-btn" onClick={closeMobileMenu}>
            <X size={24} color="var(--primary-accent)" />
          </button>
        </div>
        
        <nav className="nav-links">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={closeMobileMenu}
            >
              {item.icon}
              <span>{item.name}</span>
            </NavLink>
          ))}
        </nav>

        {/* Desktop Profile & Logout at Bottom */}
        <div className="desktop-only" style={{ marginTop: 'auto', padding: '1.5rem 1rem', borderTop: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
            <div className="avatar" style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--primary-accent)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
              A
            </div>
            <div className="profile-info">
              <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>Admin User</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>admin@mora.com</div>
            </div>
          </div>
          <button 
            className="nav-item" 
            onClick={handleLogout}
            style={{ width: '100%', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', color: 'var(--danger-accent)' }}
          >
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="main-content">
        <header className="topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button className="mobile-only hamburger-btn" onClick={() => setIsMobileMenuOpen(true)}>
              <Menu size={24} color="var(--text-primary)" />
            </button>
            <TopbarSearch />
            {/* Mobile Logo fallback */}
            <img src="/mora-logo.png" alt="Mora" className="mobile-only" style={{ height: '30px' }} />
          </div>

          <div className="header-actions" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <button className="desktop-only" style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
              <Bell size={20} />
            </button>
            
            {/* Mobile Profile & Logout */}
            <div className="mobile-only" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div className="avatar" style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--primary-accent)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '14px' }}>
                A
              </div>
              <button onClick={handleLogout} style={{ background: 'transparent', border: 'none', color: 'var(--danger-accent)', display: 'flex', alignItems: 'center' }}>
                <LogOut size={20} />
              </button>
            </div>
          </div>
        </header>

        <main className="content-wrapper fade-in">
          <Outlet />
        </main>
      </div>
    </div>
  );
};