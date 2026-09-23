import { Router } from "express";

import {
  getAllTrips,
  getTripById,
} from "../controllers/trips.js";

import {
  getSchedulesForTrip,
  getSchedulesForTripAndMonth,
} from "../controllers/schedules.js";

const router = Router();

/**
 * @swagger
 * /api/trips:
 *   get:
 *     summary: Get all trips
 *     tags:
 *       - Trips
 *     responses:
 *       200:
 *         description: A list of trips
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *       500:
 *         description: Failed to fetch trips
 */
router.get("/trips", getAllTrips);

/**
 * @swagger
 * /api/trips/{id}:
 *   get:
 *     summary: Get one trip by ID
 *     tags:
 *       - Trips
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The trip ID
 *     responses:
 *       200:
 *         description: The requested trip
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       404:
 *         description: Trip not found
 *       500:
 *         description: Failed to fetch trip
 */
router.get("/trips/:id", getTripById);

/**
 * @swagger
 * /api/trips/{id}/schedules:
 *   get:
 *     summary: Get schedules for a trip
 *     description: Returns the schedules for a specific trip. An optional month query parameter can be used to get schedules for a specific month.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The trip ID
 *         schema:
 *           type: string
 *       - in: query
 *         name: month
 *         required: false
 *         description: Month number from 1 to 12
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 12
 *     responses:
 *       200:
 *         description: Schedules returned successfully
 *       400:
 *         description: Invalid month
 *       404:
 *         description: Trip not found
 *       500:
 *         description: Server error
 */
router.get("/trips/:id/schedules", (req, res, next) => {
    if (req.query.month !== undefined) {
        return getSchedulesForTripAndMonth(req, res, next);
    }

    return getSchedulesForTrip(req, res, next);
});

export default router;