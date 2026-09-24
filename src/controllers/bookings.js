import { getScheduleById } from "../models/model.js";
import { getAllTicketClasses } from "../models/ticket-classes.js";

import {
  createBooking as saveBooking,
  getAllBookings as findAllBookings,
  getBookingById as findBookingById,
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

    return res.render("bookings/booking", {
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

// API controllers

export async function getAllBookings(req, res) {
  try {
    const bookings = await findAllBookings();

    return res.status(200).json(bookings);
  } catch (error) {
    console.error("Error fetching bookings:", error);

    return res.status(500).json({
      error: "Failed to fetch bookings",
    });
  }
}
