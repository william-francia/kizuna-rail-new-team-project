import challengeScenariosRouter from "./scenarios.js";
import railRoutesRouter from "./routes.js";
import apiRouter from "./api-routes.js";
import { Router } from "express";
import { homePage, aboutPage, testErrorPage } from "./index.js";

const router = Router();

router.get("/", homePage);

router.get("/about", aboutPage);

router.use("/routes", railRoutesRouter);

router.use("/scenarios", challengeScenariosRouter);

router.use("/api", apiRouter);

router.get("/500", testErrorPage);

export default router;
