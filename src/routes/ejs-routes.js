import { Router } from "express";
import { bookingPage, processBookingRequest } from "./book.js";
import confirmationPage from "./confirm.js";
import {
  renderTripListPage,
  renderTripDetailsPage,
} from "../controllers/trips.js";

const router = Router();

// Trips EJS pages
router.get("/", renderTripListPage);
router.get("/booking/:scheduleId", bookingPage);
router.post("/book", processBookingRequest);
router.get("/confirmation/:confirmationId", confirmationPage);
router.get("/:routeId", renderTripDetailsPage);

export default router;