import { Router } from "express";
import { listAvailableLockers, releaseLocker } from "../controllers/lockerController.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();

router.get("/available", requireAuth, listAvailableLockers);
router.post("/:id/release", requireAuth, requireRole("admin", "volunteer"), releaseLocker);

export default router;