import { beforeAll, beforeEach, afterAll, describe, expect, it } from "vitest";
import request from "supertest";

import app from "../app.js";
import Trip from "../src/models/schemas/trips.js";
import tripFixtures from "../src/models/seeds/routes.json" with { type: "json" };

import {
  setupTestDatabase,
  clearTestDatabase,
  teardownTestDatabase,
} from "./setup.js";

const knownTrip = tripFixtures.find((trip) => trip.id === "alpine-panorama");

beforeAll(async () => {
  await setupTestDatabase();
});

beforeEach(async () => {
  await clearTestDatabase();
  await Trip.insertMany(
    tripFixtures.map((trip) => ({
      ...trip,
      highlights: [...trip.highlights],
      operatingMonths: [...trip.operatingMonths],
    })),
  );
});

afterAll(async () => {
  await teardownTestDatabase();
});

describe("GET /api/trips", () => {
  it("returns known trips and response metadata without authentication", async () => {
    const response = await request(app).get("/api/trips");

    expect(response.status).toBe(200);
    expect(response.headers["content-type"]).toMatch(/json/);
    expect(response.body.results).toHaveLength(tripFixtures.length);
    expect(response.body.results).toEqual(
      expect.arrayContaining(
        tripFixtures.map((trip) => expect.objectContaining(trip)),
      ),
    );
    expect(response.body.meta).toMatchObject({
      page: 1,
      perPage: 10,
      totalItems: tripFixtures.length,
      totalPages: 1,
      hasNextPage: false,
      hasPreviousPage: false,
      filters: { search: null, region: null, season: null },
      availableFilters: {
        regions: expect.any(Array),
        seasons: expect.any(Array),
      },
    });
  });
});

describe("GET /api/trips/:id", () => {
  it("returns a known trip by its stable ID without authentication", async () => {
    const response = await request(app).get("/api/trips/alpine-panorama");

    expect(response.status).toBe(200);
    expect(response.headers["content-type"]).toMatch(/json/);
    expect(response.body).toMatchObject(knownTrip);
    expect(response.body).toMatchObject({
      _id: expect.any(String),
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    });
  });

  it("returns 404 when the trip ID does not exist", async () => {
    const missingTripId = "nonexistent-trip";
    expect(await Trip.exists({ id: missingTripId })).toBeNull();

    const response = await request(app).get(`/api/trips/${missingTripId}`);

    expect(response.status).toBe(404);
    expect(response.headers["content-type"]).toMatch(/json/);
    expect(response.body).toEqual({ error: "Trip not found" });
  });
});
