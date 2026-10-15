import { beforeAll, afterAll, beforeEach } from "vitest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

import Station from "../src/models/schemas/station.js";
import Trip from "../src/models/schemas/trips.js";

import stations from "../src/models/seeds/stations.json" with { type: "json" };
import trips from "../src/models/seeds/routes.json" with { type: "json" };

let mongoServer;

process.env.NODE_ENV = "test";
process.env.SESSION_SECRET ||= "test-session-secret";

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();

  await mongoose.connect(mongoServer.getUri());
});

beforeEach(async () => {
  await Station.deleteMany({});
  await Trip.deleteMany({});

  await Station.insertMany(stations);
  await Trip.insertMany(trips);
});

afterAll(async () => {
  await mongoose.disconnect();

  if (mongoServer) {
    await mongoServer.stop();
  }
});
