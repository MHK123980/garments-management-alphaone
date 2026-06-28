const mongoose = require('mongoose');

const partySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  city: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'City',
    required: true
  },
  address: {
    type: String,
    default: '' // Optional specific market or location
  },
  type: {
    type: String,
    enum: ['Normal', 'GR'],
    default: 'Normal'
  }
}, { timestamps: true });

module.exports = mongoose.model('Party', partySchema);
