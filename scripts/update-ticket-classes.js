import "dotenv/config";
import mongoose from "mongoose";
import TicketClass from "../src/models/schemas/ticket-class.js";

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

console.log("availableDays agregado correctamente");

await mongoose.disconnect();
