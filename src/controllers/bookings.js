import { getScheduleById } from "../models/model.js";
import { getAllTicketClasses } from "../models/ticket-classes.js";

import {
  createBooking as saveBooking,
  getAllBookings as findAllBookings,
  getBookingById as findBookingById,
  updateBookingById,
  deleteBookingById,
  getBookingsByPassengerEmail as findBookingsByPassengerEmail,
} from "../models/bookings.js";

// EJS controllers

export async function bookingPage(req, res, next) {
  try {
    const { scheduleId } = req.params;
    const schedule = await getScheduleById(scheduleId);

    if (!schedule) {
      const err = new Error("Schedule not found");
      err.status = 404;
      return next(err);
    }

    const ticketClasses = await getAllTicketClasses();
    const ticketOptions = ticketClasses.map((ticketClass) => ({
      class: ticketClass.class,
      name: ticketClass.name,
      price: ticketClass.pricePerKm,
      amenities: ticketClass.amenities,
      description: ticketClass.description,
    }));

    return res.render("bookings/bookings", {
      title: "Book Trip",
      schedule,
      ticketOptions,
    });
  } catch (error) {
    console.error("Error loading booking page:", error);
    return next(error);
  }
}

export async function processBookingRequest(req, res, next) {
  try {
    const booking = await saveBooking(req.body);

    return res.redirect(`/routes/bookings/${booking.id}`);
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).send("Invalid booking data. Please go back and check the form.");
    }
    console.error("Error creating booking:", error);
    return next(error);
  }
}

export async function bookingConfirmationPage(req, res, next) {
  try {
    const { bookingId } = req.params;

    const confirmation = await findBookingById(bookingId);

    if (!confirmation) {
      const err = new Error("Booking not found");
      err.status = 404;
      return next(err);
    }

    return res.render("routes/confirm", {
      title: "Trip Confirmation",
      booking: confirmation,
    });
  } catch (error) {
    console.error("Error fetching booking:", error);
    return next(error);
  }
}

export function bookingsAdminPage(req, res) {
  res.render("bookings", { title: "Bookings Admin" });
}

// Helper: can this user view/modify this booking?
function isOwnerOrAdmin(user, booking) {
  if (user.role === "admin") return true;
  const userEmail = user.email?.toLowerCase();
  return (booking.passengers || []).some(
    (passenger) => passenger.email?.toLowerCase() === userEmail
  );
}

// API controllers

export async function getAllBookings(req, res) {
  try {
    const user = req.user;
    const bookings = await findAllBookings();
    const visibleBookings = bookings.filter((booking) => isOwnerOrAdmin(user, booking));

    return res.status(200).json(visibleBookings);
  } catch (error) {
    console.error("Error fetching bookings:", error);
    return res.status(500).json({ error: "Failed to fetch bookings" });
  }
}

export async function updateBooking(req, res) {
  try {
    const { id } = req.params;
    const user = req.user;
    const booking = await findBookingById(id);

    if (!booking) return res.status(404).json({ error: "Booking not found" });
    if (!isOwnerOrAdmin(user, booking)) return res.status(403).json({ error: "Forbidden" });

    const updated = await updateBookingById(id, req.body);
    return res.status(200).json(updated);
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({ error: "Invalid booking data." });
    }
    console.error("Error updating booking:", error);
    return res.status(500).json({ error: "Failed to update booking" });
  }
}

export async function deleteBooking(req, res) {
  try {
    const { id } = req.params;
    const user = req.user;
    const booking = await findBookingById(id);

    if (!booking) return res.status(404).json({ error: "Booking not found" });
    if (!isOwnerOrAdmin(user, booking)) return res.status(403).json({ error: "Forbidden" });

    await deleteBookingById(id);
    return res.status(200).json({ message: "Booking deleted" });
  } catch (error) {
    console.error("Error deleting booking:", error);
    return res.status(500).json({ error: "Failed to delete booking" });
  }
}

export async function getMyBookings(req, res) {
  try {
    const bookings = await findBookingsByPassengerEmail(req.user.email);

    return res.status(200).json(bookings);
  } catch (error) {
    console.error("Error fetching user bookings:", error);

    return res.status(500).json({
      error: "Failed to fetch user bookings",
    });
  }
}