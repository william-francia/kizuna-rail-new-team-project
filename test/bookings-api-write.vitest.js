import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import request from "supertest";

import app from "../app.js";
import Booking from "../src/models/schemas/bookings.js";
import {
  clearTestDatabase,
  setupTestDatabase,
  teardownTestDatabase,
} from "./setup.js";
import {
  ADMIN_EMAIL,
  CUSTOMER_EMAIL,
  OTHER_CUSTOMER_EMAIL,
  createBooking,
  loginAs,
  makeBookingData,
  makePassenger,
  seedCatalog,
  seedUsers,
} from "./helpers/bookings-helpers.js";

let catalog;
let ownBooking; // the test customer is the passenger
let otherBooking; // the other customer is the passenger

beforeAll(async () => {
  await setupTestDatabase();
});

beforeEach(async () => {
  await clearTestDatabase();
  catalog = await seedCatalog();
  await seedUsers();

  ownBooking = await createBooking(catalog, {
    passengers: [makePassenger({ email: CUSTOMER_EMAIL })],
  });

  otherBooking = await createBooking(catalog, {
    passengers: [makePassenger({ email: OTHER_CUSTOMER_EMAIL })],
  });
});

afterAll(async () => {
  await teardownTestDatabase();
});

// The booking form posts to /routes/book. It is the real way to create a booking
// and the route does not require a login.
describe("POST /routes/book (create a booking)", () => {
  it("saves a booking built from the seeded trip, schedule and ticket class", async () => {
    await Booking.deleteMany({});
    const bookingData = makeBookingData(catalog, {
      passengers: [
        makePassenger({
          firstName: "Hana",
          lastName: "Tanaka",
          email: "hana.tanaka@example.com",
        }),
      ],
    });

    const response = await request(app).post("/routes/book").send(bookingData);

    expect(response.status).toBe(302);

    const saved = await Booking.findOne({
      "passengers.email": "hana.tanaka@example.com",
    });

    expect(await Booking.countDocuments()).toBe(1);
    expect(saved).not.toBeNull();
    expect(saved).toMatchObject({
      scheduleId: String(catalog.schedule.id),
      routeId: catalog.trip.id,
      ticketClass: catalog.ticketClasses[0].class,
      selectedDay: catalog.schedule.daysOfWeek[0],
    });
    expect(saved.passengers[0]).toMatchObject({
      firstName: "Hana",
      lastName: "Tanaka",
    });
    // The redirect points at the booking that was just created
    expect(response.headers.location).toContain(saved.id);
  });

  it("generates the booking code on the server and ignores extra fields", async () => {
    await Booking.deleteMany({});
    const bookingData = makeBookingData(catalog, {
      id: "CHOSENBYCLIENT",
      isAdminBooking: true,
    });

    const response = await request(app).post("/routes/book").send(bookingData);

    expect(response.status).toBe(302);

    const saved = await Booking.findOne();

    expect(saved.id).not.toBe("CHOSENBYCLIENT");
    expect(saved.toObject()).not.toHaveProperty("isAdminBooking");
  });

  it("returns 400 and saves nothing when there are no passengers", async () => {
    await Booking.deleteMany({});
    const bookingData = makeBookingData(catalog, { passengers: [] });

    const response = await request(app).post("/routes/book").send(bookingData);

    expect(response.status).toBe(400);
    expect(await Booking.countDocuments()).toBe(0);
  });

  it("returns 400 and saves nothing when a required field is missing", async () => {
    await Booking.deleteMany({});
    const bookingData = makeBookingData(catalog);
    delete bookingData.ticketClass;

    const response = await request(app).post("/routes/book").send(bookingData);

    expect(response.status).toBe(400);
    expect(await Booking.countDocuments()).toBe(0);
  });

  it("returns 400 and saves nothing for more than 8 passengers", async () => {
    await Booking.deleteMany({});
    const passengers = Array.from({ length: 9 }, (_, index) =>
      makePassenger({ firstName: `Passenger${index}` }),
    );

    const response = await request(app)
      .post("/routes/book")
      .send(makeBookingData(catalog, { passengers }));

    expect(response.status).toBe(400);
    expect(await Booking.countDocuments()).toBe(0);
  });
});

