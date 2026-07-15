import { Router } from "express";
import rateLimit from "express-rate-limit";
import {
  createDonation,
  listMyDonations,
  listAvailableDonations,
  listShopInventory,
  updateDonationStatus,
} from "../controllers/donationController.js";
import { smartScan } from "../controllers/smartScanController.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { createDonationSchema, updateDonationStatusSchema } from "../schemas/donationSchemas.js";
import { smartScanSchema } from "../schemas/smartScanSchemas.js";

const router = Router();

// Smart-Scan calls a paid AI API per request, so it gets its own tighter limit
// than ordinary CRUD traffic on this router.
const smartScanLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many scans — please wait a few minutes before trying again." },
});

router.post("/", requireAuth, requireRole("donor"), validate(createDonationSchema), createDonation);
router.get("/mine", requireAuth, requireRole("donor"), listMyDonations);
router.get("/available", requireAuth, requireRole("volunteer", "admin"), listAvailableDonations);
router.get("/shop", listShopInventory);
router.patch("/:id/status", requireAuth, validate(updateDonationStatusSchema), updateDonationStatus);
router.post(
  "/smart-scan",
  requireAuth,
  requireRole("donor"),
  smartScanLimiter,
  validate(smartScanSchema),
  smartScan
);

export default router;