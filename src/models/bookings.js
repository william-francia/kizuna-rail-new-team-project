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
