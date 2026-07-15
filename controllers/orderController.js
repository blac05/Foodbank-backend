import Order from "../models/Order.js";

export async function placeOrder(req, res) {
  try {
    const { items, fulfillmentType, locker } = req.body;
    if (!items?.length) {
      return res.status(400).json({ message: "Order must include at least one item" });
    }

    const order = await Order.create({
      recipient: req.user.id,
      items,
      fulfillmentType,
      locker,
    });

    res.status(201).json({ order });
  } catch (err) {
    console.error("[placeOrder]", err.message);
    res.status(500).json({ message: "Failed to place order" });
  }
}

export async function listMyOrders(req, res) {
  const orders = await Order.find({ recipient: req.user.id }).sort({ createdAt: -1 });
  res.json({ orders });
}
