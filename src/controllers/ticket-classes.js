import {
  getAllTicketClasses as findAllTicketClasses,
  getTicketClassesForDay as findTicketClassesForDay,
} from "../models/ticket-classes.js";

const validDays = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

export async function getAllTicketClasses(req, res) {
  try {
    const ticketClasses = await findAllTicketClasses();

    return res.status(200).json(ticketClasses);
  } catch (error) {
    console.error("Error fetching ticket classes:", error);

    return res.status(500).json({
      error: "Failed to fetch ticket classes",
    });
  }
}

export async function getTicketClassesForDay(req, res) {
  try {
    const { day } = req.query;
    const normalizedDay = day?.toLowerCase();

    if (!normalizedDay || !validDays.includes(normalizedDay)) {
      return res.status(400).json({
        error: "Invalid day",
      });
    }

    const ticketClasses = await findTicketClassesForDay(normalizedDay);

    return res.status(200).json(ticketClasses);
  } catch (error) {
    console.error("Error fetching ticket classes for day:", error);

    return res.status(500).json({
      error: "Failed to fetch ticket classes for day",
    });
  }
}
