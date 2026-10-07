import { beforeAll, beforeEach, afterAll, describe, expect, it } from "vitest";
import request from "supertest";
import bcrypt from "bcrypt";

import app from "../app.js";
import User from "../src/models/schemas/users.js";
import Role from "../src/models/schemas/roles.js";

import {
  setupTestDatabase,
  clearTestDatabase,
  teardownTestDatabase,
} from "./setup.js";

const TEST_PASSWORD = "TestPassword123!";

let adminUser;
let customerUser;
let otherCustomerUser;

async function createTestUsers() {
  const [adminRole, customerRole] = await Promise.all([
    Role.create({ name: "admin" }),
    Role.create({ name: "customer" }),
  ]);

  const passwordHash = await bcrypt.hash(TEST_PASSWORD, 12);

  adminUser = await User.create({
    displayName: "Test Administrator",
    username: "testadmin",
    email: "testadmin@example.com",
    passwordHash,
    role: adminRole._id,
  });

  customerUser = await User.create({
    displayName: "Test Customer",
    username: "testcustomer",
    email: "testcustomer@example.com",
    passwordHash,
    role: customerRole._id,
  });

  otherCustomerUser = await User.create({
    displayName: "Other Customer",
    username: "othercustomer",
    email: "othercustomer@example.com",
    passwordHash,
    role: customerRole._id,
  });
}

async function loginAs(email) {
  const agent = request.agent(app);

  const response = await agent
    .post("/login")
    .send({
      email,
      password: TEST_PASSWORD,
    });

  expect(response.status).toBe(302);

  return agent;
}

beforeAll(async () => {
  await setupTestDatabase();
});

beforeEach(async () => {
  await clearTestDatabase();
  await createTestUsers();
});

afterAll(async () => {
  await teardownTestDatabase();
});

describe("GET /api/users", () => {
  it("allows an administrator to retrieve users", async () => {
    const adminAgent = await loginAs("testadmin@example.com");

    const response = await adminAgent.get("/api/users");

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(3);
    expect(response.body.metadata).toMatchObject({
      page: 1,
      limit: 10,
      totalItems: 3,
      totalPages: 1,
      sort: "username",
      role: null,
      keyword: null,
    });

    expect(response.body.data[0]).not.toHaveProperty("passwordHash");
  });

  it("rejects an unauthenticated request", async () => {
    const response = await request(app).get("/api/users");

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      message: "Unauthorized",
    });
  });

  it("rejects a standard signed-in user", async () => {
    const customerAgent = await loginAs("testcustomer@example.com");

    const response = await customerAgent.get("/api/users");

    expect(response.status).toBe(403);
    expect(response.body).toEqual({
      message: "Forbidden",
    });
  });
});

describe("GET /api/users/:id", () => {
  it("allows an administrator to retrieve one user", async () => {
    const adminAgent = await loginAs("testadmin@example.com");

    const response = await adminAgent.get(`/api/users/${customerUser._id}`);

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      _id: customerUser._id.toString(),
      displayName: "Test Customer",
      username: "testcustomer",
      email: "testcustomer@example.com",
      role: {
        name: "customer",
      },
    });

    expect(response.body).not.toHaveProperty("passwordHash");
  });

  it("rejects an unauthenticated request", async () => {
    const response = await request(app).get(
      `/api/users/${customerUser._id}`,
    );

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      message: "Unauthorized",
    });
  });

  it("rejects a standard signed-in user", async () => {
    const customerAgent = await loginAs("testcustomer@example.com");

    const response = await customerAgent.get(
      `/api/users/${otherCustomerUser._id}`,
    );

    expect(response.status).toBe(403);
    expect(response.body).toEqual({
      message: "Forbidden",
    });
  });

  it("rejects an invalid user ID", async () => {
    const adminAgent = await loginAs("testadmin@example.com");

    const response = await adminAgent.get("/api/users/not-a-valid-id");

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: "Invalid user ID",
    });
  });

  it("returns 404 when the user does not exist", async () => {
    const adminAgent = await loginAs("testadmin@example.com");

    const response = await adminAgent.get(
      "/api/users/507f1f77bcf86cd799439011",
    );

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      error: "User not found",
    });
  });
});