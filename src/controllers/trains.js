import {
  getTrainById as findTrainById,
  getAllTrains as findAllTrains,
} from "../models/trains.js";

const allowedSorts = [
  "name-asc",
  "name-desc",
  "speed-asc",
  "speed-desc",
  "capacity-asc",
  "capacity-desc",
];

export async function getTrainById(req, res) {
  try {
    const { id } = req.params;

    const train = await findTrainById(id);

    if (!train) {
      return res.status(404).json({
        error: "Train not found",
      });
    }

    return res.status(200).json(train);
  } catch (error) {
    console.error("Error fetching train:", error);

    return res.status(500).json({
      error: "Failed to fetch train",
    });
  }
}

export async function getAllTrains(req, res) {
  try {
    const {
      page: pageQuery = "1",
      limit: limitQuery = "10",
      search = "",
      sort = "name-asc",
    } = req.query;

    const page = Number(pageQuery);
    const limit = Number(limitQuery);

    if (!Number.isInteger(page) || page < 1) {
      return res.status(400).json({
        error: "Page must be a positive integer.",
      });
    }

    if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
      return res.status(400).json({
        error: "Limit must be an integer between 1 and 100.",
      });
    }

    if (!allowedSorts.includes(sort)) {
      return res.status(400).json({
        error: `Invalid sort value. Allowed values: ${allowedSorts.join(", ")}.`,
      });
    }

    if (typeof search !== "string") {
      return res.status(400).json({
        error: "Search must be a string.",
      });
    }

    const result = await findAllTrains({
      page,
      limit,
      search: search.trim(),
      sort,
    });

    const totalPages = Math.ceil(result.total / limit);

    if (result.total > 0 && page > totalPages) {
      return res.status(400).json({
        error: "Page exceeds the available number of pages.",
        metadata: {
          page,
          limit,
          total: result.total,
          totalPages,
          search: search.trim(),
          sort,
        },
      });
    }

    return res.status(200).json({
      trains: result.trains,
      metadata: {
        page,
        limit,
        total: result.total,
        totalPages,
        search: search.trim(),
        sort,
      },
    });
  } catch (error) {
    console.error("Error fetching trains:", error);

    return res.status(500).json({
      error: "Failed to fetch trains",
    });
  }
}
