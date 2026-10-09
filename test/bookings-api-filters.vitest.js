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
  createBookingOn,
  createManyBookings,
  loginAs,
  makePassenger,
  seedCatalog,
  seedUsers,
} from "./helpers/bookings-helpers.js";

let catalog;
let classA; // first seeded ticket class
let classB; // second seeded ticket class
let admin;

const idsOf = (response) => response.body.bookings.map((booking) => booking.id);

beforeAll(async () => {
  await setupTestDatabase();
});

beforeEach(async () => {
  await clearTestDatabase();
  catalog = await seedCatalog();
  await seedUsers();
  classA = catalog.ticketClasses[0].class;
  classB = catalog.ticketClasses[1].class;
  admin = await loginAs(ADMIN_EMAIL);
});

afterAll(async () => {
  await teardownTestDatabase();
});

describe("GET /api/bookings pagination", () => {
  it("returns the 10 newest bookings and metadata on page 1 of 11", async () => {
    const created = await createManyBookings(catalog, 11); // oldest first
    const newestFirst = [...created].reverse().map((booking) => booking.id);

    const response = await admin.get("/api/bookings");

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      page: 1,
      limit: 10,
      total: 11,
      totalPages: 2,
    });
    expect(idsOf(response)).toEqual(newestFirst.slice(0, 10));
  });

  it("returns only the oldest booking on page 2 of 11", async () => {
    const created = await createManyBookings(catalog, 11);

    const response = await admin.get("/api/bookings?page=2");

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      page: 2,
      limit: 10,
      total: 11,
      totalPages: 2,
    });
    expect(idsOf(response)).toEqual([created[0].id]);
  });

  it("splits 11 bookings across three pages with limit=5 and no overlap", async () => {
    const created = await createManyBookings(catalog, 11);

    const pages = [];
    for (const page of [1, 2, 3]) {
      const response = await admin.get(`/api/bookings?page=${page}&limit=5`);
      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({ page, limit: 5, total: 11, totalPages: 3 });
      pages.push(idsOf(response));
    }

    expect(pages.map((page) => page.length)).toEqual([5, 5, 1]);
    expect(pages.flat().sort()).toEqual(created.map((booking) => booking.id).sort());
  });

  it("returns an empty list for a page past the end but keeps the totals", async () => {
    await createManyBookings(catalog, 3);

    const response = await admin.get("/api/bookings?page=5");

    expect(response.status).toBe(200);
    expect(response.body.bookings).toEqual([]);
    expect(response.body).toMatchObject({ page: 5, total: 3, totalPages: 1 });
  });

  it("returns an empty first page with totalPages 1 when there are no bookings", async () => {
    const response = await admin.get("/api/bookings");

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      bookings: [],
      page: 1,
      total: 0,
      totalPages: 1,
    });
  });

  it("falls back to page 1 and limit 10 for invalid page and limit values", async () => {
    await createManyBookings(catalog, 2);

    for (const query of ["page=0", "page=-3", "page=abc", "limit=0", "limit=abc"]) {
      const response = await admin.get(`/api/bookings?${query}`);

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({ page: 1, limit: 10, total: 2 });
    }
  });

  it("caps the limit at 50", async () => {
    await createManyBookings(catalog, 1);

    const response = await admin.get("/api/bookings?limit=500");

    expect(response.status).toBe(200);
    expect(response.body.limit).toBe(50);
  });

  it("paginates only a standard user's own bookings", async () => {
    await createManyBookings(catalog, 3, {
      passengers: [makePassenger({ email: CUSTOMER_EMAIL })],
    });
    await createManyBookings(catalog, 2, {
      passengers: [makePassenger({ email: OTHER_CUSTOMER_EMAIL })],
    });
    const customer = await loginAs(CUSTOMER_EMAIL);

    const response = await customer.get("/api/bookings?limit=2");

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ total: 3, totalPages: 2, limit: 2 });
    expect(response.body.bookings).toHaveLength(2);
  });
});

