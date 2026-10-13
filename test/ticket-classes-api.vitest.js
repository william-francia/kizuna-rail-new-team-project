import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from "vitest";
import request from "supertest";
import TicketClass from "../src/models/schemas/ticket-classes.js";
import {
  setupTestDatabase,
  clearTestDatabase,
  teardownTestDatabase,
} from "./setup.js";
import app from "../app.js";

const sampleTicketClasses = [
  {
    class: "Standard",
    name: "Standard Class",
    pricePerKm: 8,
    amenities: ["Comfortable seating"],
    description: "Standard ticket for everyday travel.",
    availableDays: ["monday", "tuesday"],
  },
  {
    class: "Premium",
    name: "Premium Class",
    pricePerKm: 15,
    amenities: ["Extra legroom"],
    description: "Premium ticket for a comfortable journey.",
    availableDays: ["tuesday", "thursday"],
  },
  {
    class: "First",
    name: "First Class",
    pricePerKm: 25,
    amenities: ["Private cabin"],
    description: "First-class ticket for luxury travel.",
    availableDays: ["saturday"],
  },
];

beforeAll(async () => {
  await setupTestDatabase();
});

beforeEach(async () => {
  await clearTestDatabase();
  await TicketClass.insertMany(sampleTicketClasses);
});

afterAll(async () => {
  await teardownTestDatabase();
});

describe("GET /api/ticket-classes", () => {
  it("returns ticket classes and pagination metadata", async () => {
    const response = await request(app)
      .get("/api/ticket-classes")
      .expect(200);

    expect(response.body.data).toHaveLength(3);
    expect(response.body.metadata).toEqual({
      total: 3,
      page: 1,
      limit: 10,
      totalPages: 1,
    });
  });

  it("returns the requested page and limit in stable price order", async () => {
    const response = await request(app)
      .get("/api/ticket-classes?page=2&limit=2")
      .expect(200);

    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].class).toBe("First");
    expect(response.body.metadata).toEqual({
      total: 3,
      page: 2,
      limit: 2,
      totalPages: 2,
    });
  });

  it("searches by name rather than relying on a description match", async () => {
    const response = await request(app)
      .get("/api/ticket-classes")
      .query({ search: "Premium Class" })
      .expect(200);

    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].name).toBe("Premium Class");
    expect(response.body.metadata.total).toBe(1);
  });

  it("trims and ignores case in search terms", async () => {
    const response = await request(app)
      .get("/api/ticket-classes")
      .query({ search: "  pReMiUm cLaSs  " })
      .expect(200);

    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].class).toBe("Premium");
  });

  it("filters ticket classes by available weekday", async () => {
    const response = await request(app)
      .get("/api/ticket-classes?day=tuesday")
      .expect(200);

    expect(response.body.data.map((item) => item.class)).toEqual([
      "Standard",
      "Premium",
    ]);
    expect(response.body.metadata.total).toBe(2);
  });

  it("trims and ignores case in weekday filters", async () => {
    const response = await request(app)
      .get("/api/ticket-classes")
      .query({ day: "  TUESDAY  " })
      .expect(200);

    expect(response.body.data.map((item) => item.class)).toEqual([
      "Standard",
      "Premium",
    ]);
  });

  it("returns no results for a valid weekday with no matching classes", async () => {
    const response = await request(app)
      .get("/api/ticket-classes?day=sunday")
      .expect(200);

    expect(response.body.data).toEqual([]);
    expect(response.body.metadata.total).toBe(0);
    expect(response.body.metadata.totalPages).toBe(0);
  });

  it("returns no results when the search has no matches", async () => {
    const response = await request(app)
      .get("/api/ticket-classes?search=NonexistentClass")
      .expect(200);

    expect(response.body.data).toEqual([]);
    expect(response.body.metadata.total).toBe(0);
  });

  it("combines weekday filtering with pagination", async () => {
    const response = await request(app)
      .get("/api/ticket-classes?day=tuesday&page=1&limit=1")
      .expect(200);

    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].class).toBe("Standard");
    expect(response.body.metadata).toEqual({
      total: 2,
      page: 1,
      limit: 1,
      totalPages: 2,
    });
  });

  it("returns an empty page when the requested page is past the end", async () => {
    const response = await request(app)
      .get("/api/ticket-classes?page=5&limit=2")
      .expect(200);

    expect(response.body.data).toEqual([]);
    expect(response.body.metadata).toEqual({
      total: 3,
      page: 5,
      limit: 2,
      totalPages: 2,
    });
  });

  it("rejects page zero", async () => {
    const response = await request(app)
      .get("/api/ticket-classes?page=0")
      .expect(400);

    expect(response.body.error).toBe("Page must be a positive integer");
  });

  it.each(["abc", "-1", "1.5"])(
    "rejects invalid page value %s",
    async (page) => {
      const response = await request(app)
        .get("/api/ticket-classes")
        .query({ page })
        .expect(400);

      expect(response.body.error).toBe(
        "Page must be a positive integer",
      );
    },
  );

  it("rejects repeated page parameters", async () => {
    const response = await request(app)
      .get("/api/ticket-classes?page=1&page=2")
      .expect(400);

    expect(response.body.error).toBe("Page must be a positive integer");
  });

  it.each(["0", "11", "abc", "1.5"])(
    "rejects invalid limit value %s",
    async (limit) => {
      const response = await request(app)
        .get("/api/ticket-classes")
        .query({ limit })
        .expect(400);

      expect(response.body.error).toBe(
        "Limit must be an integer between 1 and 10",
      );
    },
  );

  it("rejects an empty search term", async () => {
    const response = await request(app)
      .get("/api/ticket-classes?search=%20%20")
      .expect(400);

    expect(response.body.error).toBe("Search must not be empty");
  });

  it("rejects search terms longer than 50 characters", async () => {
    const response = await request(app)
      .get("/api/ticket-classes")
      .query({ search: "x".repeat(51) })
      .expect(400);

    expect(response.body.error).toBe(
      "Search must be 50 characters or fewer",
    );
  });

  it("rejects an empty weekday filter", async () => {
    const response = await request(app)
      .get("/api/ticket-classes?day=%20%20")
      .expect(400);

    expect(response.body.error).toBe("Invalid day");
  });

  it("rejects an invalid weekday", async () => {
    const response = await request(app)
      .get("/api/ticket-classes?day=funday")
      .expect(400);

    expect(response.body.error).toBe("Invalid day");
  });
});
