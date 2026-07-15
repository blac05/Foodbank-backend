import { Router } from "express";
import { getGlobalImpact } from "../controllers/impactController.js";

const router = Router();

router.get("/global", getGlobalImpact);

export default router;
