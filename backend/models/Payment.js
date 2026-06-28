const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  party: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Party',
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  method: {
    type: String, // e.g. "Meezan Bank", "Cheque No. 4402", "Cash Parchi"
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Payment', paymentSchema);
