import { Router } from "express";
import challengeScenariosRouter from "./scenarios.js";
import apiRoutes from "./api-routes.js";
import ejsRoutes from "./ejs-routes.js";
import authRoutes from "./auth-routes.js";
import adminTripsRouter from "./admin/trips.js";
import { homePage, aboutPage, testErrorPage } from "./index.js";

const router = Router();

// Home page
router.get("/", homePage);

// About page
router.get("/about", aboutPage);

// Authentication pages
router.use("/", authRoutes);
router.use("/admin", adminTripsRouter);
router.use("/api", apiRoutes);
router.use("/scenarios", challengeScenariosRouter);

// EJS pages
router.use("/", ejsRoutes);

// JSON API
router.use("/api", apiRoutes);

// Challenge scenarios
router.use("/scenarios", challengeScenariosRouter);

router.get("/trains", (req, res) => {
  res.render("trains", {
    title: "Trains",
  });
});

// Test 500 error page
router.get("/500", testErrorPage);

export default router;
