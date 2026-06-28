const mongoose = require('mongoose');

const sizeSetSchema = new mongoose.Schema({
  name: {
    type: String, // e.g., 'S-M-L', 'M-L-XL'
    required: true,
    unique: true
  },
  piecesPerSet: {
    type: Number,
    required: true,
    default: 3 // e.g. S-M-L is 3 pieces
  }
});

module.exports = mongoose.model('SizeSet', sizeSetSchema);
