import { Router } from "express";
import {
  changePassword,
  deactivateAccount,
  profilePage,
  updateProfile,
} from "../controllers/profile.js";
import { requirePageLogin } from "../middleware/auth.js";

const router = Router();

router.get("/profile", requirePageLogin, profilePage);
router.post("/profile", requirePageLogin, updateProfile);
router.post("/profile/password", requirePageLogin, changePassword);
router.post("/profile/deactivate", requirePageLogin, deactivateAccount);

export default router;
