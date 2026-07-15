import mongoose from "mongoose";

const lockerSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true },
    hubAddress: { type: String, required: true },
    tempZone: { type: String, enum: ["ambient", "chilled", "frozen"], default: "ambient" },
    status: { type: String, enum: ["available", "occupied", "maintenance"], default: "available" },
    currentDonation: { type: mongoose.Schema.Types.ObjectId, ref: "Donation" },
    reservedForRecipient: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    accessCode: { type: String }, // time-boxed unlock code
    accessCodeExpiresAt: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.model("Locker", lockerSchema);
