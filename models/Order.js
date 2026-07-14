import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    quantity: { type: Number, default: 1 },
    sourceDonation: { type: mongoose.Schema.Types.ObjectId, ref: "Donation" },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    items: [orderItemSchema],
    fulfillmentType: { type: String, enum: ["locker", "delivery"], default: "locker" },
    locker: { type: mongoose.Schema.Types.ObjectId, ref: "Locker" },
    status: {
      type: String,
      enum: ["placed", "ready", "completed", "cancelled"],
      default: "placed",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Order", orderSchema);