
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from "vitest";
import request from "supertest";
import bcrypt from "bcrypt";
import mongoose from "mongoose";
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

  [adminUser, customerUser, otherCustomerUser] = await Promise.all([
    User.create({
      displayName: "Test Administrator",
      username: "testadmin",
      email: "testadmin@example.com",
      passwordHash,
      role: adminRole._id,
    }),
    User.create({
      displayName: "Test Customer",
      username: "testcustomer",
      email: "testcustomer@example.com",
      passwordHash,
      role: customerRole._id,
    }),
    User.create({
      displayName: "Other Customer",
      username: "othercustomer",
      email: "othercustomer@example.com",
      passwordHash,
      role: customerRole._id,
    }),
  ]);
}

async function loginAs(email) {
  const agent = request.agent(app);

  const response = await agent
    .post("/login")
    .type("form")
    .send({
      email,
      password: TEST_PASSWORD,
    });

  expect(response.status).toBe(302);

  return agent;
}

async function registerUser(overrides = {}) {
  return request(app)
    .post("/register")
    .type("form")
    .send({
      displayName: "New Customer",
      username: "newcustomer",
      email: "newcustomer@example.com",
      password: TEST_PASSWORD,
      ...overrides,
    });
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

describe("POST /register", () => {
  it("registers a user and redirects to the login page", async () => {
    const response = await registerUser();

    expect(response.status).toBe(302);
    expect(response.headers.location).toBe("/login");

    const createdUser = await User.findOne({
      username: "newcustomer",
    });

    expect(createdUser).not.toBeNull();
    expect(createdUser.displayName).toBe("New Customer");
    expect(createdUser.email).toBe("newcustomer@example.com");

    const customerRole = await Role.findOne({ name: "customer" });

    expect(createdUser.role.toString()).toBe(customerRole._id.toString());
    expect(createdUser.passwordHash).not.toBe(TEST_PASSWORD);
    expect(
      await bcrypt.compare(TEST_PASSWORD, createdUser.passwordHash),
    ).toBe(true);
  });

  it("normalizes the registered email address to lowercase", async () => {
    const response = await registerUser({
      email: "  NEWCUSTOMER@EXAMPLE.COM  ",
    });

    expect(response.status).toBe(302);

    const createdUser = await User.findOne({
      username: "newcustomer",
    });

    expect(createdUser.email).toBe("newcustomer@example.com");
  });

  it("rejects registration when required fields are missing", async () => {
    const response = await request(app)
      .post("/register")
      .type("form")
      .send({
        displayName: "",
        username: "",
        email: "",
        password: "",
      });

    expect(response.status).toBe(400);

    const createdUser = await User.findOne({
      username: "newcustomer",
    });

    expect(createdUser).toBeNull();
  });

  it("rejects a duplicate username", async () => {
    const response = await registerUser({
      username: "testcustomer",
    });

    expect(response.status).toBe(400);

    const matchingUsers = await User.countDocuments({
      username: "testcustomer",
    });

    expect(matchingUsers).toBe(1);
  });

  it("rejects a duplicate email address", async () => {
    const response = await registerUser({
      email: "testcustomer@example.com",
    });

    expect(response.status).toBe(400);

    const matchingUsers = await User.countDocuments({
      email: "testcustomer@example.com",
    });

    expect(matchingUsers).toBe(1);
  });
});

describe("PUT /api/users/:id", () => {
  it("returns 401 when an unauthenticated user attempts an update", async () => {
    const response = await request(app)
      .put(`/api/users/${customerUser._id}`)
      .send({ displayName: "Updated Customer" });

    expect(response.status).toBe(401);
  });

  it("allows a customer to update their own permitted profile fields", async () => {
    const agent = await loginAs(customerUser.email);

    const response = await agent
      .put(`/api/users/${customerUser._id}`)
      .send({
        displayName: "Updated Customer",
        email: " UPDATEDCUSTOMER@EXAMPLE.COM ",
      });

    expect(response.status).toBe(200);
    expect(response.body.displayName).toBe("Updated Customer");
    expect(response.body.email).toBe("updatedcustomer@example.com");
    expect(response.body.passwordHash).toBeUndefined();

    const updatedUser = await User.findById(customerUser._id);

    expect(updatedUser.displayName).toBe("Updated Customer");
    expect(updatedUser.email).toBe("updatedcustomer@example.com");
  });

  it("prevents a customer from updating another customer's profile", async () => {
    const agent = await loginAs(customerUser.email);

    const response = await agent
      .put(`/api/users/${otherCustomerUser._id}`)
      .send({ displayName: "Unauthorized Change" });

    expect(response.status).toBe(403);

    const unchangedUser = await User.findById(otherCustomerUser._id);

    expect(unchangedUser.displayName).toBe("Other Customer");
  });

  it("prevents a customer from changing their own role", async () => {
    const agent = await loginAs(customerUser.email);

    const response = await agent
      .put(`/api/users/${customerUser._id}`)
      .send({ role: "admin" });

    expect(response.status).toBe(403);

    const unchangedUser = await User.findById(customerUser._id)
      .populate("role");

    expect(unchangedUser.role.name).toBe("customer");
  });

  it("allows an administrator to update another user's profile", async () => {
    const agent = await loginAs(adminUser.email);

    const response = await agent
      .put(`/api/users/${otherCustomerUser._id}`)
      .send({ displayName: "Admin Updated Customer" });

    expect(response.status).toBe(200);
    expect(response.body.displayName).toBe("Admin Updated Customer");
    expect(response.body.passwordHash).toBeUndefined();

    const updatedUser = await User.findById(otherCustomerUser._id);

    expect(updatedUser.displayName).toBe("Admin Updated Customer");
  });

  it("allows an administrator to change another user's role", async () => {
    const agent = await loginAs(adminUser.email);

    const response = await agent
      .put(`/api/users/${otherCustomerUser._id}`)
      .send({ role: "admin" });

    expect(response.status).toBe(200);
    expect(response.body.role.name).toBe("admin");

    const updatedUser = await User.findById(otherCustomerUser._id)
      .populate("role");

    expect(updatedUser.role.name).toBe("admin");
  });

  it("returns 400 for a malformed user ID", async () => {
    const agent = await loginAs(adminUser.email);

    const response = await agent
      .put("/api/users/not-a-valid-id")
      .send({ displayName: "Updated Name" });

    expect(response.status).toBe(400);
  });

  it("returns 404 when the user does not exist", async () => {
    const agent = await loginAs(adminUser.email);
    const missingId = new mongoose.Types.ObjectId().toString();

    const response = await agent
      .put(`/api/users/${missingId}`)
      .send({ displayName: "Updated Name" });

    expect(response.status).toBe(404);
  });

  it("returns 409 when an update uses an existing username", async () => {
    const agent = await loginAs(adminUser.email);

    const response = await agent
      .put(`/api/users/${otherCustomerUser._id}`)
      .send({ username: "testcustomer" });

    expect(response.status).toBe(409);

    const unchangedUser = await User.findById(otherCustomerUser._id);

    expect(unchangedUser.username).toBe("othercustomer");
  });

  it("returns 409 when an update uses an existing email address", async () => {
    const agent = await loginAs(adminUser.email);

    const response = await agent
      .put(`/api/users/${otherCustomerUser._id}`)
      .send({ email: "testcustomer@example.com" });

    expect(response.status).toBe(409);

    const unchangedUser = await User.findById(otherCustomerUser._id);

    expect(unchangedUser.email).toBe("othercustomer@example.com");
  });
});

describe("DELETE /api/users/:id", () => {
  it("returns 401 when an unauthenticated user attempts deletion", async () => {
    const response = await request(app)
      .delete(`/api/users/${customerUser._id}`);

    expect(response.status).toBe(401);

    expect(
      await User.findById(customerUser._id),
    ).not.toBeNull();
  });

  it("allows a customer to delete their own account", async () => {
    const agent = await loginAs(customerUser.email);

    const response = await agent.delete(
      `/api/users/${customerUser._id}`,
    );

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("User deleted successfully");

    expect(
      await User.findById(customerUser._id),
    ).toBeNull();
  });

  it("prevents a customer from deleting another customer's account", async () => {
    const agent = await loginAs(customerUser.email);

    const response = await agent.delete(
      `/api/users/${otherCustomerUser._id}`,
    );

    expect(response.status).toBe(403);

    expect(
      await User.findById(otherCustomerUser._id),
    ).not.toBeNull();
  });

  it("allows an administrator to delete another user's account", async () => {
    const agent = await loginAs(adminUser.email);

    const response = await agent.delete(
      `/api/users/${otherCustomerUser._id}`,
    );

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("User deleted successfully");

    expect(
      await User.findById(otherCustomerUser._id),
    ).toBeNull();
  });

  it("returns 400 for a malformed user ID", async () => {
    const agent = await loginAs(adminUser.email);

    const response = await agent.delete(
      "/api/users/not-a-valid-id",
    );

    expect(response.status).toBe(400);
  });

  it("returns 404 when the user to delete does not exist", async () => {
    const agent = await loginAs(adminUser.email);
    const missingId = new mongoose.Types.ObjectId().toString();

    const response = await agent.delete(
      `/api/users/${missingId}`,
    );

    expect(response.status).toBe(404);
  });
});
