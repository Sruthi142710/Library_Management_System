import { useEffect, useMemo, useState } from 'react';
import { api } from '../api.js';

const blank = { bookId: '', title: '', author: '', category: '', totalCopies: 1 };

export default function Books() {
  const [books, setBooks] = useState([]);
  const [q, setQ] = useState('');
  const [form, setForm] = useState(blank);
  const [editing, setEditing] = useState(null);
  const [file, setFile] = useState(null);
  const [fileKey, setFileKey] = useState(0);
  const [oldCover, setOldCover] = useState('');
  const [removeCover, setRemoveCover] = useState(false);
  const [msg, setMsg] = useState('');

  const load = () => api.get('/books?q=' + encodeURIComponent(q)).then(setBooks).catch((e) => setMsg(e.message));
  useEffect(() => { const t = setTimeout(load, 250); return () => clearTimeout(t); }, [q]);

  const preview = useMemo(() => (file ? URL.createObjectURL(file) : removeCover ? '' : oldCover), [file, oldCover, removeCover]);
  const reset = () => { setForm(blank); setEditing(null); setFile(null); setOldCover(''); setRemoveCover(false); setFileKey((k) => k + 1); };
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const submit = async (e) => {
    e.preventDefault();
    try {
      const body = new FormData();
      Object.entries(form).forEach(([k, v]) => body.append(k, v));
      if (file) body.append('cover', file);
      if (removeCover) body.append('removeCover', 'true');
      editing ? await api.put('/books/' + editing, body) : await api.post('/books', body);
      setMsg(editing ? 'Book updated' : 'Book added');
      reset(); load();
    } catch (err) { setMsg(err.message); }
  };
  const edit = (b) => { setFile(null); setRemoveCover(false); setOldCover(b.coverImage || ''); setFileKey((k) => k + 1); setEditing(b._id); setForm({ bookId: b.bookId, title: b.title, author: b.author, category: b.category, totalCopies: b.totalCopies }); };
  const remove = async (b) => {
    if (!confirm(`Delete "${b.title}"?`)) return;
    try { await api.del('/books/' + b._id); setMsg('Book deleted'); load(); } catch (err) { setMsg(err.message); }
  };

  return (
    <>
      <h2>Books</h2>
      <form className="form" onSubmit={submit}>
        <input placeholder="Book ID" value={form.bookId} onChange={set('bookId')} required />
        <input placeholder="Title" value={form.title} onChange={set('title')} required />
        <input placeholder="Author" value={form.author} onChange={set('author')} required />
        <input placeholder="Category" value={form.category} onChange={set('category')} />
        <input type="number" min="1" title="Total copies" value={form.totalCopies} onChange={set('totalCopies')} required />
        <div className="cover-field">
          {preview ? <img className="thumb" src={preview} alt="Cover preview" /> : <div className="thumb" />}
          <label>Cover photo (JPG, PNG, WebP, max 2 MB)
            <input key={fileKey} type="file" accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={(e) => { setFile(e.target.files[0] || null); setRemoveCover(false); }} />
          </label>
          {editing && oldCover && !file && (
            <label className="check"><input type="checkbox" checked={removeCover} onChange={(e) => setRemoveCover(e.target.checked)} /> Remove current cover</label>
          )}
        </div>
        <button className="primary">{editing ? 'Save changes' : 'Add book'}</button>
        {editing && <button type="button" onClick={reset}>Cancel</button>}
      </form>
      {msg && <p className="note">{msg}</p>}
      <input className="search" placeholder="Search by title, author or book ID" value={q} onChange={(e) => setQ(e.target.value)} />
      {books.length === 0 ? <p className="empty">No books found. Add one above.</p> : (
        <table>
          <thead><tr><th>Cover</th><th>ID</th><th>Title</th><th>Author</th><th>Category</th><th>Available</th><th></th></tr></thead>
          <tbody>
            {books.map((b) => (
              <tr key={b._id}>
                <td>{b.coverImage ? <img className="thumb" src={b.coverImage} alt={`Cover of ${b.title}`} /> : <div className="thumb" />}</td>
                <td>{b.bookId}</td><td>{b.title}</td><td>{b.author}</td><td>{b.category}</td>
                <td className={b.availableCopies === 0 ? 'late' : ''}>{b.availableCopies} / {b.totalCopies}</td>
                <td className="acts"><button onClick={() => edit(b)}>Edit</button><button onClick={() => remove(b)}>Delete</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
