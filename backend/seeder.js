const mongoose = require('mongoose');
const User = require('./models/User');

const seedOwner = async () => {
  try {
    const ownerExists = await User.findOne({ id: 'alphaonemuzammil@owner.com' });
    if (!ownerExists) {
      await User.create({
        id: 'alphaonemuzammil@owner.com',
        password: 'alphaonemuzammilqasmi@980',
        role: 'Owner'
      });
      console.log('Owner account seeded successfully.');
    }
  } catch (error) {
    console.error('Error seeding owner account:', error);
  }
};

module.exports = seedOwner;
