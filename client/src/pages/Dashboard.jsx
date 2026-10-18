import { useEffect, useState } from 'react';
import { api, fmt, isOverdue } from '../api.js';

export default function Dashboard({ go }) {
  const [s, setS] = useState(null);
  const [open, setOpen] = useState([]);
  const [err, setErr] = useState('');

  useEffect(() => {
    Promise.all([api.get('/dashboard'), api.get('/issues?status=open')])
      .then(([stats, issues]) => { setS(stats); setOpen(issues.slice(0, 6)); })
      .catch((e) => setErr(e.message));
  }, []);

  if (err) return <p className="error">{err}. Check that the API and MongoDB are running.</p>;
  if (!s) return <p>Loading…</p>;

  const stats = [
    ['Book titles', s.titles], ['Registered students', s.students],
    ['Books issued', s.issued], ['Books available', s.available],
  ];

  return (
    <>
      <section className="hero">
        <div className="hero-text">
          <span className="eyebrow">YOUR LIBRARY WORKSPACE</span>
          <h2>Welcome to your little world of books.</h2>
          <p>Manage your collection, explore books and keep your library organized in one place.</p>
          <div className="hero-btns">
            <button className="btn-dark" onClick={() => go('books')}>Explore Books</button>
            <button className="btn-light" onClick={() => go('issues')}>Issue &amp; Return</button>
          </div>
        </div>
        <div className="art" aria-hidden="true">
          <div className="bk b1" /><div className="bk b2" /><div className="bk b3"><i>READ</i></div>
          <div className="mini m1"><span className="mi">▤</span><b>{s.copies}</b><span>Total Books</span></div>
          <div className="mini m2"><span className="mi">✓</span><b>{s.available}</b><span>Available</span></div>
        </div>
      </section>

      <div className="stats">
        {stats.map(([label, n]) => (<div className="stat" key={label}><b>{n}</b><span>{label}</span></div>))}
      </div>
      {s.overdue > 0 && <p className="warn">{s.overdue} book{s.overdue > 1 ? 's are' : ' is'} overdue.</p>}

      <h3>Currently on loan</h3>
      {open.length === 0 ? (
        <p className="empty">Nothing is on loan.</p>
      ) : (
        <table>
          <thead><tr><th>Book</th><th>Student</th><th>Due</th></tr></thead>
          <tbody>
            {open.map((i) => (
              <tr key={i._id} className={isOverdue(i) ? 'late' : ''}>
                <td>{i.book?.title}</td><td>{i.student?.name}</td><td>{fmt(i.dueDate)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}