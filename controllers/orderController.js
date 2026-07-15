import Order from "../models/Order.js";
import { reserveLockerForRecipient } from "./lockerController.js";
import { logger } from "../utils/logger.js";

export async function placeOrder(req, res) {
  try {
    const { items, fulfillmentType } = req.body;

    let locker = null;
    if (fulfillmentType === "locker") {
      locker = await reserveLockerForRecipient(req.user.id);
    }

    const order = await Order.create({
      recipient: req.user.id,
      items,
      fulfillmentType,
      locker: locker?._id,
    });

    res.status(201).json({
      order,
      locker: locker
        ? {
            code: locker.code,
            hubAddress: locker.hubAddress,
            accessCode: locker.accessCode,
            accessCodeExpiresAt: locker.accessCodeExpiresAt,
          }
        : null,
      lockerPending: fulfillmentType === "locker" && !locker,
    });
  } catch (err) {
    logger.error({ err }, "placeOrder failed");
    res.status(500).json({ message: "Failed to place order" });
  }
}

export async function listMyOrders(req, res) {
  const orders = await Order.find({ recipient: req.user.id })
    .populate("locker", "code hubAddress accessCode accessCodeExpiresAt")
    .sort({ createdAt: -1 });
  res.json({ orders });
}