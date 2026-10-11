import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import bcrypt from "bcrypt";

import app from "../app.js";
import Role from "../src/models/schemas/roles.js";
import Trip from "../src/models/schemas/trips.js";
import User from "../src/models/schemas/users.js";
import tripFixtures from "../src/models/seeds/routes.json" with { type: "json" };

import {
  clearTestDatabase,
  setupTestDatabase,
  teardownTestDatabase,
} from "./setup.js";

const TEST_PASSWORD = "TestPassword123!";
const knownTrip = tripFixtures.find((trip) => trip.id === "alpine-panorama");
const createdTripData = {
  id: "test-mountain-express",
  name: "Test Mountain Express",
  description: "A test-only mountain route.",
  region: "central",
  startStation: "nagoya",
  endStation: "toyama",
  duration: "3 hours",
  distance: 150,
  highlights: ["Mountain views", "Test fixture"],
  bestSeason: "autumn",
  operatingMonths: [4, 5, 6, 9, 10],
  imageUrl: "/images/routes/test-mountain-express.png",
};

async function createTestUsers() {
  const [adminRole, customerRole] = await Promise.all([
    Role.create({ name: "admin" }),
    Role.create({ name: "customer" }),
  ]);
  const passwordHash = await bcrypt.hash(TEST_PASSWORD, 12);

  await User.create([
    {
      displayName: "Test Administrator",
      username: "testadmin",
      email: "testadmin@example.com",
      passwordHash,
      role: adminRole._id,
    },
    {
      displayName: "Test Customer",
      username: "testcustomer",
      email: "testcustomer@example.com",
      passwordHash,
      role: customerRole._id,
    },
  ]);
}

async function loginAs(email) {
  const agent = request.agent(app);
  const response = await agent.post("/login").send({
    email,
    password: TEST_PASSWORD,
  });

  expect(response.status).toBe(302);

  return agent;
}

async function expectKnownTripUnchanged() {
  const storedTrip = await Trip.findOne({ id: knownTrip.id }).lean();

  expect(storedTrip).toMatchObject(knownTrip);
}

beforeAll(async () => {
  await setupTestDatabase();
});

beforeEach(async () => {
  await clearTestDatabase();
  await createTestUsers();
  await Trip.create({
    ...knownTrip,
    highlights: [...knownTrip.highlights],
    operatingMonths: [...knownTrip.operatingMonths],
  });
});

afterAll(async () => {
  await teardownTestDatabase();
});

describe("POST /api/trips", () => {
  it("allows an administrator to create a trip", async () => {
    const adminAgent = await loginAs("testadmin@example.com");
    const initialCount = await Trip.countDocuments();

    const response = await adminAgent.post("/api/trips").send(createdTripData);

    expect(response.status).toBe(201);
    expect(response.headers["content-type"]).toMatch(/json/);
    expect(response.body).toMatchObject(createdTripData);
    expect(response.body).toMatchObject({
      _id: expect.any(String),
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    });

    const storedTrip = await Trip.findOne({ id: createdTripData.id }).lean();
    expect(storedTrip).toMatchObject(createdTripData);
    expect(await Trip.countDocuments()).toBe(initialCount + 1);
  });

  it("rejects an unauthenticated create without saving a trip", async () => {
    const initialCount = await Trip.countDocuments();

    const response = await request(app).post("/api/trips").send(createdTripData);

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ message: "Unauthorized" });
    expect(await Trip.findOne({ id: createdTripData.id })).toBeNull();
    expect(await Trip.countDocuments()).toBe(initialCount);
  });

  it("rejects a signed-in customer without saving a trip", async () => {
    const customerAgent = await loginAs("testcustomer@example.com");
    const initialCount = await Trip.countDocuments();

    const response = await customerAgent.post("/api/trips").send(createdTripData);

    expect(response.status).toBe(403);
    expect(response.body).toEqual({ message: "Forbidden" });
    expect(await Trip.findOne({ id: createdTripData.id })).toBeNull();
    expect(await Trip.countDocuments()).toBe(initialCount);
  });
});

describe("PUT /api/trips/:id", () => {
  const updateData = {
    name: "Updated Alpine Panorama",
    region: "updated-central",
    startStation: "updated-nagoya",
    endStation: "updated-toyama",
    duration: "5 hours",
    distance: 200,
  };

  it("allows an administrator to update a trip", async () => {
    const adminAgent = await loginAs("testadmin@example.com");

    const response = await adminAgent
      .put(`/api/trips/${knownTrip.id}`)
      .send(updateData);

    expect(response.status).toBe(200);
    expect(response.headers["content-type"]).toMatch(/json/);
    expect(response.body).toMatchObject({
      id: knownTrip.id,
      ...updateData,
      description: knownTrip.description,
    });

    const storedTrip = await Trip.findOne({ id: knownTrip.id }).lean();
    expect(storedTrip).toMatchObject({
      id: knownTrip.id,
      ...updateData,
      description: knownTrip.description,
    });
    expect(await Trip.countDocuments()).toBe(1);
  });

  it("rejects an unauthenticated update and leaves the trip unchanged", async () => {
    const response = await request(app)
      .put(`/api/trips/${knownTrip.id}`)
      .send(updateData);

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ message: "Unauthorized" });
    await expectKnownTripUnchanged();
  });

  it("rejects a signed-in customer update and leaves the trip unchanged", async () => {
    const customerAgent = await loginAs("testcustomer@example.com");

    const response = await customerAgent
      .put(`/api/trips/${knownTrip.id}`)
      .send(updateData);

    expect(response.status).toBe(403);
    expect(response.body).toEqual({ message: "Forbidden" });
    await expectKnownTripUnchanged();
  });
});

describe("DELETE /api/trips/:id", () => {
  it("allows an administrator to delete a trip", async () => {
    const adminAgent = await loginAs("testadmin@example.com");

    const response = await adminAgent.delete(`/api/trips/${knownTrip.id}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      message: "Trip deleted successfully",
      id: knownTrip.id,
    });
    expect(await Trip.findOne({ id: knownTrip.id })).toBeNull();
    expect(await Trip.countDocuments()).toBe(0);
  });

  it("rejects an unauthenticated delete and leaves the trip in the database", async () => {
    const response = await request(app).delete(`/api/trips/${knownTrip.id}`);

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ message: "Unauthorized" });
    await expectKnownTripUnchanged();
  });

  it("rejects a signed-in customer delete and leaves the trip in the database", async () => {
    const customerAgent = await loginAs("testcustomer@example.com");

    const response = await customerAgent.delete(`/api/trips/${knownTrip.id}`);

    expect(response.status).toBe(403);
    expect(response.body).toEqual({ message: "Forbidden" });
    await expectKnownTripUnchanged();
  });
});
