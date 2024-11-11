// models/professor.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const professorSchema = new mongoose.Schema({
  name: String,
  username: { type: String, unique: true },
  password: String,
  officeHours: String
});

professorSchema.pre('save', async function(next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

professorSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('Professor', professorSchema);
