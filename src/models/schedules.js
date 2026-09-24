import Schedule from './schemas/schedules.js';
import Route from './schemas/route.js';

export async function getSchedulesByTripId(tripId, month) {
    // Find the trip/route first
    const route = await Route.findOne({ id: tripId }).lean();

    // Trip does not exist
    if (!route) {
        return null;
    }

    // If a month was provided, check whether the route operates in that month
    if (month !== undefined && !route.operatingMonths.includes(month)) {
        return [];
    }

    // Get schedules belonging to this trip/route
    return Schedule.find({ routeId: tripId })
        .sort({ departureTime: 1 })
        .lean();
}