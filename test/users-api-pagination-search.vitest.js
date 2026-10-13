
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

import app from "../app.js";
import User from "../src/models/schemas/users.js";
import Role from "../src/models/schemas/roles.js";

import {
  setupTestDatabase,
  clearTestDatabase,
  teardownTestDatabase,
} from "./setup.js";

const TEST_PASSWORD = "TestPassword123!";

let adminAgent;

async function loginAsAdmin() {
  const agent = request.agent(app);

  const response = await agent
    .post("/login")
    .type("form")
    .send({
      email: "admin@example.com",
      password: TEST_PASSWORD,
    });

  expect(response.status).toBe(302);

  return agent;
}

async function createTestUsers() {
  const [adminRole, customerRole] = await Promise.all([
    Role.create({ name: "admin" }),
    Role.create({ name: "customer" }),
  ]);

  const passwordHash = await bcrypt.hash(TEST_PASSWORD, 12);

  await User.create([
    {
      displayName: "Admin Account",
      username: "admin",
      email: "admin@example.com",
      passwordHash,
      role: adminRole._id,
    },
    {
      displayName: "Alice Anderson",
      username: "alice",
      email: "alice@example.com",
      passwordHash,
      role: customerRole._id,
    },
    {
      displayName: "Bob Brown",
      username: "bob",
      email: "bob@example.com",
      passwordHash,
      role: customerRole._id,
    },
    {
      displayName: "Charlie Clark",
      username: "charlie",
      email: "charlie@example.com",
      passwordHash,
      role: customerRole._id,
    },
    {
      displayName: "Diana Davis",
      username: "diana",
      email: "diana@example.com",
      passwordHash,
      role: customerRole._id,
    },
    {
      displayName: "Alice Evans",
      username: "aliceevans",
      email: "alice.evans@example.com",
      passwordHash,
      role: customerRole._id,
    },
  ]);
}

beforeAll(async () => {
  await setupTestDatabase();
});

beforeEach(async () => {
  await clearTestDatabase();
  await createTestUsers();
  adminAgent = await loginAsAdmin();
});

afterAll(async () => {
  await teardownTestDatabase();
});

describe("GET /api/users pagination", () => {
  it("returns the requested page and limit", async () => {
    const response = await adminAgent.get("/api/users?page=2&limit=2");

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(2);
    expect(response.body.metadata).toMatchObject({
      page: 2,
      limit: 2,
      totalItems: 6,
      totalPages: 3,
    });
  });

  it("returns the final page when fewer users remain than the limit", async () => {
    const response = await adminAgent.get("/api/users?page=3&limit=2");

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(2);
    expect(response.body.metadata.totalPages).toBe(3);
  });

  it("returns an empty page beyond the available results", async () => {
    const response = await adminAgent.get("/api/users?page=4&limit=2");

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(0);
    expect(response.body.metadata).toMatchObject({
      page: 4,
      limit: 2,
      totalItems: 6,
      totalPages: 3,
    });
  });
});

describe("GET /api/users sorting", () => {
  it.each(["username", "displayName", "email"])(
    "sorts users by %s in ascending order",
    async (sort) => {
      const response = await adminAgent.get(
        `/api/users?sort=${sort}&limit=10`,
      );

      expect(response.status).toBe(200);

      const values = response.body.data.map((user) => user[sort]);
      const sortedValues = [...values].sort((a, b) =>
        a.localeCompare(b, undefined, { sensitivity: "base" }),
      );

      expect(values).toEqual(sortedValues);
      expect(response.body.metadata.sort).toBe(sort);
    },
  );
});

describe("GET /api/users role filtering", () => {
  it("returns only administrators when role=admin", async () => {
    const response = await adminAgent.get("/api/users?role=admin");

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].role.name).toBe("admin");
    expect(response.body.metadata.role).toBe("admin");
    expect(response.body.metadata.totalItems).toBe(1);
  });

  it("returns only customers when role=customer", async () => {
    const response = await adminAgent.get("/api/users?role=customer");

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(5);
    expect(
      response.body.data.every((user) => user.role.name === "customer"),
    ).toBe(true);
    expect(response.body.metadata.totalItems).toBe(5);
  });

  it("returns a validation error for an unsupported role", async () => {
    const response = await adminAgent.get("/api/users?role=manager");

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Invalid role.");
  });
});

describe("GET /api/users keyword search", () => {
  it("searches display names without case sensitivity", async () => {
    const response = await adminAgent.get("/api/users?keyword=ALICE");

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(2);
    expect(
      response.body.data.every((user) =>
        user.displayName.toLowerCase().includes("alice"),
      ),
    ).toBe(true);
    expect(response.body.metadata.keyword).toBe("ALICE");
  });

  it("searches usernames", async () => {
    const response = await adminAgent.get("/api/users?keyword=charlie");

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].username).toBe("charlie");
  });

  it("searches email addresses", async () => {
    const response = await adminAgent.get("/api/users?keyword=alice.evans");

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].email).toBe("alice.evans@example.com");
  });

  it("returns no results when the keyword does not match any user", async () => {
    const response = await adminAgent.get(
      "/api/users?keyword=nomatchinguser",
    );

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(0);
    expect(response.body.metadata).toMatchObject({
      totalItems: 0,
      totalPages: 0,
      keyword: "nomatchinguser",
    });
  });

  it("rejects a keyword longer than 100 characters", async () => {
    const keyword = "a".repeat(101);
    const response = await adminAgent.get(
      `/api/users?keyword=${keyword}`,
    );

    expect(response.status).toBe(400);
    expect(response.body.error).toBe(
      "Keyword must be 100 characters or fewer.",
    );
  });
});

describe("GET /api/users combined filters", () => {
  it("combines role filtering, keyword search, and pagination", async () => {
    const response = await adminAgent.get(
      "/api/users?role=customer&keyword=alice&page=1&limit=1",
    );

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].role.name).toBe("customer");
    expect(response.body.data[0].displayName.toLowerCase()).toContain("alice");
    expect(response.body.metadata).toMatchObject({
      page: 1,
      limit: 1,
      totalItems: 2,
      totalPages: 2,
      role: "customer",
      keyword: "alice",
    });
  });

  it("returns no results when the role and keyword do not match", async () => {
    const response = await adminAgent.get(
      "/api/users?role=admin&keyword=alice",
    );

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(0);
    expect(response.body.metadata.totalItems).toBe(0);
  });
});

describe("GET /api/users query validation", () => {
  it.each(["0", "-1", "1.5", "abc"])(
    "rejects invalid page value %s",
    async (page) => {
      const response = await adminAgent.get(`/api/users?page=${page}`);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Page must be a positive integer.");
    },
  );

  it.each(["0", "-1", "1.5", "abc"])(
    "rejects invalid limit value %s",
    async (limit) => {
      const response = await adminAgent.get(`/api/users?limit=${limit}`);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Limit must be a positive integer.");
    },
  );

  it("rejects an unsupported sort field", async () => {
    const response = await adminAgent.get("/api/users?sort=passwordHash");

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Invalid sort field.");
  });
});
