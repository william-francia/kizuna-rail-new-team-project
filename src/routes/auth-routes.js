import { Router } from "express";
import { login, logout, register } from "../controllers/auth.js";
import { requirePageRole } from "../middleware/auth.js";

const router = Router();

router.get("/register", (req, res) => {
  res.render("auth/register", { title: "Register", error: null, values: {} });
});

router.get("/login", (req, res) => {
  res.render("auth/login", { title: "Login", error: null, values: {} });
});

router.get("/403", (req, res) => {
  res.status(403).render("errors/403", { title: "Forbidden" });
});

router.get("/admin", requirePageRole("admin"), (req, res) => {
  res.render("admin/dashboard", { title: "Admin Dashboard" });
});

router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);

export default router;