describe("GET /api/bookings ticket-class filter", () => {
  beforeEach(async () => {
    await createBookingOn(catalog, "2026-10-01", { ticketClass: classA });
    await createBookingOn(catalog, "2026-10-02", { ticketClass: classA });
    await createBookingOn(catalog, "2026-10-03", { ticketClass: classB });
  });

  it("returns only bookings with the requested ticket class", async () => {
    const response = await admin.get(`/api/bookings?ticketClass=${encodeURIComponent(classA)}`);

    expect(response.status).toBe(200);
    expect(response.body.total).toBe(2);
    expect(response.body.bookings.every((b) => b.ticketClass === classA)).toBe(true);
  });

  it("matches the ticket class regardless of upper or lower case", async () => {
    const response = await admin.get(
      `/api/bookings?ticketClass=${encodeURIComponent(classB.toUpperCase())}`,
    );

    expect(response.status).toBe(200);
    expect(response.body.total).toBe(1);
    expect(response.body.bookings[0].ticketClass).toBe(classB);
  });

  it("returns no bookings when no booking has the ticket class", async () => {
    const response = await admin.get("/api/bookings?ticketClass=no-such-class");

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ bookings: [], total: 0, totalPages: 1 });
  });

  it("ignores an empty ticketClass value", async () => {
    const response = await admin.get("/api/bookings?ticketClass=");

    expect(response.status).toBe(200);
    expect(response.body.total).toBe(3);
  });

  it("filters within a standard user's own bookings only", async () => {
    await createBookingOn(catalog, "2026-10-04", {
      ticketClass: classA,
      passengers: [makePassenger({ email: CUSTOMER_EMAIL })],
    });
    const customer = await loginAs(CUSTOMER_EMAIL);

    const response = await customer.get(`/api/bookings?ticketClass=${encodeURIComponent(classA)}`);

    expect(response.status).toBe(200);
    expect(response.body.total).toBe(1);
  });

  it("keeps the filter when paging through the results", async () => {
    await createBookingOn(catalog, "2026-10-05", { ticketClass: classA });

    const first = await admin.get(`/api/bookings?ticketClass=${encodeURIComponent(classA)}&limit=2`);
    const second = await admin.get(
      `/api/bookings?ticketClass=${encodeURIComponent(classA)}&limit=2&page=2`,
    );

    expect(first.body).toMatchObject({ total: 3, totalPages: 2 });
    expect(first.body.bookings).toHaveLength(2);
    expect(second.body.bookings).toHaveLength(1);
    expect(second.body.bookings[0].ticketClass).toBe(classA);
  });
});

describe("GET /api/bookings booking-date filter", () => {
  let oct1;
  let oct15;
  let oct31;
  let nov5;

  beforeEach(async () => {
    // Booking dates are createdAt. Each is stored at noon UTC on its day.
    oct1 = await createBookingOn(catalog, "2026-10-01");
    oct15 = await createBookingOn(catalog, "2026-10-15");
    oct31 = await createBookingOn(catalog, "2026-10-31");
    nov5 = await createBookingOn(catalog, "2026-11-05");
  });

  it("returns bookings inside a from and to range", async () => {
    const response = await admin.get("/api/bookings?from=2026-10-10&to=2026-10-20");

    expect(response.status).toBe(200);
    expect(idsOf(response)).toEqual([oct15.id]);
    expect(response.body.total).toBe(1);
  });

  it("returns everything on or after from when to is missing", async () => {
    const response = await admin.get("/api/bookings?from=2026-10-15");

    expect(response.status).toBe(200);
    expect(idsOf(response)).toEqual([nov5.id, oct31.id, oct15.id]);
  });

  it("returns everything on or before to when from is missing, including the whole last day", async () => {
    const response = await admin.get("/api/bookings?to=2026-10-15");

    expect(response.status).toBe(200);
    expect(idsOf(response)).toEqual([oct15.id, oct1.id]);
  });

  it("returns the bookings made on a single day when from and to are the same date", async () => {
    const response = await admin.get("/api/bookings?from=2026-10-31&to=2026-10-31");

    expect(response.status).toBe(200);
    expect(idsOf(response)).toEqual([oct31.id]);
  });

  it("accepts a full ISO date-time and respects the time of day", async () => {
    const response = await admin.get(
      `/api/bookings?from=${encodeURIComponent("2026-10-15T13:00:00.000Z")}&to=2026-10-31`,
    );

    expect(response.status).toBe(200);
    // oct15 was booked at 12:00 UTC, before the 13:00 start
    expect(idsOf(response)).toEqual([oct31.id]);
  });

  it("returns no bookings when none fall in the range", async () => {
    const response = await admin.get("/api/bookings?from=2027-01-01&to=2027-01-31");

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ bookings: [], total: 0, totalPages: 1 });
  });

  it("combines the date range with the ticket-class filter", async () => {
    await createBookingOn(catalog, "2026-10-16", { ticketClass: classB });

    const response = await admin.get(
      `/api/bookings?from=2026-10-10&to=2026-10-20&ticketClass=${encodeURIComponent(classB)}`,
    );

    expect(response.status).toBe(200);
    expect(response.body.total).toBe(1);
    expect(response.body.bookings[0].ticketClass).toBe(classB);
  });

  it("applies the date range to a standard user's own bookings only", async () => {
    const own = await createBookingOn(catalog, "2026-10-16", {
      passengers: [makePassenger({ email: CUSTOMER_EMAIL })],
    });
    const customer = await loginAs(CUSTOMER_EMAIL);

    const response = await customer.get("/api/bookings?from=2026-10-01&to=2026-10-31");

    expect(response.status).toBe(200);
    expect(idsOf(response)).toEqual([own.id]);
  });

  it("returns 400 for an invalid date", async () => {
    const response = await admin.get("/api/bookings?from=not-a-date");

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: "Invalid date. Use YYYY-MM-DD or an ISO date-time.",
    });
  });

  it("returns 400 when from is after to", async () => {
    const response = await admin.get("/api/bookings?from=2026-10-20&to=2026-10-10");

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: "'from' must not be after 'to'." });
  });

  it("rejects an unauthenticated filtered request", async () => {
    const response = await request(app).get("/api/bookings?from=2026-10-01");

    expect(response.status).toBe(401);
  });
});