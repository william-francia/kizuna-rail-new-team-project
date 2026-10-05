import { Router } from "express";
import {
  bookingPage,
  processBookingRequest,
  bookingConfirmationPage,
  bookingsAdminPage,
} from "../controllers/bookings.js";
import { renderTripListPage } from "../controllers/routes/index.js";
import { renderTripDetailsPage } from "../controllers/routes/details.js";
import { userAdminPage } from "../controllers/users.js";
import { requirePageLogin, requirePageRole } from "../middleware/auth.js";

const router = Router();

router.get("/routes", renderTripListPage);
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

router.get('/403', (req, res) => {
  res.status(403).render('errors/403', { 
    title: '403 - Access Denied',
    user: req.user || req.session?.user 
  });
});

export default router;