describe("PUT /api/bookings/:id (update a booking)", () => {
  it("lets a passenger update their own booking", async () => {
    const newTicketClass = catalog.ticketClasses[1].class;
    const newDay = catalog.schedule.daysOfWeek.at(-1);
    expect(newDay).not.toBe(ownBooking.selectedDay);
    const customerAgent = await loginAs(CUSTOMER_EMAIL);

    const response = await customerAgent
      .put(`/api/bookings/${ownBooking.id}`)
      .send({ ticketClass: newTicketClass, selectedDay: newDay });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      id: ownBooking.id,
      ticketClass: newTicketClass,
      selectedDay: newDay,
    });

    const saved = await Booking.findOne({ id: ownBooking.id });
    expect(saved.ticketClass).toBe(newTicketClass);
    expect(saved.selectedDay).toBe(newDay);
  });

  it("lets an administrator update any booking", async () => {
    const newTicketClass = catalog.ticketClasses[1].class;
    const adminAgent = await loginAs(ADMIN_EMAIL);

    const response = await adminAgent
      .put(`/api/bookings/${otherBooking.id}`)
      .send({ ticketClass: newTicketClass });

    expect(response.status).toBe(200);

    const saved = await Booking.findOne({ id: otherBooking.id });
    expect(saved.ticketClass).toBe(newTicketClass);
  });

  it("only changes the fields that can be edited", async () => {
    const newDay = catalog.schedule.daysOfWeek.at(-1);
    const customerAgent = await loginAs(CUSTOMER_EMAIL);

    const response = await customerAgent
      .put(`/api/bookings/${ownBooking.id}`)
      .send({ id: "NEWCODE", scheduleId: "999", selectedDay: newDay });

    expect(response.status).toBe(200);

    const saved = await Booking.findOne({ id: ownBooking.id });
    expect(saved.selectedDay).toBe(newDay);
    expect(saved.scheduleId).toBe(ownBooking.scheduleId);
    expect(await Booking.countDocuments({ id: "NEWCODE" })).toBe(0);
  });

  it("rejects a standard user who is not a passenger and leaves the booking unchanged", async () => {
    const customerAgent = await loginAs(CUSTOMER_EMAIL);

    const response = await customerAgent
      .put(`/api/bookings/${otherBooking.id}`)
      .send({ ticketClass: catalog.ticketClasses[1].class });

    expect(response.status).toBe(403);
    expect(response.body).toEqual({ error: "Forbidden" });

    const saved = await Booking.findOne({ id: otherBooking.id });
    expect(saved.ticketClass).toBe(otherBooking.ticketClass);
  });

  it("rejects an unauthenticated request and leaves the booking unchanged", async () => {
    const response = await request(app)
      .put(`/api/bookings/${ownBooking.id}`)
      .send({ ticketClass: catalog.ticketClasses[1].class });

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty("message");

    const saved = await Booking.findOne({ id: ownBooking.id });
    expect(saved.ticketClass).toBe(ownBooking.ticketClass);
  });

  it("returns 404 when the booking does not exist", async () => {
    const adminAgent = await loginAs(ADMIN_EMAIL);

    const response = await adminAgent
      .put("/api/bookings/DOESNOTEXIST")
      .send({ ticketClass: catalog.ticketClasses[1].class });

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: "Booking not found" });
  });

  it("returns 400 and keeps the booking unchanged when the update has no passengers", async () => {
    const customerAgent = await loginAs(CUSTOMER_EMAIL);

    const response = await customerAgent
      .put(`/api/bookings/${ownBooking.id}`)
      .send({ passengers: [] });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: "Invalid booking data." });

    const saved = await Booking.findOne({ id: ownBooking.id });
    expect(saved.passengers).toHaveLength(1);
  });
});

describe("DELETE /api/bookings/:id (delete a booking)", () => {
  it("lets a passenger delete their own booking", async () => {
    const customerAgent = await loginAs(CUSTOMER_EMAIL);

    const response = await customerAgent.delete(`/api/bookings/${ownBooking.id}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ message: "Booking deleted" });
    expect(await Booking.findOne({ id: ownBooking.id })).toBeNull();
    expect(await Booking.countDocuments()).toBe(1);
  });

  it("lets an administrator delete any booking", async () => {
    const adminAgent = await loginAs(ADMIN_EMAIL);

    const response = await adminAgent.delete(`/api/bookings/${otherBooking.id}`);

    expect(response.status).toBe(200);
    expect(await Booking.findOne({ id: otherBooking.id })).toBeNull();
  });

  it("rejects a standard user who is not a passenger and keeps the booking", async () => {
    const customerAgent = await loginAs(CUSTOMER_EMAIL);

    const response = await customerAgent.delete(
      `/api/bookings/${otherBooking.id}`,
    );

    expect(response.status).toBe(403);
    expect(response.body).toEqual({ error: "Forbidden" });
    expect(await Booking.findOne({ id: otherBooking.id })).not.toBeNull();
  });

  it("rejects an unauthenticated request and keeps the booking", async () => {
    const response = await request(app).delete(`/api/bookings/${ownBooking.id}`);

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty("message");
    expect(await Booking.findOne({ id: ownBooking.id })).not.toBeNull();
  });

  it("returns 404 when the booking does not exist and deletes nothing else", async () => {
    const adminAgent = await loginAs(ADMIN_EMAIL);

    const response = await adminAgent.delete("/api/bookings/DOESNOTEXIST");

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: "Booking not found" });
    expect(await Booking.countDocuments()).toBe(2);
  });

  it("returns 404 when the same booking is deleted twice", async () => {
    const adminAgent = await loginAs(ADMIN_EMAIL);

    const first = await adminAgent.delete(`/api/bookings/${ownBooking.id}`);
    const second = await adminAgent.delete(`/api/bookings/${ownBooking.id}`);

    expect(first.status).toBe(200);
    expect(second.status).toBe(404);
  });
});