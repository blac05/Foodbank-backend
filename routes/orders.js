import { Router } from "express";
import { placeOrder, listMyOrders } from "../controllers/orderController.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { placeOrderSchema } from "../schemas/orderSchemas.js";

const router = Router();

router.post("/", requireAuth, requireRole("recipient"), validate(placeOrderSchema), placeOrder);
router.get("/mine", requireAuth, requireRole("recipient"), listMyOrders);

export default router;