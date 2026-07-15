import { Router } from "express";
import {
  listAvailableMissions,
  listMyMissions,
  acceptMission,
  updateMissionStatus,
} from "../controllers/missionController.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();

router.get("/available", requireAuth, requireRole("volunteer", "admin"), listAvailableMissions);
router.get("/mine", requireAuth, requireRole("volunteer"), listMyMissions);
router.post("/:id/accept", requireAuth, requireRole("volunteer"), acceptMission);
router.patch("/:id/status", requireAuth, requireRole("volunteer"), updateMissionStatus);

export default router;
