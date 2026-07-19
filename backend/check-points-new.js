import mongoose from 'mongoose';
import dotenv from 'dotenv';
import dns from 'dns';
import User from './models/User.js';

dns.setDefaultResultOrder('ipv4first');
try {
  dns.setServers(['8.8.8.8', '8.8.4.4']);
} catch (e) {
  console.warn("DNS override failed:", e.message);
}

dotenv.config();

async function run() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const u = await User.findOne({ phone: '0976772828' });
    console.log(`User in MongoDB: pointsBalance=${u.pointsBalance}`);
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}
run();
