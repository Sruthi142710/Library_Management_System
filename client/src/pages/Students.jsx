import { useEffect, useState } from 'react';
import { api, fmt, isOverdue } from '../api.js';

const blank = { studentId: '', name: '', email: '', phone: '', department: '' };

export default function Students() {
  const [list, setList] = useState([]);
  const [q, setQ] = useState('');
  const [form, setForm] = useState(blank);
  const [editing, setEditing] = useState(null);
  const [history, setHistory] = useState(null);
  const [msg, setMsg] = useState('');

  const load = () => api.get('/students?q=' + encodeURIComponent(q)).then(setList).catch((e) => setMsg(e.message));
  useEffect(() => { const t = setTimeout(load, 250); return () => clearTimeout(t); }, [q]);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const submit = async (e) => {
    e.preventDefault();
    try {
      editing ? await api.put('/students/' + editing, form) : await api.post('/students', form);
      setMsg(editing ? 'Student updated' : 'Student added');
      setForm(blank); setEditing(null); load();
    } catch (err) { setMsg(err.message); }
  };
  const remove = async (s) => {
    if (!confirm(`Delete ${s.name}?`)) return;
    try { await api.del('/students/' + s._id); setMsg('Student deleted'); load(); } catch (err) { setMsg(err.message); }
  };
  const showHistory = async (s) => setHistory({ student: s, rows: await api.get(`/students/${s._id}/history`) });

  return (
    <>
      <h2>Students</h2>
      <form className="form" onSubmit={submit}>
        <input placeholder="Student ID" value={form.studentId} onChange={set('studentId')} required />
        <input placeholder="Full name" value={form.name} onChange={set('name')} required />
        <input type="email" placeholder="Email" value={form.email} onChange={set('email')} />
        <input placeholder="Phone" value={form.phone} onChange={set('phone')} />
        <input placeholder="Department" value={form.department} onChange={set('department')} />
        <button className="primary">{editing ? 'Save changes' : 'Add student'}</button>
        {editing && <button type="button" onClick={() => { setEditing(null); setForm(blank); }}>Cancel</button>}
      </form>
      {msg && <p className="note">{msg}</p>}
      <input className="search" placeholder="Search by name or student ID" value={q} onChange={(e) => setQ(e.target.value)} />
      {list.length === 0 ? <p className="empty">No students found. Add one above.</p> : (
        <table>
          <thead><tr><th>ID</th><th>Name</th><th>Department</th><th>Email</th><th></th></tr></thead>
          <tbody>
            {list.map((s) => (
              <tr key={s._id}>
                <td>{s.studentId}</td><td>{s.name}</td><td>{s.department}</td><td>{s.email}</td>
                <td className="acts">
                  <button onClick={() => showHistory(s)}>History</button>
                  <button onClick={() => { setEditing(s._id); setForm({ studentId: s.studentId, name: s.name, email: s.email || '', phone: s.phone || '', department: s.department || '' }); }}>Edit</button>
                  <button onClick={() => remove(s)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {history && (
        <div className="panel">
          <h3>Borrowing history: {history.student.name} <button onClick={() => setHistory(null)}>Close</button></h3>
          {history.rows.length === 0 ? <p className="empty">No books borrowed yet.</p> : (
            <table>
              <thead><tr><th>Book</th><th>Issued</th><th>Due</th><th>Returned</th></tr></thead>
              <tbody>
                {history.rows.map((i) => (
                  <tr key={i._id} className={isOverdue(i) ? 'late' : ''}>
                    <td>{i.book?.title}</td><td>{fmt(i.issueDate)}</td><td>{fmt(i.dueDate)}</td><td>{fmt(i.returnDate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </>
  );
}
