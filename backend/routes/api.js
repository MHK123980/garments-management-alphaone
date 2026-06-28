const express = require('express');
const router = express.Router();
const User = require('../models/User');
const SizeSet = require('../models/SizeSet');
const City = require('../models/City');
const Party = require('../models/Party');
const Stock = require('../models/Stock');
const Bill = require('../models/Bill');
const Payment = require('../models/Payment');
const GoodsReturn = require('../models/GoodsReturn');

// Pusher instance will be attached to the app request
// req.app.get('pusher')

// --- AUTHENTICATION & USERS ---
router.post('/login', async (req, res) => {
  try {
    const user = await User.findOne({ id: req.body.id, password: req.body.password });
    if (user) {
      res.json({ success: true, user: { id: user.id, role: user.role } });
    } else {
      res.json({ success: false, message: 'Invalid credentials' });
    }
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
});

router.post('/logout', async (req, res) => {
  // Can clear activeSessionId if implemented via token
  res.json({ success: true });
});

router.get('/users', async (req, res) => {
  const users = await User.find({}, '-password');
  res.json({ success: true, users });
});

router.post('/users', async (req, res) => {
  try {
    const newUser = new User(req.body);
    await newUser.save();
    const users = await User.find({}, '-password');
    req.app.get('pusher').trigger('alpha-one', 'users_updated', { timestamp: Date.now() });
    res.json({ success: true });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
});

router.delete('/users/:id', async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    const users = await User.find({}, '-password');
    req.app.get('pusher').trigger('alpha-one', 'users_updated', { timestamp: Date.now() });
    res.json({ success: true });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
});

router.put('/users/:id/role', async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.params.id, { role: req.body.role });
    const users = await User.find({}, '-password');
    req.app.get('pusher').trigger('alpha-one', 'users_updated', { timestamp: Date.now() });
    res.json({ success: true });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
});

// --- SIZESETS ---
router.get('/sizesets', async (req, res) => {
  const sizes = await SizeSet.find();
  res.json({ success: true, sizes });
});
router.post('/sizesets', async (req, res) => {
  try {
    await SizeSet.create(req.body);
    const sizes = await SizeSet.find();
    req.app.get('pusher').trigger('alpha-one', 'sizesets_updated', { timestamp: Date.now() });
    res.json({ success: true });
  } catch (err) { res.json({ success: false, message: err.message }); }
});
router.put('/sizesets/:id', async (req, res) => {
  try {
    await SizeSet.findByIdAndUpdate(req.params.id, req.body.update);
    const sizes = await SizeSet.find();
    req.app.get('pusher').trigger('alpha-one', 'sizesets_updated', { timestamp: Date.now() });
    res.json({ success: true });
  } catch (err) { res.json({ success: false, message: err.message }); }
});
router.delete('/sizesets/:id', async (req, res) => {
  try {
    await SizeSet.findByIdAndDelete(req.params.id);
    const sizes = await SizeSet.find();
    req.app.get('pusher').trigger('alpha-one', 'sizesets_updated', { timestamp: Date.now() });
    res.json({ success: true });
  } catch (err) { res.json({ success: false, message: err.message }); }
});

// --- CITIES ---
router.get('/cities', async (req, res) => {
  const cities = await City.find();
  res.json({ success: true, cities });
});
router.post('/cities', async (req, res) => {
  try {
    await City.create(req.body);
    const cities = await City.find();
    req.app.get('pusher').trigger('alpha-one', 'cities_updated', { timestamp: Date.now() });
    res.json({ success: true });
  } catch (err) { res.json({ success: false, message: err.message }); }
});
router.put('/cities/:id', async (req, res) => {
  try {
    await City.findByIdAndUpdate(req.params.id, req.body.update);
    const cities = await City.find();
    req.app.get('pusher').trigger('alpha-one', 'cities_updated', { timestamp: Date.now() });
    res.json({ success: true });
  } catch (err) { res.json({ success: false, message: err.message }); }
});
router.delete('/cities/:id', async (req, res) => {
  try {
    await City.findByIdAndDelete(req.params.id);
    const cities = await City.find();
    req.app.get('pusher').trigger('alpha-one', 'cities_updated', { timestamp: Date.now() });
    res.json({ success: true });
  } catch (err) { res.json({ success: false, message: err.message }); }
});

// --- PARTIES ---
router.get('/parties', async (req, res) => {
  const parties = await Party.find().populate('city');
  res.json({ success: true, parties });
});
router.post('/parties', async (req, res) => {
  try {
    await Party.create(req.body);
    const parties = await Party.find().populate('city');
    req.app.get('pusher').trigger('alpha-one', 'parties_updated', { timestamp: Date.now() });
    res.json({ success: true });
  } catch (err) { res.json({ success: false, message: err.message }); }
});
router.put('/parties/:id', async (req, res) => {
  try {
    await Party.findByIdAndUpdate(req.params.id, req.body.update);
    const parties = await Party.find().populate('city');
    req.app.get('pusher').trigger('alpha-one', 'parties_updated', { timestamp: Date.now() });
    res.json({ success: true });
  } catch (err) { res.json({ success: false, message: err.message }); }
});
router.delete('/parties/:id', async (req, res) => {
  try {
    await Party.findByIdAndDelete(req.params.id);
    const parties = await Party.find().populate('city');
    req.app.get('pusher').trigger('alpha-one', 'parties_updated', { timestamp: Date.now() });
    res.json({ success: true });
  } catch (err) { res.json({ success: false, message: err.message }); }
});

