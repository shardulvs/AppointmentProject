// models/request.js
const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema({
  studentName: String,
  email: String,
  professor: { type: mongoose.Schema.Types.ObjectId, ref: 'Professor' },
  status: { type: String, enum: ['pending', 'approved'], default: 'pending' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Request', requestSchema);
