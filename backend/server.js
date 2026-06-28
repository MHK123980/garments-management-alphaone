const express = require('express');
const http = require('http');
const path = require('path');
const cors = require('cors');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const connectDB = require('./config/db');
const seedOwner = require('./seeder');
const apiRoutes = require('./routes/api');

const app = express();
const server = http.createServer(app);

const Pusher = require('pusher');
const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID || '2171388',
  key: process.env.PUSHER_KEY || '4dd0c976a6cd91940ec6',
  secret: process.env.PUSHER_SECRET || 'ca434ddf4aabb7abab01',
  cluster: process.env.PUSHER_CLUSTER || 'ap2',
  useTLS: true
});

app.set('pusher', pusher);

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to MongoDB & Seed Owner
connectDB().then(() => {
  seedOwner();
});

// Setup EJS
app.set('view engine', 'ejs');
const frontendPath = path.join(__dirname, '../frontend');
app.set('views', path.join(frontendPath, 'views'));

// Serve static files
app.use(express.static(path.join(frontendPath, 'public')));

// Mount API Routes
app.use('/api', apiRoutes);

// Single Route for SPA
app.get('/', (req, res) => {
  res.render('index');
});

// For Vercel deployment
if (process.env.NODE_ENV === 'production' || process.env.VERCEL) {
  module.exports = app;
} else {
  const PORT = process.env.PORT || 3000;
  server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}
