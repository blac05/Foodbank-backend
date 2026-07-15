import { Router } from "express";
import { signup, login, refresh, logout, me } from "../controllers/authController.js";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { signupSchema, loginSchema, refreshSchema } from "../schemas/authSchemas.js";

const router = Router();

router.post("/signup", validate(signupSchema), signup);
router.post("/login", validate(loginSchema), login);
router.post("/refresh", validate(refreshSchema), refresh);
router.post("/logout", requireAuth, logout);
router.get("/me", requireAuth, me);

export default router;