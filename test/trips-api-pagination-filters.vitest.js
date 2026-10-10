import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import request from "supertest";

import app from "../app.js";
import Trip from "../src/models/schemas/trips.js";

import {
  clearTestDatabase,
  setupTestDatabase,
  teardownTestDatabase,
} from "./setup.js";

function buildTrip({ id, name, description, region, bestSeason }) {
  return {
    id,
    name,
    description,
    region,
    startStation: `${id}-start`,
    endStation: `${id}-end`,
    duration: "2 hours",
    distance: 100,
    highlights: [`${name} highlight`],
    bestSeason,
    operatingMonths: [4, 5, 6, 9, 10],
    imageUrl: `/images/routes/${id}.png`,
  };
}

const tripFixtures = [
  buildTrip({
    id: "trip-01",
    name: "Alpine Sunrise Express",
    description: "Mountain views above a quiet valley.",
    region: "central",
    bestSeason: "autumn",
  }),
  buildTrip({
    id: "trip-02",
    name: "Cedar Valley Route",
    description: "A forest journey past hidden waterfalls.",
    region: "central",
    bestSeason: "autumn",
  }),
  ...Array.from({ length: 9 }, (_, index) => {
    const number = String(index + 3).padStart(2, "0");

    return buildTrip({
      id: `trip-${number}`,
      name: `Central Scenic Route ${number}`,
      description: `Autumn railway journey number ${number}.`,
      region: "central",
      bestSeason: "autumn",
    });
  }),
  buildTrip({
    id: "trip-12",
    name: "Northern Coastal Breeze",
    description: "Summer ocean views along the northern coast.",
    region: "northern",
    bestSeason: "summer",
  }),
  buildTrip({
    id: "trip-13",
    name: "Snow Wetlands Limited",
    description: "A winter journey across the wetlands.",
    region: "hokkaido",
    bestSeason: "winter",
  }),
];

beforeAll(async () => {
  await setupTestDatabase();
});

beforeEach(async () => {
  await clearTestDatabase();
  await Trip.insertMany(tripFixtures);
});

afterAll(async () => {
  await teardownTestDatabase();
});

describe("GET /api/trips pagination", () => {
  it("returns the first ten trips in stable order with pagination metadata", async () => {
    const response = await request(app).get("/api/trips");

    expect(response.status).toBe(200);
    expect(response.headers["content-type"]).toMatch(/json/);
    expect(response.body.results.map((trip) => trip.id)).toEqual(
      tripFixtures.slice(0, 10).map((trip) => trip.id),
    );
    expect(response.body.meta).toMatchObject({
      page: 1,
      perPage: 10,
      totalItems: 13,
      totalPages: 2,
      hasNextPage: true,
      hasPreviousPage: false,
      filters: { search: null, region: null, season: null },
      availableFilters: {
        regions: ["central", "hokkaido", "northern"],
        seasons: ["autumn", "summer", "winter"],
      },
    });
  });

  it("returns a partial final page with correct metadata", async () => {
    const response = await request(app).get("/api/trips").query({ page: 2 });

    expect(response.status).toBe(200);
    expect(response.body.results.map((trip) => trip.id)).toEqual([
      "trip-11",
      "trip-12",
      "trip-13",
    ]);
    expect(response.body.meta).toMatchObject({
      page: 2,
      perPage: 10,
      totalItems: 13,
      totalPages: 2,
      hasNextPage: false,
      hasPreviousPage: true,
    });
  });
});

describe("GET /api/trips filters and search", () => {
  it("filters by an exact region and retains pagination", async () => {
    const response = await request(app)
      .get("/api/trips")
      .query({ region: "central" });

    expect(response.status).toBe(200);
    expect(response.body.results).toHaveLength(10);
    expect(response.body.results.every((trip) => trip.region === "central")).toBe(true);
    expect(response.body.meta).toMatchObject({
      page: 1,
      perPage: 10,
      totalItems: 11,
      totalPages: 2,
      hasNextPage: true,
      filters: { search: null, region: "central", season: null },
    });
  });

  it("filters season against the stored bestSeason field", async () => {
    const response = await request(app)
      .get("/api/trips")
      .query({ season: "summer" });

    expect(response.status).toBe(200);
    expect(response.body.results).toHaveLength(1);
    expect(response.body.results[0]).toMatchObject({
      id: "trip-12",
      bestSeason: "summer",
    });
    expect(response.body.meta.filters).toEqual({
      search: null,
      region: null,
      season: "summer",
    });
  });

  it("searches partial names and descriptions without case sensitivity", async () => {
    const nameResponse = await request(app)
      .get("/api/trips")
      .query({ search: "SUNRISE" });
    const descriptionResponse = await request(app)
      .get("/api/trips")
      .query({ search: "waterFALLS" });

    expect(nameResponse.status).toBe(200);
    expect(nameResponse.body.results.map((trip) => trip.id)).toEqual(["trip-01"]);
    expect(nameResponse.body.meta.filters.search).toBe("SUNRISE");

    expect(descriptionResponse.status).toBe(200);
    expect(descriptionResponse.body.results.map((trip) => trip.id)).toEqual([
      "trip-02",
    ]);
    expect(descriptionResponse.body.meta.filters.search).toBe("waterFALLS");
  });

  it("combines region, season, and search and reports global filter options", async () => {
    const response = await request(app).get("/api/trips").query({
      region: "central",
      season: "autumn",
      search: "  mountain  ",
    });

    expect(response.status).toBe(200);
    expect(response.body.results.map((trip) => trip.id)).toEqual(["trip-01"]);
    expect(response.body.meta).toMatchObject({
      totalItems: 1,
      totalPages: 1,
      filters: {
        search: "mountain",
        region: "central",
        season: "autumn",
      },
      availableFilters: {
        regions: ["central", "hokkaido", "northern"],
        seasons: ["autumn", "summer", "winter"],
      },
    });
  });

  it("returns zero-result metadata for a valid unmatched combination", async () => {
    const response = await request(app).get("/api/trips").query({
      region: "northern",
      season: "winter",
    });

    expect(response.status).toBe(200);
    expect(response.body.results).toEqual([]);
    expect(response.body.meta).toMatchObject({
      page: 1,
      perPage: 10,
      totalItems: 0,
      totalPages: 0,
      hasNextPage: false,
      hasPreviousPage: false,
      filters: { search: null, region: "northern", season: "winter" },
    });
  });

  it("returns 400 for an invalid page without returning trip results", async () => {
    const response = await request(app).get("/api/trips").query({ page: 0 });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: "Invalid page parameter",
      details: [
        {
          field: "page",
          message: "page must be a positive integer",
        },
      ],
    });
    expect(response.body).not.toHaveProperty("results");
  });

  it("returns 400 for unknown region and season values", async () => {
    const response = await request(app).get("/api/trips").query({
      region: "unknown-region",
      season: "monsoon",
    });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: "Invalid trip filters",
      details: [
        {
          field: "region",
          message: "Unknown region filter: unknown-region",
        },
        {
          field: "season",
          message: "Unknown season filter: monsoon",
        },
      ],
    });
    expect(response.body).not.toHaveProperty("results");
  });
});
