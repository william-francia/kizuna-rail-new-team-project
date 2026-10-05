import {
  getTripById as findTripById,
  getAllTrips as findAllTrips,
  updateTripById as updateTripModel,
  deleteTripById as deleteTripModel, countAllTrips,
} from "../models/trips.js";


function parsePositiveInteger(value, defaultValue) {
  if (value === undefined || value === null || value === "") {
    return defaultValue;
  }

  const parsed = Number(value);

  if (Number.isNaN(parsed) || !Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
}

export async function getTripById(req, res) {
  try {
    const { id } = req.params;
    const trip = await findTripById(id);

    if (!trip) {
      return res.status(404).json({
        error: "Trip not found",
      });
    }

    return res.status(200).json(trip);
  } catch (error) {
    console.error("Error fetching trip:", error);

    return res.status(500).json({
      error: "Failed to fetch trip",
    });
  }
}

export async function getAllTrips(req, res) {
  try {
    const pageParam = req.query.page !== undefined ? req.query.page : "1";
    const limitParam = req.query.limit !== undefined ? req.query.limit : "10";

    const page = parsePositiveInteger(pageParam, 1);
    const limit = parsePositiveInteger(limitParam, 10);

    if (page === null || limit === null) {
      return res.status(400).json({
        error: "Invalid pagination parameters. 'page' and 'limit' must be positive integers.",
      });
    }

    const skip = (page - 1) * limit;

    const [trips, totalItems] = await Promise.all([
      findAllTrips({ skip, limit }),
      countAllTrips(),
    ]);

    const totalPages = Math.ceil(totalItems / limit) || 1;

    return res.status(200).json({
      trips,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems,
        limit,
      },
    });
  } catch (error) {
    console.error("Error fetching trips:", error);

    return res.status(500).json({
      error: "Failed to fetch trips",
    });
  }
}

export async function renderTripListPage(req, res) {
  return res.render("routes/list", {
    title: "Scenic Train Routes",
  });
}

export async function renderTripDetailsPage(req, res) {
  try {
    const { routeId } = req.params;
    const details = await findTripById(routeId);

    if (!details) {
      return res.status(404).render("errors/404", {
        title: "Page Not Found",
        error: "Trip not found.",
      });
    }

    return res.render("routes/details", {
      title: "Route Details",
      details,
    });
  } catch (error) {
    console.error("Error rendering trip details:", error);

    return res.status(500).render("errors/500", {
      title: "Server Error",
      error: "Unable to load trip details.",
      stack: error.stack,
    });
  }
}

export async function updateTrip(req, res) {
  try {
    const { id } = req.params;
    const { name, region, startStation, endStation, duration, distance } = req.body;

    const distanceNum = Number(distance);

    if (
      !name ||
      !region ||
      !startStation ||
      !endStation ||
      !duration ||
      !Number.isFinite(distanceNum) ||
      distanceNum < 0
    ) {
      return res.status(400).json({ message: "Invalid trip data" });
    }

    const updatedTrip = await updateTripModel(id, {
      name,
      region,
      startStation,
      endStation,
      duration,
      distance: distanceNum
    });

    if (!updatedTrip) {
      return res.status(404).json({ message: "Trip not found" });
    }

    return res.json(updatedTrip);
  } catch (error) {
    console.error("Error updating trip:", error);
    return res.status(500).json({ message: "Server error updating trip" });
  }
}




export async function deleteTrip(req, res, next) {
  try {
    const { id } = req.params;

    const deletedTrip = await deleteTripModel(id);

    if (!deletedTrip) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    return res.status(200).json({ message: 'Trip deleted successfully', id });
  } catch (error) {
    next(error);
  }
}
