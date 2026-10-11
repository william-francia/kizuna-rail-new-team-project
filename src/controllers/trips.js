import {
  getTripById as findTripById,
  createTrip as createTripModel,
  getTripsPage as findTripsPage,
  getTripFilterOptions as findTripFilterOptions,
  updateTripById as updateTripModel,
  deleteTripById as deleteTripModel,
} from "../models/trips.js";

export const TRIPS_PER_PAGE = 10;
export const MAX_SEARCH_LENGTH = 100;

export function parseTripPage(value) {
  if (value === undefined) {
    return 1;
  }

  if (typeof value !== "string" || !/^\d+$/.test(value)) {
    return null;
  }

  const page = Number(value);
  return Number.isSafeInteger(page) && page > 0 ? page : null;
}

export function parseTripFilters(query) {
  const errors = [];
  const parseExactFilter = (value, field) => {
    if (value === undefined) {
      return null;
    }

    if (typeof value !== "string" || value.length === 0) {
      errors.push({
        field,
        message: `${field} must be a single, non-empty string`,
      });
      return null;
    }

    return value;
  };

  const region = parseExactFilter(query.region, "region");
  const season = parseExactFilter(query.season, "season");
  let search = null;

  if (query.search !== undefined) {
    if (typeof query.search !== "string") {
      errors.push({
        field: "search",
        message: "search must be a single string",
      });
    } else {
      const trimmedSearch = query.search.trim();

      if (trimmedSearch.length > MAX_SEARCH_LENGTH) {
        errors.push({
          field: "search",
          message: `search must be ${MAX_SEARCH_LENGTH} characters or fewer`,
        });
      } else if (trimmedSearch.length > 0) {
        search = trimmedSearch;
      }
    }
  }

  return {
    filters: { search, region, season },
    errors,
  };
}

export function createGetAllTrips(
  findPage = findTripsPage,
  findFilterOptions = findTripFilterOptions,
) {
  return async function getAllTrips(req, res) {
    const page = parseTripPage(req.query.page);

    if (page === null) {
      return res.status(400).json({
        error: "Invalid page parameter",
        details: [
          {
            field: "page",
            message: "page must be a positive integer",
          },
        ],
      });
    }

    const { filters, errors } = parseTripFilters(req.query);

    if (errors.length > 0) {
      return res.status(400).json({
        error: "Invalid trip filters",
        details: errors,
      });
    }

    try {
      const availableFilters = await findFilterOptions();
      const unknownFilters = [];

      if (filters.region && !availableFilters.regions.includes(filters.region)) {
        unknownFilters.push({
          field: "region",
          message: `Unknown region filter: ${filters.region}`,
        });
      }

      if (filters.season && !availableFilters.seasons.includes(filters.season)) {
        unknownFilters.push({
          field: "season",
          message: `Unknown season filter: ${filters.season}`,
        });
      }

      if (unknownFilters.length > 0) {
        return res.status(400).json({
          error: "Invalid trip filters",
          details: unknownFilters,
        });
      }

      const { results, totalItems } = await findPage(
        page,
        TRIPS_PER_PAGE,
        filters,
      );
      const totalPages = Math.ceil(totalItems / TRIPS_PER_PAGE);

      return res.status(200).json({
        results,
        meta: {
          page,
          perPage: TRIPS_PER_PAGE,
          totalItems,
          totalPages,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1 && totalPages > 0,
          filters,
          availableFilters,
        },
      });
    } catch (error) {
      console.error("Error fetching trips:", error);

      return res.status(500).json({
        error: "Failed to fetch trips",
      });
    }
  };
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

export const getAllTrips = createGetAllTrips();

export async function createTrip(req, res) {
  const {
    id,
    name,
    description,
    region,
    startStation,
    endStation,
    duration,
    distance,
    highlights,
    bestSeason,
    operatingMonths,
    imageUrl,
  } = req.body;

  try {
    const trip = await createTripModel({
      id,
      name,
      description,
      region,
      startStation,
      endStation,
      duration,
      distance,
      highlights,
      bestSeason,
      operatingMonths,
      imageUrl,
    });

    return res.status(201).json(trip);
  } catch (error) {
    if (error.name === "ValidationError" || error.name === "CastError") {
      return res.status(400).json({ message: "Invalid trip data" });
    }

    if (error.code === 11000) {
      return res.status(409).json({ message: "Trip ID already exists" });
    }

    console.error("Error creating trip:", error);
    return res.status(500).json({ message: "Server error creating trip" });
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
