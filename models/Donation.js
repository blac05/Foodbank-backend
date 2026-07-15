import mongoose from "mongoose";

const itemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    quantity: { type: Number, required: true, default: 1 },
    unit: { type: String, default: "unit" },
    category: { type: String, default: "general" },
    expiryEstimate: { type: Date },
  },
  { _id: false }
);

const donationSchema = new mongoose.Schema(
  {
    donor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    items: [itemSchema],
    pickupAddress: { type: String, required: true },
    pickupWindowStart: { type: Date },
    pickupWindowEnd: { type: Date },
    status: {
      type: String,
      enum: ["listed", "claimed", "in_transit", "delivered", "cancelled"],
      default: "listed",
    },
    urgencyScore: { type: Number, default: 0 }, // higher = spoils sooner, rescue first
    claimedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // volunteer
    notes: { type: String },
  },
  { timestamps: true }
);

donationSchema.index({ status: 1, urgencyScore: -1 });
donationSchema.index({ donor: 1, createdAt: -1 });

export default mongoose.model("Donation", donationSchema);