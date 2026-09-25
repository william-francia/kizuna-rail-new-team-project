import "dotenv/config";
import mongoose from "mongoose";
import Role from "../src/models/schemas/roles.js";

const roleNames = ["customer", "admin"];

async function seedAuthRoles() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    await Promise.all(
      roleNames.map((name) =>
        Role.updateOne({ name }, { $setOnInsert: { name } }, { upsert: true }),
      ),
    );

    console.log("Auth roles initialized: customer, admin");
  } catch (error) {
    console.error("Failed to initialize auth roles:", error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

seedAuthRoles();
