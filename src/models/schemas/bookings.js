import mongoose from "mongoose";
import { generateConfirmationCode } from "../../includes/helpers.js";

const passengerSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    _id: false,
  },
);

const bookingSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      default: generateConfirmationCode,
    },
    scheduleId: {
      type: String,
      required: true,
      trim: true,
    },
    routeId: {
      type: String,
      required: true,
      trim: true,
    },
    ticketClass: {
      type: String,
      required: true,
      trim: true,
    },
    selectedDay: {
      type: String,
      required: true,
      trim: true,
    },
    passengers: {
      type: [passengerSchema],
      validate: {
        validator: (passengers) =>
          passengers.length >= 1 && passengers.length <= 8,
        message: "A booking needs between 1 and 8 passengers.",
      },
    },
  },
  {
    timestamps: true,
  },
);

const Booking = mongoose.model("Booking", bookingSchema);

export default Booking;
