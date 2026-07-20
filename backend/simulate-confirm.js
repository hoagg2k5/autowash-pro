import mongoose from 'mongoose';
import dotenv from 'dotenv';
import dns from 'dns';
import { confirmBooking } from './db-helper.js';

dns.setDefaultResultOrder('ipv4first');
try {
  dns.setServers(['8.8.8.8', '8.8.4.4']);
} catch (e) {
  console.warn("Không thể thiết lập máy chủ DNS tuỳ chỉnh:", e.message);
}

dotenv.config();

async function run() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB.");
    const id = "b-tfh4bcl3z";
    console.log(`Simulating confirm for booking: ${id}`);
    const booking = await confirmBooking(id);
    console.log("Success! Updated booking:", booking);
  } catch (err) {
    console.error("FAIL:", err);
  } finally {
    await mongoose.disconnect();
  }
}

run();
