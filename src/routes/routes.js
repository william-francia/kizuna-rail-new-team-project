import {
  bookingPage,
  processBookingRequest,
  bookingConfirmationPage,
} from "../controllers/bookings.js";
import listRoutesPage from "./list.js";
import routeDetailsPage from "./details.js";
import { Router } from "express";

const router = Router();

router.get("/", listRoutesPage);

router.get("/:routeId", routeDetailsPage);

router.get("/booking/:scheduleId", bookingPage);
router.post("/book", processBookingRequest);

router.get("/confirmation/:confirmationId", bookingConfirmationPage);

export default router;
