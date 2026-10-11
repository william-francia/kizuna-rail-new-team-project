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

// Case-insensitive matching for emails and ticket classes (strength 2 ignores case)
const TEXT_COLLATION = { locale: "en", strength: 2 };

/**
 * Returns one page of bookings plus the total number of matches.
 * Sorted by booking date (createdAt), newest first.
 *
 * @param {Object} options
 * @param {string} [options.email] Only bookings where a passenger has this email
 * @param {string} [options.ticketClass] Only bookings with this ticket class
 * @param {Date} [options.from] Only bookings made at or after this moment
 * @param {Date} [options.to] Only bookings made at or before this moment
 * @param {number} [options.page=1] 1-based page number
 * @param {number} [options.limit=10] Bookings per page
 */
export async function getBookingsPage({
  email,
  ticketClass,
  from,
  to,
  page = 1,
  limit = 10,
} = {}) {
  const query = {};

  if (email) {
    query["passengers.email"] = email.trim();
  }

  if (ticketClass) {
    query.ticketClass = ticketClass.trim();
  }

  if (from || to) {
    query.createdAt = {};
    if (from) query.createdAt.$gte = from;
    if (to) query.createdAt.$lte = to;
  }

  const [items, total] = await Promise.all([
    Booking.find(query)
      .collation(TEXT_COLLATION)
      .sort({ createdAt: -1, _id: -1 }) // _id breaks ties so pages never overlap
      .skip((page - 1) * limit)
      .limit(limit),
    Booking.countDocuments(query).collation(TEXT_COLLATION),
  ]);

  return { items, total };
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