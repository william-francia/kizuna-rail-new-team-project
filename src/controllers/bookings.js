import { getScheduleById, getTicketOptionsForRoute } from "../models/model.js";
import {
  createBooking as saveBooking,
  getAllBookings as findAllBookings,
  getBookingById as findBookingById,
} from "../models/bookings.js";

// EJS controllers

export async function bookingPage(req, res) {
  const { scheduleId } = req.params;

  const schedule = await getScheduleById(scheduleId);

  const ticketOptions = await getTicketOptionsForRoute(
    schedule.routeId,
    scheduleId
  );

  res.render("routes/book", {
    title: "Book Trip",
    schedule,
    ticketOptions,
  });
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
