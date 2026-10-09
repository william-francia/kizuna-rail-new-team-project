import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import request from "supertest";

import app from "../app.js";
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
  makePassenger,
  seedCatalog,
  seedUsers,
} from "./helpers/bookings-helpers.js";

let catalog;
let customerBooking; // only the test customer is a passenger
let groupBooking; // the other customer and the test customer are passengers
let otherBooking; // only the other customer is a passenger

function sortedIds(bookings) {
  return bookings.map((booking) => booking.id).sort();
}

beforeAll(async () => {
  await setupTestDatabase();
});

beforeEach(async () => {
  await clearTestDatabase();
  catalog = await seedCatalog();
  await seedUsers();

  customerBooking = await createBooking(catalog, {
    passengers: [makePassenger({ email: CUSTOMER_EMAIL })],
  });

  groupBooking = await createBooking(catalog, {
    passengers: [
      makePassenger({ firstName: "Other", email: OTHER_CUSTOMER_EMAIL }),
      makePassenger({ firstName: "Test", email: CUSTOMER_EMAIL }),
    ],
  });

  otherBooking = await createBooking(catalog, {
    passengers: [makePassenger({ email: OTHER_CUSTOMER_EMAIL })],
  });
});

afterAll(async () => {
  await teardownTestDatabase();
});

describe("GET /api/bookings", () => {
  it("returns every booking to an administrator", async () => {
    const adminAgent = await loginAs(ADMIN_EMAIL);

    const response = await adminAgent.get("/api/bookings");

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      page: 1,
      limit: 10,
      total: 3,
      totalPages: 1,
    });
    expect(sortedIds(response.body.bookings)).toEqual(
      [customerBooking.id, groupBooking.id, otherBooking.id].sort(),
    );
  });

  it("returns only the bookings a standard user is a passenger on", async () => {
    const customerAgent = await loginAs(CUSTOMER_EMAIL);

    const response = await customerAgent.get("/api/bookings");

    expect(response.status).toBe(200);
    expect(response.body.total).toBe(2);
    expect(sortedIds(response.body.bookings)).toEqual(
      [customerBooking.id, groupBooking.id].sort(),
    );
    expect(sortedIds(response.body.bookings)).not.toContain(otherBooking.id);

    for (const booking of response.body.bookings) {
      const emails = booking.passengers.map((passenger) => passenger.email);
      expect(emails).toContain(CUSTOMER_EMAIL);
    }
  });

  it("matches a passenger email regardless of upper or lower case", async () => {
    const upperCaseBooking = await createBooking(catalog, {
      passengers: [makePassenger({ email: CUSTOMER_EMAIL.toUpperCase() })],
    });
    const customerAgent = await loginAs(CUSTOMER_EMAIL);

    const response = await customerAgent.get("/api/bookings");

    expect(response.status).toBe(200);
    expect(response.body.total).toBe(3);
    expect(sortedIds(response.body.bookings)).toContain(upperCaseBooking.id);
  });

  it("rejects an unauthenticated request", async () => {
    const response = await request(app).get("/api/bookings");

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty("message");
  });
});

describe("GET /api/bookings/:id", () => {
  it("returns any booking to an administrator", async () => {
    const adminAgent = await loginAs(ADMIN_EMAIL);

    const response = await adminAgent.get(`/api/bookings/${otherBooking.id}`);

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      id: otherBooking.id,
      ticketClass: otherBooking.ticketClass,
      routeId: catalog.trip.id,
    });
    expect(response.body.passengers[0].email).toBe(OTHER_CUSTOMER_EMAIL);
  });

  it("returns the booking to a standard user who is a passenger", async () => {
    const customerAgent = await loginAs(CUSTOMER_EMAIL);

    const response = await customerAgent.get(
      `/api/bookings/${customerBooking.id}`,
    );

    expect(response.status).toBe(200);
    expect(response.body.id).toBe(customerBooking.id);
  });

  it("returns the booking to a user who is the second passenger", async () => {
    const customerAgent = await loginAs(CUSTOMER_EMAIL);

    const response = await customerAgent.get(`/api/bookings/${groupBooking.id}`);

    expect(response.status).toBe(200);
    expect(response.body.id).toBe(groupBooking.id);
  });

  it("rejects a standard user who is not a passenger", async () => {
    const customerAgent = await loginAs(CUSTOMER_EMAIL);

    const response = await customerAgent.get(`/api/bookings/${otherBooking.id}`);

    expect(response.status).toBe(403);
    expect(response.body).toEqual({ error: "Forbidden" });
  });

  it("rejects an unauthenticated request", async () => {
    const response = await request(app).get(
      `/api/bookings/${customerBooking.id}`,
    );

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty("message");
  });

  it("returns 404 when the booking does not exist", async () => {
    const adminAgent = await loginAs(ADMIN_EMAIL);

    const response = await adminAgent.get("/api/bookings/DOESNOTEXIST");

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: "Booking not found" });
  });
});