// --- STOCK ---
router.get('/stock', async (req, res) => {
  const stock = await Stock.find().populate('sizeSet');
  res.json({ success: true, stock });
});
router.post('/stock', async (req, res) => {
  try {
    const existing = await Stock.findOne({ designNo: req.body.designNo, isGR: req.body.isGR });
    if (existing) {
      existing.pieces += Number(req.body.pieces);
      await existing.save();
    } else {
      await Stock.create(req.body);
    }
    const stock = await Stock.find().populate('sizeSet');
    req.app.get('pusher').trigger('alpha-one', 'stock_updated', { timestamp: Date.now() });
    res.json({ success: true });
  } catch (err) { res.json({ success: false, message: err.message }); }
});
router.put('/stock/:id', async (req, res) => {
  try {
    await Stock.findByIdAndUpdate(req.params.id, req.body.update);
    const stock = await Stock.find().populate('sizeSet');
    req.app.get('pusher').trigger('alpha-one', 'stock_updated', { timestamp: Date.now() });
    res.json({ success: true });
  } catch (err) { res.json({ success: false, message: err.message }); }
});
router.delete('/stock/:id', async (req, res) => {
  try {
    await Stock.findByIdAndDelete(req.params.id);
    const stock = await Stock.find().populate('sizeSet');
    req.app.get('pusher').trigger('alpha-one', 'stock_updated', { timestamp: Date.now() });
    res.json({ success: true });
  } catch (err) { res.json({ success: false, message: err.message }); }
});

