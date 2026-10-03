import { Router } from "express";
import {
  getAllTicketClasses,
  getTicketClassesForDay,
} from "../controllers/ticket-classes.js";
import {
  getAllTrips,
  getTripById,
  deleteTrip,
  updateTrip,
} from "../controllers/trips.js";
import { getAllBookings, getMyBookings } from "../controllers/bookings.js";
import {
  getSchedulesForTrip,
  getSchedulesForTripAndMonth,
} from "../controllers/schedules.js";
import { getAllStations, getStationById } from "../controllers/stations.js";
import {
  requireAuth,
  requireAdmin,
  requireApiLogin,
} from "../middleware/auth.js";
import {
  getUsers,
  updateUserById,
  deleteUserById,
} from "../controllers/users.js";
import { getAllTrains, getTrainById } from "../controllers/trains.js";

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Booking:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         id:
 *           type: string
 *           example: JR8K2M4XQ
 *         scheduleId:
 *           type: string
 *         routeId:
 *           type: string
 *         ticketClass:
 *           type: string
 *         selectedDay:
 *           type: string
 *         passengers:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Train:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: "n700"
 *         name:
 *           type: string
 *           example: "N700 Series"
 *         operator:
 *           type: string
 *           example: "JR Central"
 *         imageUrl:
 *           type: string
 *         imageAlt:
 *           type: string
 *         type:
 *           type: string
 *           example: "Shinkansen"
 *         maxSpeedKmh:
 *           type: number
 *           example: 285
 *         capacity:
 *           type: number
 *           example: 1323
 *         powerSource:
 *           type: string
 *           example: "Electric"
 *         bestFor:
 *           type: string
 *           example: "Long-distance travel"
 *         description:
 *           type: string
 */

/**
 * @swagger
 * /api/bookings:
 *   get:
 *     summary: Get all bookings
 *     tags: [Bookings]
 *     responses:
 *       200:
 *         description: A list of bookings, newest first.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Booking'
 *       500:
 *         description: Failed to fetch bookings.
 */
router.get("/bookings", getAllBookings);
router.get("/bookings/me", requireApiLogin, getMyBookings);

/**
 * @swagger
 * /api/ticket-classes:
 *   get:
 *     summary: Get ticket classes
 *     description: Returns all ticket classes or filters them by day.
 *     tags:
 *       - Ticket Classes
 *     parameters:
 *       - in: query
 *         name: day
 *         required: false
 *         description: Day of the week used to filter available ticket classes.
 *         schema:
 *           type: string
 *           enum:
 *             - monday
 *             - tuesday
 *             - wednesday
 *             - thursday
 *             - friday
 *             - saturday
 *             - sunday
 *           example: monday
 *     responses:
 *       200:
 *         description: Ticket classes retrieved successfully.
 *       400:
 *         description: Invalid day.
 *       500:
 *         description: Server error.
 */
