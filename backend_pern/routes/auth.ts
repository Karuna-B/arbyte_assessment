import { Router } from "express";
import { login, register, verifyOTP } from "../controllers/authController";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/verify-otp", verifyOTP);

export default router;