// --- BILLING ---
router.get('/bills', async (req, res) => {
  const bills = await Bill.find().populate({
    path: 'party',
    populate: { path: 'city' }
  }).populate('items.stock').sort({ createdAt: -1 });
  res.json({ success: true, bills });
});
router.post('/bills', async (req, res) => {
  try {
    for(let item of req.body.items) {
      const s = await Stock.findById(item.stock);
      if (s) {
        s.pieces -= item.pieces;
        await s.save();
      }
    }
    await Bill.create(req.body);
    
    const bills = await Bill.find().populate({
      path: 'party',
      populate: { path: 'city' }
    }).populate('items.stock').sort({ createdAt: -1 });
    const stock = await Stock.find().populate('sizeSet');
    
    req.app.get('pusher').trigger('alpha-one', 'bills_updated', { timestamp: Date.now() });
    req.app.get('pusher').trigger('alpha-one', 'stock_updated', { timestamp: Date.now() });
    
    res.json({ success: true });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
});
router.put('/bills/:id/status', async (req, res) => {
  try {
    await Bill.findByIdAndUpdate(req.params.id, { status: req.body.status });
    const bills = await Bill.find().populate({
      path: 'party',
      populate: { path: 'city' }
    }).populate('items.stock').sort({ createdAt: -1 });
    req.app.get('pusher').trigger('alpha-one', 'bills_updated', { timestamp: Date.now() });
    res.json({ success: true });
  } catch (err) { res.json({ success: false, message: err.message }); }
});
router.delete('/bills/:id', async (req, res) => {
  try {
    const bill = await Bill.findById(req.params.id);
    if (!bill) throw new Error('Bill not found');

    for (let item of bill.items) {
      const stock = await Stock.findById(item.stock);
      if (stock) {
        stock.pieces += item.pieces;
        await stock.save();
      }
    }
    await Bill.findByIdAndDelete(req.params.id);

    const bills = await Bill.find().populate({
      path: 'party',
      populate: { path: 'city' }
    }).populate('items.stock').sort({ createdAt: -1 });
    const stocks = await Stock.find().populate('sizeSet');
    
    req.app.get('pusher').trigger('alpha-one', 'bills_updated', { timestamp: Date.now() });
    req.app.get('pusher').trigger('alpha-one', 'stock_updated', { timestamp: Date.now() });
    res.json({ success: true });
  } catch (err) { res.json({ success: false, message: err.message }); }
});

// --- PAYMENTS ---
router.get('/payments', async (req, res) => {
  const payments = await Payment.find().populate({
    path: 'party',
    populate: { path: 'city' }
  }).sort({ createdAt: -1 });
  res.json({ success: true, payments });
});
router.post('/payments', async (req, res) => {
  try {
    await Payment.create(req.body);
    const payments = await Payment.find().populate({
      path: 'party',
      populate: { path: 'city' }
    }).sort({ createdAt: -1 });
    req.app.get('pusher').trigger('alpha-one', 'payments_updated', { timestamp: Date.now() });
    res.json({ success: true });
  } catch (err) { res.json({ success: false, message: err.message }); }
});
router.delete('/payments/:id', async (req, res) => {
  try {
    await Payment.findByIdAndDelete(req.params.id);
    const payments = await Payment.find().populate({
      path: 'party',
      populate: { path: 'city' }
    }).sort({ createdAt: -1 });
    req.app.get('pusher').trigger('alpha-one', 'payments_updated', { timestamp: Date.now() });
    res.json({ success: true });
  } catch (err) { res.json({ success: false, message: err.message }); }
});

// --- BALANCES REPORT ---
router.get('/balances', async (req, res) => {
  try {
    const parties = await Party.find({ type: 'Normal' }).populate('city');
    const bills = await Bill.find({ status: { $in: ['Saved', 'Printed'] }, isGR: false });
    const payments = await Payment.find();
    const returns = await GoodsReturn.find();

    const balances = {};
    for (let party of parties) { balances[party._id] = 0; }
    for (let bill of bills) { if (balances[bill.party] !== undefined) balances[bill.party] += bill.netTotal; }
    for (let pay of payments) { if (balances[pay.party] !== undefined) balances[pay.party] -= pay.amount; }
    for (let ret of returns) { if (balances[ret.party] !== undefined) balances[ret.party] -= ret.totalAmount; }

    const report = {};
    for (let party of parties) {
      const cityName = party.city ? party.city.name : 'Unknown City';
      const address = party.address ? party.address.trim() : 'General';
      if (!report[cityName]) report[cityName] = {};
      if (!report[cityName][address]) report[cityName][address] = [];
      report[cityName][address].push({
        name: party.name,
        balance: balances[party._id]
      });
    }
    res.json({ success: true, report });
  } catch (err) { res.json({ success: false, message: err.message }); }
});

// --- GOODS RETURN ---
router.post('/goods-return', async (req, res) => {
  try {
    let totalAmount = 0;
    const processedItems = [];
    
    for(let item of req.body.items) {
      const originalStock = await Stock.findById(item.stock);
      if (!originalStock) continue;
      
      const itemTotal = originalStock.perPiecePrice * item.pieces;
      totalAmount += itemTotal;
      processedItems.push({
        stock: originalStock._id,
        pieces: item.pieces,
        perPiecePrice: originalStock.perPiecePrice
      });
      
      let grStock = await Stock.findOne({ designNo: originalStock.designNo, isGR: true });
      if (grStock) {
        grStock.pieces += item.pieces;
        await grStock.save();
      } else {
        await Stock.create({
          designNo: originalStock.designNo,
          designName: originalStock.designName,
          sizeSet: originalStock.sizeSet,
          perPiecePrice: originalStock.perPiecePrice,
          pieces: item.pieces,
          isGR: true
        });
      }
    }
    
    await GoodsReturn.create({
      party: req.body.party,
      items: processedItems,
      totalAmount: totalAmount
    });
    
    const stock = await Stock.find().populate('sizeSet');
    req.app.get('pusher').trigger('alpha-one', 'stock_updated', { timestamp: Date.now() });
    res.json({ success: true, totalAmount });
  } catch (err) { res.json({ success: false, message: err.message }); }
});

// --- PARTY LEDGER ---
router.get('/party-ledger/:id', async (req, res) => {
  try {
    const partyId = req.params.id;
    const party = await Party.findById(partyId).populate('city');
    if (!party) throw new Error('Party not found');
    
    const bills = await Bill.find({ party: partyId, status: { $in: ['Saved', 'Printed'] }, isGR: false }).populate('items.stock');
    const payments = await Payment.find({ party: partyId });
    const returns = await GoodsReturn.find({ party: partyId }).populate('items.stock');
    
    let ledger = [];
    bills.forEach(b => {
      ledger.push({
        date: b.createdAt,
        type: 'Bill',
        ref: 'Bill #' + b.billNo,
        details: b.items.map(i => `${i.stock?.designName} (${i.pieces}pcs)`).join(', '),
        debit: b.netTotal,
        credit: 0
      });
    });
    payments.forEach(p => {
      ledger.push({
        date: p.createdAt,
        type: 'Payment',
        ref: 'Payment',
        details: p.method,
        debit: 0,
        credit: p.amount
      });
    });
    returns.forEach(r => {
      ledger.push({
        date: r.createdAt,
        type: 'Return',
        ref: 'Goods Return',
        details: r.items.map(i => `${i.stock?.designName} (${i.pieces}pcs)`).join(', '),
        debit: 0,
        credit: r.totalAmount
      });
    });
    
    ledger.sort((a, b) => new Date(a.date) - new Date(b.date));
    let runningBalance = 0;
    ledger = ledger.map(entry => {
      runningBalance += entry.debit;
      runningBalance -= entry.credit;
      entry.balance = runningBalance;
      return entry;
    });
    ledger.reverse();
    
    res.json({ success: true, party, ledger });
  } catch (err) { res.json({ success: false, message: err.message }); }
});

module.exports = router;
