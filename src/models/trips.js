import Trip from "./schemas/trips.js";
import Schedule from "./schemas/schedule.js";

export async function getTripById(id) {
  return Trip.findOne({ id }).lean();
}

export async function getAllTrips() {
  return Trip.find({}).lean();
}

export async function getSchedulesByRoute(routeId) {
  return Schedule.find({ routeId }).lean();
}
