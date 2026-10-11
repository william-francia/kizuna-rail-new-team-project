import { Router } from "express";
import {
  bookingPage,
  processBookingRequest,
  bookingConfirmationPage,
  bookingsAdminPage,
} from "../controllers/bookings.js";
import {
  renderTripListPage,
  renderTripDetailsPage,
} from "../controllers/trips.js";
import { userAdminPage } from "../controllers/users.js";
import { requirePageLogin, requirePageRole } from "../middleware/auth.js";

const router = Router();

router.get("/routes", renderTripListPage);
router.get("/trips", renderTripListPage);
router.get("/routes/:routeId", renderTripDetailsPage);

router.get("/routes/booking/:scheduleId", bookingPage);
router.post("/routes/book", processBookingRequest);
router.get("/routes/bookings/:bookingId", bookingConfirmationPage);

// Bookings admin page (protected - requires login; the API filters by role)
router.get("/bookings-admin", requirePageLogin, bookingsAdminPage);

router.get("/login", (req, res) => {
  res.render("login", {
    title: "Login",
  });
});

// User dashboard page
router.get("/user/dashboard", requirePageLogin, (req, res) => {
  res.render("user/dashboard", {
    title: "User Dashboard",
  });
});

// User admin page
router.get("/users", requirePageRole("admin"), userAdminPage);

router.get("/trains", (req, res) => {
  res.render("trains", {
    title: "Trains",
  });
});

export default router;