router.get("/ticket-classes", async (req, res, next) => {
  try {
    if (req.query.day) {
      return await getTicketClassesForDay(req, res);
    }

    return await getAllTicketClasses(req, res);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * components:
 *   schemas:
 *     Train:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: "n700"
 *         name:
 *           type: string
 *           example: "N700 Series"
 *         operator:
 *           type: string
 *           example: "JR Central"
 *         imageUrl:
 *           type: string
 *         imageAlt:
 *           type: string
 *         type:
 *           type: string
 *           example: "Shinkansen"
 *         maxSpeedKmh:
 *           type: number
 *           example: 285
 *         capacity:
 *           type: number
 *           example: 1323
 *         powerSource:
 *           type: string
 *           example: "Electric"
 *         bestFor:
 *           type: string
 *           example: "Long-distance travel"
 *         description:
 *           type: string
 */

/**
 * @swagger
 * /api/trains:
 *   get:
 *     summary: Get all trains with pagination
 *     tags:
 *       - Trains
 *     parameters:
 *       - in: query
 *         name: page
 *         required: false
 *         description: Page number
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         required: false
 *         description: Number of trains per page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *     responses:
 *       200:
 *         description: Paginated list of trains
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 trains:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Train'
 *                 metadata:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *       400:
 *         description: Invalid pagination parameters
 *       500:
 *         description: Failed to fetch trains
 */
router.get("/trains", getAllTrains);

/**
 * @swagger
 * /api/trains/{id}:
 *   get:
 *     summary: Get one train by ID
 *     tags:
 *       - Trains
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The train ID
 *     responses:
 *       200:
 *         description: The requested train
 *       404:
 *         description: Train not found
 *       500:
 *         description: Failed to fetch train
 */
router.get("/trains/:id", getTrainById);

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
 *     description: Returns schedules for a specific trip. An optional month query parameter can filter the results.
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

/**
 * @swagger
 * /api/trips/{id}:
 *   put:
 *     summary: Update an existing trip (Admin only)
 *     tags: [Trips]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The trip ID (Mongoose ObjectId or string ID)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Hokkaido Shinkansen"
 *               region:
 *                 type: string
 *                 example: "Hokkaido"
 *               startStation:
 *                 type: string
 *                 example: "Shin-Hakodate-Hokuto"
 *               endStation:
 *                 type: string
 *                 example: "Tokyo"
 *               duration:
 *                 type: string
 *                 example: "4h 00m"
 *               distance:
 *                 type: number
 *                 example: 823.7
 *     responses:
 *       200:
 *         description: Trip updated successfully
 *       400:
 *         description: Bad request - Invalid trip data
 *       401:
 *         description: Unauthorized - Authentication required
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Trip not found
 */
router.put("/trips/:id", requireAuth, requireAdmin, updateTrip);

/**
 * @swagger
 * /api/trips/{id}:
 *   delete:
 *     summary: Delete a trip (Admin only)
 *     tags: [Trips]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The trip ID to delete
 *     responses:
 *       200:
 *         description: Trip deleted successfully
 *       401:
 *         description: Unauthorized - Authentication required
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Trip not found
 */
router.delete("/trips/:id", requireAuth, requireAdmin, deleteTrip);

/**
 * @swagger
 * components:
 *   schemas:
 *     Station:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Custom string identifier slug for the station
 *           example: "nagoya"
 *         _id:
 *           type: string
 *           description: MongoDB unique ObjectId string
 *           example: "60d5ecb8b5c9c22b14e15b2a"
 *         name:
 *           type: string
 *           description: Name of the station
 *           example: "Tokyo Station"
 *         prefecture:
 *           type: string
 *           description: Prefecture where the station is located
 *           example: "Tokyo"
 *         region:
 *           type: string
 *           description: Region name
 *           example: "Kanto"
 *         facilities:
 *           type: array
 *           items:
 *             type: string
 *           example: ["WiFi", "Lockers", "Restroom"]
 *         description:
 *           type: string
 *           description: Brief description of the station
 *           example: "Major railway hub in Tokyo."
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp when the record was created
 *           example: "2026-01-15T08:30:00.000Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp when the record was last updated
 *           example: "2026-03-20T14:22:00.000Z"
 */

/**
 * @swagger
 * /api/stations:
 *   get:
 *     summary: Retrieve a list of all stations
 *     tags: [Stations]
 *     responses:
 *       200:
 *         description: A list of stations retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Station'
 *       500:
 *         description: Internal server error
 */
router.get("/stations", getAllStations);

/**
 * @swagger
 * /api/stations/{id}:
 *   get:
 *     summary: Retrieve a single station by ID
 *     tags: [Stations]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Custom station string ID or slug (e.g., 'nagoya')
 *         example: "nagoya"
 *     responses:
 *       200:
 *         description: Station details retrieved successfully
 *       404:
 *         description: Station not found
 *       500:
 *         description: Internal server error
 */
router.get("/stations/:id", getStationById);

router.get("/users", requireApiLogin, getUsers);
router.put("/users/:id", requireApiLogin, updateUserById);
router.delete("/users/:id", requireApiLogin, deleteUserById);

export default router;
