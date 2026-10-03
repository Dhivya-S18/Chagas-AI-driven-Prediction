import ConnectionStatus from './ConnectionStatus';

function Header({ title, user }) {
  const initials = user?.name
    ?.split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'U';

  return (
    <header className="topbar">
      <div>
        <p className="eyebrow-text">Monitoring Overview</p>
        <h1 className="page-title">{title}</h1>
      </div>

      <div className="topbar-actions">
        <ConnectionStatus status="DEMO ECG" />
        <div className="profile-card">
          <div className="avatar">{initials}</div>
          <div>
            <p className="profile-name">{user?.name || 'User'}</p>
            <span className="profile-meta">{user?.email || 'Personal account'}</span>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
