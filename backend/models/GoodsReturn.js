const mongoose = require('mongoose');

const returnItemSchema = new mongoose.Schema({
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

const goodsReturnSchema = new mongoose.Schema({
  party: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Party',
    required: true
  },
  items: [returnItemSchema],
  totalAmount: {
    type: Number,
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('GoodsReturn', goodsReturnSchema);
