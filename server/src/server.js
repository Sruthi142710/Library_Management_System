require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { Book, Student, Issue } = require('./models');

const app = express();
app.use(cors());
app.use(express.json());

// Book cover uploads
const uploadDir = path.join(__dirname, '..', 'uploads');
fs.mkdirSync(uploadDir, { recursive: true });
app.use('/uploads', express.static(uploadDir));
const upload = multer({
  storage: multer.diskStorage({
    destination: uploadDir,
    filename: (req, file, cb) => cb(null, Date.now() + '-' + Math.round(Math.random() * 1e6) + path.extname(file.originalname).toLowerCase()),
  }),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => (/^image\/(jpeg|png|webp|gif)$/.test(file.mimetype) ? cb(null, true) : cb(new Error('Cover must be a JPG, PNG, WebP or GIF image'))),
});
const uploadCover = (req, res, next) => upload.single('cover')(req, res, (err) =>
  err ? res.status(400).json({ message: err.code === 'LIMIT_FILE_SIZE' ? 'Cover image must be under 2 MB' : err.message }) : next());
const removeFile = (url) => url && fs.unlink(path.join(uploadDir, path.basename(url)), () => {});

const wrap = (fn) => (req, res) => fn(req, res).catch((e) => {
  const dup = e.code === 11000;
  res.status(dup ? 409 : e.status || 400).json({ message: dup ? 'That ID already exists' : e.message });
});
const fail = (status, message) => Object.assign(new Error(message), { status });
const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Dashboard
app.get('/api/dashboard', wrap(async (req, res) => {
  const [books, students, issued, overdue, totals] = await Promise.all([
    Book.countDocuments(), Student.countDocuments(),
    Issue.countDocuments({ returnDate: null }),
    Issue.countDocuments({ returnDate: null, dueDate: { $lt: new Date() } }),
    Book.aggregate([{ $group: { _id: null, total: { $sum: '$totalCopies' }, available: { $sum: '$availableCopies' } } }]),
  ]);
  res.json({ titles: books, copies: totals[0]?.total || 0, available: totals[0]?.available || 0, students, issued, overdue });
}));

// Books
app.get('/api/books', wrap(async (req, res) => {
  const q = (req.query.q || '').trim();
  const filter = q ? { $or: ['title', 'author', 'bookId'].map((f) => ({ [f]: new RegExp(escape(q), 'i') })) } : {};
  res.json(await Book.find(filter).sort('title'));
}));
app.post('/api/books', uploadCover, wrap(async (req, res) => {
  const { removeCover, ...b } = req.body;
  const total = Number(b.totalCopies) || 1;
  try {
    res.status(201).json(await Book.create({ ...b, totalCopies: total, availableCopies: total, coverImage: req.file ? '/uploads/' + req.file.filename : '' }));
  } catch (e) { if (req.file) removeFile(req.file.filename); throw e; }
}));
app.put('/api/books/:id', uploadCover, wrap(async (req, res) => {
  const newFile = req.file && req.file.filename;
  try {
    const book = await Book.findById(req.params.id);
    if (!book) throw fail(404, 'Book not found');
    const out = book.totalCopies - book.availableCopies;
    const total = Number(req.body.totalCopies ?? book.totalCopies);
    if (total < out) throw fail(400, `${out} copies are currently issued; total cannot be lower`);
    const { removeCover, ...fields } = req.body;
    const oldCover = book.coverImage;
    Object.assign(book, fields, { totalCopies: total, availableCopies: total - out });
    if (newFile) book.coverImage = '/uploads/' + newFile;
    else if (removeCover === 'true') book.coverImage = '';
    const saved = await book.save();
    if (oldCover && oldCover !== saved.coverImage) removeFile(oldCover);
    res.json(saved);
  } catch (e) { if (newFile) removeFile(newFile); throw e; }
}));
app.delete('/api/books/:id', wrap(async (req, res) => {
  if (await Issue.exists({ book: req.params.id, returnDate: null })) throw fail(400, 'Book has copies out on loan');
  const book = await Book.findByIdAndDelete(req.params.id);
  if (book) removeFile(book.coverImage);
  res.json({ ok: true });
}));

// Students
app.get('/api/students', wrap(async (req, res) => {
  const q = (req.query.q || '').trim();
  const filter = q ? { $or: ['name', 'studentId'].map((f) => ({ [f]: new RegExp(escape(q), 'i') })) } : {};
  res.json(await Student.find(filter).sort('name'));
}));
app.post('/api/students', wrap(async (req, res) => res.status(201).json(await Student.create(req.body))));
app.put('/api/students/:id', wrap(async (req, res) =>
  res.json(await Student.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }))));
app.delete('/api/students/:id', wrap(async (req, res) => {
  if (await Issue.exists({ student: req.params.id, returnDate: null })) throw fail(400, 'Student still has books to return');
  await Student.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
}));
app.get('/api/students/:id/history', wrap(async (req, res) =>
  res.json(await Issue.find({ student: req.params.id }).populate('book', 'title bookId').sort('-issueDate'))));

// Issue & return
app.get('/api/issues', wrap(async (req, res) => {
  const filter = req.query.status === 'open' ? { returnDate: null } : {};
  res.json(await Issue.find(filter).populate('book', 'title bookId').populate('student', 'name studentId').sort('-issueDate'));
}));
app.post('/api/issues', wrap(async (req, res) => {
  const { bookId, studentId, dueDate } = req.body;
  if (!bookId || !studentId || !dueDate) throw fail(400, 'Book, student and due date are required');
  const book = await Book.findOneAndUpdate({ _id: bookId, availableCopies: { $gt: 0 } }, { $inc: { availableCopies: -1 } });
  if (!book) throw fail(400, 'No copies of this book are available');
  try {
    res.status(201).json(await Issue.create({ book: bookId, student: studentId, dueDate }));
  } catch (e) {
    await Book.findByIdAndUpdate(bookId, { $inc: { availableCopies: 1 } });
    throw e;
  }
}));
app.put('/api/issues/:id/return', wrap(async (req, res) => {
  const issue = await Issue.findOneAndUpdate({ _id: req.params.id, returnDate: null }, { returnDate: new Date() }, { new: true });
  if (!issue) throw fail(400, 'Already returned or not found');
  await Book.findByIdAndUpdate(issue.book, { $inc: { availableCopies: 1 } });
  res.json(issue);
}));

mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/library')
  .then(() => app.listen(process.env.PORT || 5000, () => console.log('API running on port ' + (process.env.PORT || 5000))))
  .catch((e) => { console.error('MongoDB connection failed:', e.message); process.exit(1); });
