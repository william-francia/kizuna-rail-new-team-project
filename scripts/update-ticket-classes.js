import "dotenv/config";
import mongoose from "mongoose";
import TicketClass from "../src/models/schemas/ticket-classes.js";

try {
  await mongoose.connect(process.env.MONGODB_URI);

  await TicketClass.updateMany(
    {},
    {
      $set: {
        availableDays: [
          "monday",
          "tuesday",
          "wednesday",
          "thursday",
          "friday",
          "saturday",
          "sunday",
        ],
      },
    },
  );

  console.log("availableDays added successfully");
} catch (error) {
  console.error("Failed to update ticket classes:", error);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
