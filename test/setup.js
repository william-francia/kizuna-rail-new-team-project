import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import Path from "path";

let mongoServer;

process.env.SESSION_SECRET = "test-session-secret";

process.env.MONGOMS_DOWNLOAD_DIR = Path.join(
  process.cwd(),
  ".cache",
  "mongodb-binaries",
);

export async function setupTestDatabase() {
  mongoServer = await MongoMemoryServer.create();

  const mongoUri = mongoServer.getUri();

  await mongoose.connect(mongoUri);
}

export async function clearTestDatabase() {
  const collections = mongoose.connection.collections;

  for (const collection of Object.values(collections)) {
    await collection.deleteMany({});
  }
}

export async function teardownTestDatabase() {
  await mongoose.disconnect();

  if (mongoServer) {
    await mongoServer.stop();
  }
}
