import { useEffect, useState } from 'react';
import Dashboard from './pages/Dashboard.jsx';
import Books from './pages/Books.jsx';
import Students from './pages/Students.jsx';
import Issues from './pages/Issues.jsx';

const tabs = [
  ['dashboard', 'Dashboard', '▦', Dashboard],
  ['books', 'Books', '▤', Books],
  ['students', 'Students', '☺', Students],
  ['issues', 'Issue & Return', '⇄', Issues],
];

export default function App() {
  const [tab, setTab] = useState('dashboard');
  const [theme, setTheme] = useState(() => {
    try { return localStorage.getItem('theme') || 'dark'; } catch { return 'dark'; }
  });

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try { localStorage.setItem('theme', theme); } catch {}
  }, [theme]);

  const Page = tabs.find((t) => t[0] === tab)[3];

  return (
    <div className="shell">
      <aside className="side">
        <div className="brand">
          <div className="logo">B</div>
          <div><b>BOOKNEST</b><span>Library Management</span></div>
        </div>
        <p className="menu-label">MAIN MENU</p>
        {tabs.map(([key, label, icon]) => (
          <button key={key} className={tab === key ? 'on' : ''} onClick={() => setTab(key)}>
            <span className="ico">{icon}</span>{label}
          </button>
        ))}
      </aside>
      <div className="content">
        <header className="top">
          <div>
            <h1>BookNest Library</h1>
            <p>Your reading world, organized.</p>
          </div>
          <div className="top-right">
            <span className="eyebrow">FOREST EDITION</span>
            <button className="toggle" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
              {theme === 'dark' ? '☀ Light Mode' : '☾ Dark Mode'}
            </button>
          </div>
        </header>
        <main><Page key={tab} go={setTab} /></main>
      </div>
    </div>
  );
}