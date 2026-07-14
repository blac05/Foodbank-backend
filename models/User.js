import mongoose from "mongoose";

const impactStatsSchema = new mongoose.Schema(
  {
    mealsProvided: { type: Number, default: 0 },
    co2eSavedKg: { type: Number, default: 0 },
    waterSavedLiters: { type: Number, default: 0 },
    missionsCompleted: { type: Number, default: 0 },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    phone: { type: String, trim: true },
    role: {
      type: String,
      enum: ["donor", "volunteer", "recipient", "admin"],
      required: true,
    },
    // Donor-specific
    organizationName: { type: String, trim: true },
    donorType: { type: String, enum: ["individual", "restaurant", "grocery", "farm"], default: "individual" },
    // Recipient-specific
    householdSize: { type: Number, default: 1 },
    dietaryRestrictions: [{ type: String }],
    // Volunteer-specific
    vehicleType: { type: String, enum: ["car", "bike", "on_foot", "van"], default: "car" },
    impactStats: { type: impactStatsSchema, default: () => ({}) },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);