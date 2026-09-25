import { Router } from "express";
import challengeScenariosRouter from "./scenarios.js";
import apiRoutes from "./api-routes.js";
import ejsRoutes from "./ejs-routes.js";
import { homePage, aboutPage, testErrorPage } from "./index.js";

const router = Router();

router.get("/", homePage);

router.get("/about", aboutPage);

// EJS pages
router.use("/", ejsRoutes);

// JSON API
router.use("/api", apiRoutes);

// Challenge scenarios
router.use("/scenarios", challengeScenariosRouter);

router.get("/500", testErrorPage);

export default router;
