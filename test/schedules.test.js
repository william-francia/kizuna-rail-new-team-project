import { beforeAll, beforeEach, afterAll, describe, expect, it } from "vitest";
import request from "supertest";

import app from "../app.js";
import Schedule from "../src/models/schemas/schedules.js";
import scheduleFixtures from "../src/models/seeds/schedules.json" with { type: "json" };
import routeFixtures from "../src/models/seeds/routes.json" with { type: "json" };

import {
  setupTestDatabase,
  clearTestDatabase,
  teardownTestDatabase,
} from "./setup.js";

const knownTripId = routeFixtures.routes ? routeFixtures.routes[0].id : "alpine-panorama";
const knownSchedule = scheduleFixtures[0];

beforeAll(async () => {
  await setupTestDatabase();
});

beforeEach(async () => {
  await clearTestDatabase();
  await Schedule.insertMany(scheduleFixtures);
});

afterAll(async () => {
  await teardownTestDatabase();
});

describe("GET /api/schedules", () => {
  it("returns all schedules successfully without authentication", async () => {
    const response = await request(app).get("/api/schedules");

    expect(response.status).toBe(200);
    expect(response.headers["content-type"]).toMatch(/json/);
    const results = response.body.results || response.body;
    expect(results.length).toBe(scheduleFixtures.length);
  });
});

describe("GET /api/schedules/:id", () => {
  it("returns a known schedule by its stable ID", async () => {
    const response = await request(app).get(`/api/schedules/${knownSchedule.id}`);

    expect(response.status).toBe(200);
    expect(response.headers["content-type"]).toMatch(/json/);
    expect(response.body.id).toBe(knownSchedule.id);
  });

  it("returns 404 when the schedule ID does not exist", async () => {
    const response = await request(app).get("/api/schedules/nonexistent-schedule-id");

    expect(response.status).toBe(404);
    expect(response.headers["content-type"]).toMatch(/json/);
    expect(response.body).toEqual({ error: "Schedule not found" });
  });
});

describe("GET /api/trips/:id/schedules", () => {
  it("returns schedules connected to a specific trip", async () => {
    const response = await request(app).get(`/api/trips/${knownTripId}/schedules`);

    expect(response.status).toBe(200);
    expect(response.headers["content-type"]).toMatch(/json/);
    const results = Array.isArray(response.body) ? response.body : response.body.results;
    expect(results.every((s) => s.tripId === knownTripId || s.routeId === knownTripId)).toBe(true);
  });
});