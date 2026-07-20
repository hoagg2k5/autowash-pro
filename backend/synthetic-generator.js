// Synthetic Data Generator for AutoWash Pro
// Generates realistic customer behavioral logs for research analysis (2,000 to 5,000 records)

const VEHICLE_TYPES = [
  { type: "Sedan", brand: "Toyota", models: ["Camry", "Vios", "Corolla Altis"] },
  { type: "SUV", brand: "Mazda", models: ["CX-5", "CX-8", "CX-30"] },
  { type: "Sedan", brand: "Honda", models: ["Civic", "City", "Accord"] },
  { type: "SUV", brand: "Hyundai", models: ["SantaFe", "Tucson", "Creta"] },
  { type: "SUV", brand: "Ford", models: ["Everest", "Ranger", "Explorer"] },
  { type: "Hatchback", brand: "Kia", models: ["Morning", "Cerato", "Seltos"] },
  { type: "Luxury Sedan", brand: "Mercedes-Benz", models: ["C-Class", "E-Class", "S-Class"] },
  { type: "Luxury SUV", brand: "Lexus", models: ["RX350", "LX570", "NX300"] }
];

const PACKAGES = [
  { name: "Express", basePrice: 100000 },
  { name: "Deluxe", basePrice: 200000 },
  { name: "Premium Ultimate", basePrice: 400000 }
];

const TIME_SLOTS = [
  "08:00 - 09:00", "09:00 - 10:00", "10:00 - 11:00", "11:00 - 12:00",
  "13:00 - 14:00", "14:00 - 15:00", "15:00 - 16:00", "16:00 - 17:00", "17:00 - 18:00"
];

// Generate license plate
function generatePlate() {
  const regions = ["30A", "30F", "30G", "30H", "30K", "51F", "51G", "51H", "51K", "43A", "43C"];
  const region = regions[Math.floor(Math.random() * regions.length)];
  const num = Math.floor(10000 + Math.random() * 90000);
  return `${region}-${num}`;
}

// Generate phone number
function generatePhone() {
  const prefixes = ["090", "091", "098", "097", "096", "086", "088", "032", "035"];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const num = Math.floor(1000000 + Math.random() * 9000000);
  return `${prefix}${num}`;
}

