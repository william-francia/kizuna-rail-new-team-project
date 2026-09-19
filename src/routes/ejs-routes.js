import { Router } from "express";
import {
  bookingPage,
  processBookingRequest,
  bookingConfirmationPage,
  bookingsAdminPage,
} from "../controllers/bookings.js";

const router = Router();

// Booking pages
router.get("/routes/booking/:scheduleId", bookingPage);
router.post("/routes/book", processBookingRequest);
router.get("/routes/confirmation/:confirmationId", bookingConfirmationPage);

// Bookings admin page
router.get("/bookings-admin", bookingsAdminPage);

export default router;
