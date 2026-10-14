import bcrypt from "bcrypt";
import request from "supertest";
import { expect } from "vitest";

import app from "../../app.js";
import Booking from "../../src/models/schemas/bookings.js";
import Role from "../../src/models/schemas/roles.js";
import Route from "../../src/models/schemas/route.js";
import Schedule from "../../src/models/schemas/schedules.js";
import TicketClass from "../../src/models/schemas/ticket-classes.js";
import Trip from "../../src/models/schemas/trips.js";
import User from "../../src/models/schemas/users.js";

// The same seed files that seed.js uses. seed.js itself connects to the real
// database and ends the process, so the tests insert these records directly.
import routeSeeds from "../../src/models/seeds/routes.json";
import scheduleSeeds from "../../src/models/seeds/schedules.json";
import ticketClassSeeds from "../../src/models/seeds/ticket-classes.json";

export const TEST_PASSWORD = "TestPassword123!";
export const ADMIN_EMAIL = "testadmin@example.com";
export const CUSTOMER_EMAIL = "testcustomer@example.com";
export const OTHER_CUSTOMER_EMAIL = "othercustomer@example.com";

/**
 * Inserts the seeded trips, schedules and ticket classes into the temporary
 * database and returns one valid trip, schedule and the list of ticket classes.
 * Call it after clearTestDatabase().
 */
export async function seedCatalog() {
  await Route.insertMany(routeSeeds);
  await Schedule.insertMany(scheduleSeeds);
  await TicketClass.insertMany(ticketClassSeeds);

  const schedule = await Schedule.findOne().sort({ id: 1 });
  const trip = schedule ? await Trip.findOne({ id: schedule.routeId }) : null;
  const ticketClasses = await TicketClass.find().sort({ class: 1 });

  if (!schedule || !trip || ticketClasses.length < 2) {
    throw new Error(
      "The seed data must include a schedule, the trip it belongs to, and at least two ticket classes.",
    );
  }

  return { trip, schedule, ticketClasses };
}

/**
 * Creates the admin and customer roles and three users with a known password.
 * Call it after clearTestDatabase().
 */
export async function seedUsers() {
  const [adminRole, customerRole] = await Promise.all([
    Role.create({ name: "admin" }),
    Role.create({ name: "customer" }),
  ]);

  // Few hashing rounds keep the tests fast. Login still works the same way.
  const passwordHash = await bcrypt.hash(TEST_PASSWORD, 4);

  await User.create([
    {
      displayName: "Test Administrator",
      username: "testadmin",
      email: ADMIN_EMAIL,
      passwordHash,
      role: adminRole._id,
    },
    {
      displayName: "Test Customer",
      username: "testcustomer",
      email: CUSTOMER_EMAIL,
      passwordHash,
      role: customerRole._id,
    },
    {
      displayName: "Other Customer",
      username: "othercustomer",
      email: OTHER_CUSTOMER_EMAIL,
      passwordHash,
      role: customerRole._id,
    },
  ]);
}

/**
 * Signs in through the real /login route and returns a Supertest agent that
 * keeps the session cookie for later requests.
 */
export async function loginAs(email) {
  const agent = request.agent(app);

  const response = await agent.post("/login").send({
    email,
    password: TEST_PASSWORD,
  });

  expect(response.status).toBe(302);

  return agent;
}

export function makePassenger(overrides = {}) {
  return {
    firstName: "Test",
    lastName: "Passenger",
    email: "passenger@example.com",
    phone: "+81 90-1234-5678",
    ...overrides,
  };
}

/**
 * Valid booking data built from the seeded catalog. A test passes only the
 * fields it cares about, such as the passengers, the ticket class or createdAt.
 */
export function makeBookingData(catalog, overrides = {}) {
  return {
    scheduleId: String(catalog.schedule.id),
    routeId: catalog.trip.id,
    ticketClass: catalog.ticketClasses[0].class,
    selectedDay: catalog.schedule.daysOfWeek[0],
    passengers: [makePassenger()],
    ...overrides,
  };
}

/** Saves a booking straight to the temporary database. */
export async function createBooking(catalog, overrides = {}) {
  return Booking.create(makeBookingData(catalog, overrides));
}

/**
 * Saves a booking with a fixed booking date (createdAt). The date filters
 * work on createdAt, so tests need to choose it. Pass "2026-10-15" or a Date.
 * Dates given as YYYY-MM-DD are treated as noon UTC so they stay on that day.
 */
export async function createBookingOn(catalog, date, overrides = {}) {
  const createdAt =
    date instanceof Date
      ? date
      : new Date(/^\d{4}-\d{2}-\d{2}$/.test(date) ? `${date}T12:00:00.000Z` : date);

  return createBooking(catalog, { ...overrides, createdAt });
}

/**
 * Saves several bookings, one per day starting 2026-10-01 (oldest first), so
 * pagination tests get a known order. The API lists newest first, so the last
 * booking created is the first one returned. Returns them in creation order.
 */
export async function createManyBookings(catalog, count, overrides = {}) {
  const bookings = [];

  for (let index = 0; index < count; index += 1) {
    const day = String(index + 1).padStart(2, "0");
    bookings.push(await createBookingOn(catalog, `2026-10-${day}`, overrides));
  }

  return bookings;
}