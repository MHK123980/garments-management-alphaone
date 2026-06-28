const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['Owner', 'Admin', 'Operator'],
    default: 'Operator'
  },
  activeSessionId: {
    type: String,
    default: null
  }
});

module.exports = mongoose.model('User', userSchema);
