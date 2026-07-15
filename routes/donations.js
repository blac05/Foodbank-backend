import { Router } from "express";
import {
  createDonation,
  listMyDonations,
  listAvailableDonations,
  listShopInventory,
  updateDonationStatus,
} from "../controllers/donationController.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();

router.post("/", requireAuth, requireRole("donor"), createDonation);
router.get("/mine", requireAuth, requireRole("donor"), listMyDonations);
router.get("/available", requireAuth, requireRole("volunteer", "admin"), listAvailableDonations);
router.get("/shop", listShopInventory); // public browsing, checkout requires auth
router.patch("/:id/status", requireAuth, updateDonationStatus);

export default router;
