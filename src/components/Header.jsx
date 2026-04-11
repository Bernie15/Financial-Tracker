function Header() {
  const now = new Date();
  const formatted = now.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <header className="header">
      <div className="header-left">
        <h1 className="logo">
          <span className="logo-icon">◈</span> Fintrack
        </h1>
        <p className="tagline">Personal Finance</p>
      </div>
      <div className="header-right">
        <p className="date">{formatted}</p>
      </div>
    </header>
  );
}

export default Header;
