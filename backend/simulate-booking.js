import mongoose from 'mongoose';
import dotenv from 'dotenv';
import dns from 'dns';
import { createBooking } from './db-helper.js';

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
    
    // Simulate booking with empty bay
    const newBooking = await createBooking("u-udw5vpixk", {
      vehicleId: "v-lb926eh0t",
      bookingDate: "2026-06-25",
      timeSlot: "14:00 - 15:00",
      servicePackage: "Express",
      branch: "AutoWash Pro - Quận 1",
      bay: "",
      redeemPoints: 0,
      promoCode: "",
      paymentMethod: "Cash"
    });
    
    console.log("Created booking details:");
    console.log(`ID: ${newBooking.id} | Status: ${newBooking.status}`);

    console.log("\nAttempting to cancel the booking...");
    const { cancelBooking } = await import('./db-helper.js');
    const cancelledBooking = await cancelBooking(newBooking.id, 'Khách hủy để test re-create', false);
    console.log(`Cancelled booking status: ${cancelledBooking.status}`);

    console.log("\nAttempting to create a NEW booking for the same vehicle and slot after cancellation...");
    try {
      const reCreatedBooking = await createBooking("u-udw5vpixk", {
        vehicleId: "v-lb926eh0t",
        bookingDate: "2026-06-25",
        timeSlot: "14:00 - 15:00",
        servicePackage: "Deluxe",
        branch: "AutoWash Pro - Quận 1",
        bay: "",
        redeemPoints: 0,
        promoCode: "",
        paymentMethod: "Cash"
      });
      console.log(`✅ SUCCESS: Re-created booking after cancellation! ID: ${reCreatedBooking.id}`);
      
      // Clean up re-created booking
      await reCreatedBooking.deleteOne();
      console.log("Cleaned up re-created booking.");
    } catch (reCreateErr) {
      console.log("❌ FAIL: Could not re-create booking after cancellation. Error:", reCreateErr.message);
    }
    
    // Clean up original booking
    await newBooking.deleteOne();
    console.log("Cleaned up original booking.");
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}

run();
