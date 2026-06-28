const mongoose = require('mongoose');

const billItemSchema = new mongoose.Schema({
  stock: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Stock',
    required: true
  },
  pieces: {
    type: Number,
    required: true
  },
  perPiecePrice: {
    type: Number,
    required: true
  }
}, { _id: false });

const billSchema = new mongoose.Schema({
  billNo: {
    type: Number,
    unique: true
  },
  party: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Party',
    required: true
  },
  items: [billItemSchema],
  discountPercent: {
    type: Number,
    default: 0
  },
  grossTotal: {
    type: Number,
    required: true
  },
  discountAmount: {
    type: Number,
    required: true
  },
  netTotal: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['Saved', 'Printed'],
    default: 'Saved'
  },
  isGR: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

// Auto-increment billNo
billSchema.pre('save', async function () {
  if (this.isNew) {
    const lastBill = await this.constructor.findOne({}, {}, { sort: { 'billNo': -1 } });
    if (lastBill && lastBill.billNo) {
      this.billNo = lastBill.billNo + 1;
    } else {
      this.billNo = 1001;
    }
  }
});

module.exports = mongoose.model('Bill', billSchema);
