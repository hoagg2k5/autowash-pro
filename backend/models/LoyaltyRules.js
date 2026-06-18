import mongoose from 'mongoose';

const tierSettingSchema = new mongoose.Schema({
  spendThreshold: { type: Number, required: true },
  bookingWindowDays: { type: Number, required: true },
  pointMultiplier: { type: Number, required: true },
  perks: [{ type: String }]
}, { _id: false });

const loyaltyRulesSchema = new mongoose.Schema({
  tierSettings: {
    Member: { type: tierSettingSchema, required: true },
    Silver: { type: tierSettingSchema, required: true },
    Gold: { type: tierSettingSchema, required: true },
    Platinum: { type: tierSettingSchema, required: true }
  },
  pointConversionRate: { type: Number, default: 1 },
  pointsPerVndRate: { type: Number, default: 25000 },
  redemptionRate: { type: Number, default: 20 },
  vndPerPointRedeemed: { type: Number, default: 1250 }
});

const LoyaltyRules = mongoose.model('LoyaltyRules', loyaltyRulesSchema);
export default LoyaltyRules;
