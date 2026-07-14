import { Router } from "express";
import { placeOrder, listMyOrders } from "../controllers/orderController.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();

router.post("/", requireAuth, requireRole("recipient"), placeOrder);
router.get("/mine", requireAuth, requireRole("recipient"), listMyOrders);

export default router;