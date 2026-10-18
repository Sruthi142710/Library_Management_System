import { useEffect, useState } from 'react';
import { api, fmt, isOverdue } from '../api.js';

const inDays = (n) => new Date(Date.now() + n * 864e5).toISOString().slice(0, 10);

export default function Issues() {
  const [books, setBooks] = useState([]);
  const [students, setStudents] = useState([]);
  const [issues, setIssues] = useState([]);
  const [form, setForm] = useState({ bookId: '', studentId: '', dueDate: inDays(14) });
  const [msg, setMsg] = useState('');

  const load = () => Promise.all([api.get('/books'), api.get('/students'), api.get('/issues')])
    .then(([b, s, i]) => { setBooks(b.filter((x) => x.availableCopies > 0)); setStudents(s); setIssues(i); })
    .catch((e) => setMsg(e.message));
  useEffect(() => { load(); }, []);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const issue = async (e) => {
    e.preventDefault();
    try {
      await api.post('/issues', form);
      setMsg('Book issued');
      setForm({ bookId: '', studentId: '', dueDate: inDays(14) }); load();
    } catch (err) { setMsg(err.message); }
  };
  const giveBack = async (i) => {
    try { await api.put(`/issues/${i._id}/return`); setMsg('Book returned'); load(); } catch (err) { setMsg(err.message); }
  };

  return (
    <>
      <h2>Issue &amp; return</h2>
      <form className="form" onSubmit={issue}>
        <select value={form.bookId} onChange={set('bookId')} required>
          <option value="">Select a book</option>
          {books.map((b) => <option key={b._id} value={b._id}>{b.title} ({b.availableCopies} left)</option>)}
        </select>
        <select value={form.studentId} onChange={set('studentId')} required>
          <option value="">Select a student</option>
          {students.map((s) => <option key={s._id} value={s._id}>{s.name} ({s.studentId})</option>)}
        </select>
        <input type="date" value={form.dueDate} min={inDays(0)} onChange={set('dueDate')} required />
        <button className="primary">Issue book</button>
      </form>
      {msg && <p className="note">{msg}</p>}
      {issues.length === 0 ? <p className="empty">No books have been issued yet.</p> : (
        <table>
          <thead><tr><th>Book</th><th>Student</th><th>Issued</th><th>Due</th><th>Returned</th><th></th></tr></thead>
          <tbody>
            {issues.map((i) => (
              <tr key={i._id} className={isOverdue(i) ? 'late' : ''}>
                <td>{i.book?.title}</td><td>{i.student?.name}</td><td>{fmt(i.issueDate)}</td><td>{fmt(i.dueDate)}</td>
                <td>{i.returnDate ? fmt(i.returnDate) : isOverdue(i) ? 'Overdue' : 'On loan'}</td>
                <td className="acts">{!i.returnDate && <button onClick={() => giveBack(i)}>Mark returned</button>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
