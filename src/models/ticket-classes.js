import TicketClass from "./schemas/ticket-class.js";

export async function getAllTicketClasses() {
  return TicketClass.find({}).lean();
}

export async function getTicketClassesForDay(day) {
  return TicketClass.find({
    availableDays: day.toLowerCase(),
  }).lean();
}
