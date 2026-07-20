import mongoose from 'mongoose';
import dotenv from 'dotenv';
import dns from 'dns';
import User from './models/User.js';
import LoyaltyRules from './models/LoyaltyRules.js';

dns.setDefaultResultOrder('ipv4first');
try {
  dns.setServers(['8.8.8.8', '8.8.4.4']);
} catch (e) {}

dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  const user = await User.findOne({ phone: '0976772828' });
  const rules = await LoyaltyRules.findOne({});
  console.log('--- USER DETAILS ---');
  console.log({
    id: user.id,
    phone: user.phone,
    name: user.fullName,
    tier: user.loyaltyTier,
    totalSpent: user.totalSpent,
    expiry: user.tierExpiryDate,
    warningSent: user.tierExpiryWarningSent
  });
  console.log('--- RULES TIER SETTINGS ---');
  console.log(JSON.stringify(rules.tierSettings, null, 2));
  await mongoose.disconnect();
}

run();
