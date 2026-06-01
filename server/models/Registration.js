const mongoose = require('mongoose');

const registrationSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  phone: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true, lowercase: true, index: true },
  college: { type: String, required: true, trim: true },
  plan: { type: String, enum: ['workshop', 'oneonone'], required: true },
  amount: { type: Number, required: true },
  transactionId: { type: String, required: true, unique: true, index: true, trim: true },
  goal: { type: String, trim: true, default: '' },
  status: { type: String, enum: ['pending', 'confirmed', 'rejected'], default: 'pending' },
  registeredAt: { type: Date, default: Date.now, index: true }
});

module.exports = mongoose.model('Registration', registrationSchema);
