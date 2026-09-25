import mongoose from "mongoose";
<<<<<<< HEAD
import { generateConfirmationCode } from "../../includes/helpers.js";
=======
import { generateBookingCode } from "../../includes/helpers.js";
>>>>>>> origin/main

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
<<<<<<< HEAD
  },
=======
  }
>>>>>>> origin/main
);

const bookingSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      trim: true,
<<<<<<< HEAD
      default: generateConfirmationCode,
=======
      default: generateBookingCode,
>>>>>>> origin/main
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
<<<<<<< HEAD
  },
=======
  }
>>>>>>> origin/main
);

const Booking = mongoose.model("Booking", bookingSchema);

<<<<<<< HEAD
export default Booking;
=======
export default Booking;
>>>>>>> origin/main
