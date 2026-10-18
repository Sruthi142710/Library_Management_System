const mongoose = require('mongoose');
const { Schema, model } = mongoose;

const Book = model('Book', new Schema({
  bookId: { type: String, required: true, unique: true, trim: true },
  title: { type: String, required: true, trim: true },
  author: { type: String, required: true, trim: true },
  category: { type: String, default: 'General' },
  coverImage: { type: String, default: '' },
  totalCopies: { type: Number, required: true, min: 1, default: 1 },
  availableCopies: { type: Number, min: 0 },
}, { timestamps: true }));

const Student = model('Student', new Schema({
  studentId: { type: String, required: true, unique: true, trim: true },
  name: { type: String, required: true, trim: true },
  email: { type: String, trim: true },
  phone: { type: String, trim: true },
  department: { type: String, trim: true },
}, { timestamps: true }));

const Issue = model('Issue', new Schema({
  book: { type: Schema.Types.ObjectId, ref: 'Book', required: true },
  student: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
  issueDate: { type: Date, default: Date.now },
  dueDate: { type: Date, required: true },
  returnDate: { type: Date, default: null },
}, { timestamps: true }));

module.exports = { Book, Student, Issue };
