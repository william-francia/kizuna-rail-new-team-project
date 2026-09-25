import Route from './schemas/route.js';
import Station from './schemas/station.js';
import Schedule from './schemas/schedules.js';
import TicketClass from './schemas/ticket-classes.js';
import Train from './schemas/train.js';

// ROUTE MODEL FUNCTIONS

export const getAllRoutes = async () => {
    return await Route.find();
};

export const getListOfRegions = async () => {
    const regions = await Route.distinct('region');
    return regions;
};

export const getListOfSeasons = async () => {
    const seasons = await Route.distinct('bestSeason');
    return seasons;
};

export const getRouteById = async (routeId) => {
    return await Route.findOne({ id: routeId });
};

export const getRoutesByRegion = async (region) => {
    return await Route.find({
        region: { $regex: `^${region}$`, $options: 'i' }
    });
};

export const getRoutesBySeason = async (season) => {
    return await Route.find({
        bestSeason: { $regex: `^${season}$`, $options: 'i' }
    });
};

export const getRoutesByMonth = async (month) => {
    return await Route.find({
        operatingMonths: month
    });
};

export const getRoutesByDuration = async () => {
    const routes = await Route.find();

    return routes.sort((a, b) => {
        const aDuration = parseFloat(a.duration);
        const bDuration = parseFloat(b.duration);
        return aDuration - bDuration;
    });
};

export const getRoutesByDistance = async () => {
    return await Route.find().sort({ distance: 1 });
};

// STATION MODEL FUNCTIONS

export const getAllStations = async () => {
    return await Station.find();
};

export const getStationById = async (stationId) => {
    return await Station.findOne({ id: stationId });
};

export const getStationsByRegion = async (region) => {
    return await Station.find({
        region: { $regex: `^${region}$`, $options: 'i' }
    });
};

export const getStationsByPrefecture = async (prefecture) => {
    return await Station.find({
        prefecture: { $regex: `^${prefecture}$`, $options: 'i' }
    });
};

export const getStationsByFacility = async (facility) => {
    return await Station.find({
        facilities: facility
    });
};

// SCHEDULE MODEL FUNCTIONS

export const getAllSchedules = async () => {
    return await Schedule.find();
};

export const getScheduleById = async (scheduleId) => {
    return await Schedule.findOne({ id: scheduleId });
};

export const getSchedulesByRoute = async (routeId) => {
    return await Schedule.find({ routeId: routeId });
};

export const getAvailableSchedulesByRoute = async (routeId) => {
    return await Schedule.find({
        routeId: routeId,
        status: true
    });
};

export const getSchedulesByDay = async (day) => {
    return await Schedule.find({
        daysOfWeek: day.toLowerCase()
    });
};

export const getSchedulesByDepartureTime = async () => {
    return await Schedule.find().sort({ departureTime: 1 });
};

// TICKET CLASS MODEL FUNCTIONS

export const getAllTicketClasses = async () => {
    return await TicketClass.find();
};

export const getTicketClassByName = async (className) => {
    return await TicketClass.findOne({
        class: { $regex: `^${className}$`, $options: 'i' }
    });
};

export const getTicketClassesByPrice = async () => {
    return await TicketClass.find().sort({ pricePerKm: 1 });
};

// COMBINED/UTILITY MODEL FUNCTIONS

export const getRouteWithStations = async (routeId) => {
    const route = await getRouteById(routeId);
    if (!route) return null;

    const startStation = await getStationById(route.startStation);
    const endStation = await getStationById(route.endStation);

    return {
        ...route.toObject(),
        startStationDetails: startStation,
        endStationDetails: endStation
    };
};

export const getRouteWithSchedules = async (routeId) => {
    const route = await getRouteById(routeId);
    if (!route) return null;

    const routeSchedules = await getSchedulesByRoute(routeId);

    return {
        ...route.toObject(),
        schedules: routeSchedules
    };
};

export const getCompleteRouteDetails = async (routeId) => {
    const route = await getRouteById(routeId);
    if (!route) return null;

    const startStation = await getStationById(route.startStation);
    const endStation = await getStationById(route.endStation);
    const routeSchedules = await getSchedulesByRoute(routeId);

    return {
        ...route.toObject(),
        startStationDetails: startStation,
        endStationDetails: endStation,
        schedules: routeSchedules
    };
};

export const calculateTicketPrice = async (routeId, className) => {
    const route = await getRouteById(routeId);
    const ticketClass = await getTicketClassByName(className);

    if (!route || !ticketClass) return null;

    return route.distance * ticketClass.pricePerKm;
};

export const getTicketOptionsForRoute = async (routeId) => {
    const route = await getRouteById(routeId);
    if (!route) return null;

    const ticketClasses = await getAllTicketClasses();

    return ticketClasses.map(tc => ({
        class: tc.class,
        name: tc.name,
        price: route.distance * tc.pricePerKm,
        amenities: tc.amenities,
        description: tc.description
    }));
};

export const getTicketOptionsForSchedule = async (scheduleId) => {
    const schedule = await getScheduleById(scheduleId);
    if (!schedule) return null;

    return getTicketOptionsForRoute(schedule.routeId);
};

export const isRouteOperating = async (routeId) => {
    const route = await getRouteById(routeId);
    if (!route) return false;

    const currentMonth = new Date().getMonth() + 1;

    return route.operatingMonths.includes(currentMonth);
};

export const getScheduleWithRoute = async (scheduleId) => {
    const schedule = await getScheduleById(scheduleId);
    if (!schedule) return null;

    const route = await getRouteById(schedule.routeId);

    return {
        ...schedule.toObject(),
        routeDetails: route
    };
};

export const searchRoutes = async (keyword) => {
    const searchTerm = keyword.toLowerCase();

    return await Route.find({
        $or: [
            { name: { $regex: searchTerm, $options: 'i' } },
            { description: { $regex: searchTerm, $options: 'i' } },
            { highlights: { $regex: searchTerm, $options: 'i' } }
        ]
    });
};
