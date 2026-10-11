import { getScheduleById } from "../models/model.js";

import {
  createBooking as saveBooking,
  getBookingsPage as findBookingsPage,
  getBookingById as findBookingById,
  updateBookingById,
  deleteBookingById,
  getBookingsByPassengerEmail as findBookingsByPassengerEmail,
} from "../models/bookings.js";

const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 50;

// Turns a query-string value into a positive integer, or the fallback if it isn't one.
function toPositiveInt(value, fallback, max = Infinity) {
  const number = Number.parseInt(value, 10);
  if (!Number.isInteger(number) || number < 1) return fallback;
  return Math.min(number, max);
}

// Parses a date query parameter.
// Accepts YYYY-MM-DD (the whole UTC day) or a full ISO date-time.
// Returns { date } (date is undefined when the parameter is absent) or { error: true }.
function parseDateParam(value, { endOfDay = false } = {}) {
  if (value === undefined || value === "") return { date: undefined };

  const text = String(value).trim();
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(text);

  const date = new Date(
    dateOnly
      ? `${text}${endOfDay ? "T23:59:59.999Z" : "T00:00:00.000Z"}`
      : text
  );

  return Number.isNaN(date.getTime()) ? { error: true } : { date };
}

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

    return res.render("bookings/bookings", {
      title: "Book Trip",
      schedule,
    });
  } catch (error) {
    console.error("Error loading booking page:", error);
    return next(error);
  }
}

export async function processBookingRequest(req, res, next) {
  try {
    const booking = await saveBooking(req.body);

    return res.redirect(`/routes/confirmation/${booking.id}`);
  } catch (error) {
    if (error.name === "ValidationError") {
      return res
        .status(400)
        .send("Invalid booking data. Please go back and check the form.");
    }

    console.error("Error creating booking:", error);

    return next(error);
  }
}

export async function bookingConfirmationPage(req, res, next) {
  try {
    const { confirmationId } = req.params;

    const confirmation = await findBookingById(confirmationId);

    if (!confirmation) {
      const err = new Error("Booking not found");
      err.status = 404;
      return next(err);
    }

    return res.render("routes/confirm", {
      title: "Trip Confirmation",
      confirmation,
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

// GET /api/bookings?page=1&limit=10&ticketClass=premium&from=2026-10-01&to=2026-10-31
// Admins page through every booking; standard users page through their own.
// Filters are optional and combine with AND.
export async function getAllBookings(req, res) {
  try {
    const user = req.user;

    const page = toPositiveInt(req.query.page, 1);
    const limit = toPositiveInt(
      req.query.limit,
      DEFAULT_PAGE_SIZE,
      MAX_PAGE_SIZE
    );

    const ticketClass =
      typeof req.query.ticketClass === "string"
        ? req.query.ticketClass.trim()
        : "";

    const from = parseDateParam(req.query.from);
    const to = parseDateParam(req.query.to, { endOfDay: true });

    if (from.error || to.error) {
      return res
        .status(400)
        .json({ error: "Invalid date. Use YYYY-MM-DD or an ISO date-time." });
    }

    if (from.date && to.date && from.date > to.date) {
      return res.status(400).json({ error: "'from' must not be after 'to'." });
    }

    const { items, total } = await findBookingsPage({
      email: user.role === "admin" ? undefined : user.email,
      ticketClass: ticketClass || undefined,
      from: from.date,
      to: to.date,
      page,
      limit,
    });

    return res.status(200).json({
      bookings: items,
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    });
  } catch (error) {
    console.error("Error fetching bookings:", error);

    return res.status(500).json({
      error: "Failed to fetch bookings",
    });
  }
}

export async function updateBooking(req, res) {
  try {
    const { id } = req.params;
    const user = req.user;
    const booking = await findBookingById(id);

    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    if (!isOwnerOrAdmin(user, booking)) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const updated = await updateBookingById(id, req.body);

    return res.status(200).json(updated);
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({ error: "Invalid booking data." });
    }

    console.error("Error updating booking:", error);

    return res.status(500).json({
      error: "Failed to update booking",
    });
  }
}

export async function deleteBooking(req, res) {
  try {
    const { id } = req.params;
    const user = req.user;
    const booking = await findBookingById(id);

    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    if (!isOwnerOrAdmin(user, booking)) {
      return res.status(403).json({ error: "Forbidden" });
    }

    await deleteBookingById(id);

    return res.status(200).json({ message: "Booking deleted" });
  } catch (error) {
    console.error("Error deleting booking:", error);

    return res.status(500).json({
      error: "Failed to delete booking",
    });
  }
}

export async function getMyBookings(req, res) {
  try {
    const bookings = await findBookingsByPassengerEmail(req.user.email);

    return res.status(200).json(bookings);
  } catch (error) {
    console.error("Error fetching bookings:", error);

    return res.status(500).json({
      error: "Failed to fetch bookings",
    });
  }
}