export function generateSyntheticLogs(count = 2000) {
  const logs = [];
  const customers = [];
  
  // 1. Create a pool of 200 simulated customers with different behavioral characteristics
  const customerPoolSize = Math.max(50, Math.floor(count / 10));
  
  for (let i = 0; i < customerPoolSize; i++) {
    // Determine profile group
    // 60% Member (irregular/low tier), 25% Silver (semi-regular), 10% Gold (regular), 5% Platinum (very regular/VIP)
    const roll = Math.random();
    let profile = "Member";
    let visitFrequency = 45; // average days between visits
    let packagePreference = [0.7, 0.25, 0.05]; // Express, Deluxe, Premium
    
    if (roll > 0.95) {
      profile = "Platinum";
      visitFrequency = 7; // visits every week
      packagePreference = [0.1, 0.4, 0.5];
    } else if (roll > 0.85) {
      profile = "Gold";
      visitFrequency = 14; // visits every 2 weeks
      packagePreference = [0.2, 0.5, 0.3];
    } else if (roll > 0.60) {
      profile = "Silver";
      visitFrequency = 25; // visits every 3-4 weeks
      packagePreference = [0.4, 0.4, 0.2];
    }
    
    const vType = VEHICLE_TYPES[Math.floor(Math.random() * VEHICLE_TYPES.length)];
    const model = vType.models[Math.floor(Math.random() * vType.models.length)];

    customers.push({
      id: `sim-cust-${i}`,
      fullName: `Khách Hàng Mô Phỏng ${i + 1}`,
      phone: generatePhone(),
      licensePlate: generatePlate(),
      carBrand: vType.brand,
      carModel: model,
      carType: vType.type,
      profile,
      visitFrequency,
      packagePreference,
      totalSpent: 0,
      pointsBalance: 0,
      washCount: 0
    });
  }

  // 2. Generate bookings/wash transactions chronologically going backward from today
  const today = new Date();
  const logsTemp = [];

  customers.forEach(cust => {
    // Generate dates based on frequency
    let currentDate = new Date(today);
    // start date up to 1 year ago
    currentDate.setDate(currentDate.getDate() - Math.floor(Math.random() * 365));
    
    while (currentDate <= today) {
      // Package choice based on preference
      const packRoll = Math.random();
      let packIndex = 0;
      if (packRoll > cust.packagePreference[0] + cust.packagePreference[1]) {
        packIndex = 2; // Premium
      } else if (packRoll > cust.packagePreference[0]) {
        packIndex = 1; // Deluxe
      }
      
      const washPackage = PACKAGES[packIndex];
      const price = washPackage.basePrice;
      cust.washCount += 1;

      // Determine loyalty tier at this current wash moment
      let tierAtWash = "Member";
      if (cust.totalSpent >= 1000000) { // VIP Platinum threshold in mock
        tierAtWash = "Platinum";
      } else if (cust.totalSpent >= 500000) {
        tierAtWash = "Gold";
      } else if (cust.totalSpent >= 200000) {
        tierAtWash = "Silver";
      }

      // Tier benefits & rules
      let discount = 0;
      if (tierAtWash === "Silver" && washPackage.name === "Deluxe") {
        discount = price * 0.10;
      } else if (tierAtWash === "Gold" && (washPackage.name === "Deluxe" || washPackage.name === "Premium Ultimate")) {
        discount = price * 0.15;
      } else if (tierAtWash === "Platinum") {
        discount = price * 0.20;
      }

      // Check for points reward usage (Redemption)
      let pointsRedeemed = 0;
      let usedReward = "No";
      let rewardDiscount = 0;

      // High tier customers redeem more points
      const redeemThreshold = tierAtWash === "Platinum" ? 100 : tierAtWash === "Gold" ? 150 : 200;
      if (cust.pointsBalance >= redeemThreshold && Math.random() > 0.4) {
        pointsRedeemed = Math.min(cust.pointsBalance, 200); // redeem up to 200 points
        rewardDiscount = pointsRedeemed * 1250; // 1 point = 1,250 VND
        usedReward = "Yes";
        cust.pointsBalance -= pointsRedeemed;
      }

      const totalPaid = Math.max(0, price - discount - rewardDiscount);
      cust.totalSpent += totalPaid;

      // Points earned
      const pointsMultiplier = tierAtWash === "Platinum" ? 2.0 : tierAtWash === "Gold" ? 1.5 : tierAtWash === "Silver" ? 1.2 : 1.0;
      const basePoints = Math.floor(totalPaid / 25000);
      const pointsEarned = Math.floor(basePoints * pointsMultiplier);
      cust.pointsBalance += pointsEarned;

      // Log details
      const simulatedBranches = [
        "AutoWash Pro - Quận 1",
        "AutoWash Pro - Quận 7",
        "AutoWash Pro - Bình Thạnh",
        "AutoWash Pro - Cầu Giấy",
        "AutoWash Pro - Tây Hồ"
      ];
      const randomBranch = simulatedBranches[Math.floor(Math.random() * simulatedBranches.length)];

      logsTemp.push({
        transactionId: `TXN-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        dateTime: new Date(currentDate.getTime() + Math.random() * 8 * 60 * 60 * 1000).toISOString(), // Random hour during day
        phone: cust.phone,
        licensePlate: cust.licensePlate,
        carBrand: cust.carBrand,
        carModel: cust.carModel,
        carType: cust.carType,
        servicePackage: washPackage.name,
        branch: randomBranch,
        originalPrice: price,
        discountApplied: discount + rewardDiscount,
        amountPaid: totalPaid,
        usedReward: usedReward,
        pointsRedeemed: pointsRedeemed,
        pointsEarned: pointsEarned,
        accumulatedPoints: cust.pointsBalance,
        washCount: cust.washCount,
        loyaltyTier: tierAtWash
      });

      // Advance to next visit date with variance
      const nextVisitDays = cust.visitFrequency + Math.floor((Math.random() - 0.5) * (cust.visitFrequency * 0.5));
      currentDate.setDate(currentDate.getDate() + Math.max(1, nextVisitDays));
    }
  });

  // Sort logs by date descending and slice to count
  logsTemp.sort((a, b) => new Date(b.dateTime) - new Date(a.dateTime));
  
  return logsTemp.slice(0, count);
}

// Convert JSON array of logs to CSV format string
export function convertToCSV(logs) {
  if (logs.length === 0) return "";
  const headers = Object.keys(logs[0]);
  const csvRows = [];
  
  // Header row
  csvRows.push(headers.join(","));
  
  // Data rows
  for (const row of logs) {
    const values = headers.map(header => {
      const val = row[header];
      // escape double quotes and commas
      let valStr = val === null || val === undefined ? "" : String(val);
      if (valStr.includes(",") || valStr.includes('"') || valStr.includes("\n")) {
        valStr = `"${valStr.replace(/"/g, '""')}"`;
      }
      return valStr;
    });
    csvRows.push(values.join(","));
  }
  
  return csvRows.join("\n");
}
