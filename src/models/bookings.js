import Booking from "./schemas/bookings.js";

export async function createBooking(bookingData) {
  const passengers = Array.isArray(bookingData.passengers)
    ? bookingData.passengers
    : [];

  // Only the expected fields are copied, so extra form fields never reach the database.
  return Booking.create({
    scheduleId: bookingData.scheduleId,
    routeId: bookingData.routeId,
    ticketClass: bookingData.ticketClass,
    selectedDay: bookingData.selectedDay,
    passengers: passengers.map((passenger) => ({
      firstName: passenger.firstName,
      lastName: passenger.lastName,
      email: passenger.email,
      phone: passenger.phone,
    })),
  });
}

export async function getAllBookings() {
  return Booking.find().sort({ createdAt: -1 });
}

export async function getBookingById(bookingId) {
  return Booking.findOne({ id: bookingId });
}

export async function updateBookingById(bookingId, updates) {
  const allowedUpdates = {};

  if (updates.ticketClass !== undefined) allowedUpdates.ticketClass = updates.ticketClass;
  if (updates.selectedDay !== undefined) allowedUpdates.selectedDay = updates.selectedDay;
  if (Array.isArray(updates.passengers)) {
    allowedUpdates.passengers = updates.passengers.map((passenger) => ({
      firstName: passenger.firstName,
      lastName: passenger.lastName,
      email: passenger.email,
      phone: passenger.phone,
    }));
  }

  return Booking.findOneAndUpdate(
    { id: bookingId },
    { $set: allowedUpdates },
    { new: true, runValidators: true }
  );
}

export async function deleteBookingById(bookingId) {
  return Booking.findOneAndDelete({ id: bookingId });
}

export async function getBookingsByPassengerEmail(email) {
  return Booking.find({
    "passengers.email": email.trim().toLowerCase(),
  }).sort({ createdAt: -1 });
}