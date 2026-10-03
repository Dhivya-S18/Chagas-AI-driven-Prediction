import { NavLink } from 'react-router-dom';

const navigation = [
  { label: 'Dashboard', path: '/dashboard' },
  { label: 'Live Monitor', path: '/monitor' },
  { label: 'AI Analysis', path: '/analysis' },
  { label: 'History', path: '/history' },
  { label: 'Reports', path: '/reports' },
  { label: 'About', path: '/about' },
];

function Sidebar({ user, onLogout }) {
  return (
    <aside className="sidebar">
      <div className="brand-block">
        <div className="brand-badge">AI</div>
        <div>
          <p className="brand-title">Chagas AI</p>
        </div>
      </div>

      <div className="user-pill">{user?.name || 'User'}</div>

      <nav className="sidebar-nav" aria-label="Main navigation">
        {navigation.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `nav-item ${isActive ? 'active' : ''}`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      <button type="button" className="logout-button" onClick={onLogout}>
        Logout
      </button>
    </aside>
  );
}

export default Sidebar;
