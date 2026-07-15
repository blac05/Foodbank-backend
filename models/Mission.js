import mongoose from "mongoose";

const missionSchema = new mongoose.Schema(
  {
    donation: { type: mongoose.Schema.Types.ObjectId, ref: "Donation", required: true },
    volunteer: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    status: {
      type: String,
      enum: ["available", "accepted", "picked_up", "delivered", "cancelled"],
      default: "available",
    },
    dropoffType: { type: String, enum: ["locker", "delivery"], default: "locker" },
    dropoffLocation: { type: String },
    estimatedImpact: {
      mealsProvided: { type: Number, default: 0 },
      co2eSavedKg: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

export default mongoose.model("Mission", missionSchema);
