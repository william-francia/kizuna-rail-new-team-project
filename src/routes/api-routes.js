import { Router } from "express";
import { getPaginatedTicketClasses } from "../controllers/ticket-classes.js";

import {
  getAllBookings,
  updateBooking,
  deleteBooking,
} from "../controllers/bookings.js";
import {
  createTrip,
  deleteTrip,
  getAllTrips,
  getTripById,
  updateTrip,
} from "../controllers/trips.js";
import {
  getSchedulesForTrip,
  getSchedulesForTripAndMonth,
} from "../controllers/schedules.js";
import { getAllStations, getStationById } from "../controllers/stations.js";
import {
  getUsers,
  getUserByIdApi,
  updateUserById,
  deleteUserById,
} from "../controllers/users.js";
import { requireApiLogin, requireApiRole } from "../middleware/auth.js";

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
 * /api/bookings:
 *   get:
 *     summary: Get a page of bookings visible to the current user
 *     tags: [Bookings]
 *     description: "Admins page through every booking. Standard users page through bookings where their email matches a passenger. Sorted by booking date, newest first. Optional filters include ticket class and booking date range."
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: 1-based page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 10
 *         description: Bookings per page
 *       - in: query
 *         name: ticketClass
 *         schema:
 *           type: string
 *         description: Only bookings with this ticket class (case-insensitive)
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *         description: Only bookings made on or after this date (YYYY-MM-DD or ISO date-time)
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *         description: Only bookings made on or before this date (YYYY-MM-DD or ISO date-time)
 *     responses:
 *       200:
 *         description: One page of bookings.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 bookings:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Booking'
 *                 page:
 *                   type: integer
 *                 limit:
 *                   type: integer
 *                 total:
 *                   type: integer
 *                 totalPages:
 *                   type: integer
 *       400:
 *         description: Invalid date, or "from" is after "to".
 *       401:
 *         description: Not authenticated.
 *       500:
 *         description: Failed to fetch bookings.
 */
router.get("/bookings", requireApiLogin, getAllBookings);

/**
 * @swagger
 * /api/bookings/{id}:
 *   put:
 *     summary: Update a booking
 *     tags: [Bookings]
 *     description: Standard users may only update bookings where they are a passenger. Admins may update any booking.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The booking's custom string ID (e.g. JR8K2M4XQ)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               ticketClass:
 *                 type: string
 *               selectedDay:
 *                 type: string
 *               passengers:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       200:
 *         description: Booking updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Booking'
 *       400:
 *         description: Invalid booking data.
 *       401:
 *         description: Not authenticated.
 *       403:
 *         description: Not authorized to update this booking.
 *       404:
 *         description: Booking not found.
 */
router.put("/bookings/:id", requireApiLogin, updateBooking);

/**
 * @swagger
 * /api/bookings/{id}:
 *   delete:
 *     summary: Delete a booking
 *     tags: [Bookings]
 *     description: Standard users may only delete bookings where they are a passenger. Admins may delete any booking.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The booking's custom string ID (e.g. JR8K2M4XQ)
 *     responses:
 *       200:
 *         description: Booking deleted successfully.
 *       401:
 *         description: Not authenticated.
 *       403:
 *         description: Not authorized to delete this booking.
 *       404:
 *         description: Booking not found.
 */
router.delete("/bookings/:id", requireApiLogin, deleteBooking);

/**
 * @swagger
 * /api/ticket-classes:
 *   get:
 *     summary: Get paginated and searchable ticket classes
 *     description: Returns ticket classes with pagination, optional search, and optional day filtering.
 *     tags:
 *       - Ticket Classes
 *     parameters:
 *       - in: query
 *         name: page
 *         required: false
 *         description: Page number. Must be a positive integer.
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *           example: 1
 *       - in: query
 *         name: limit
 *         required: false
 *         description: Number of ticket classes per page. Must be between 1 and 10.
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 10
 *           default: 10
 *           example: 10
 *       - in: query
 *         name: search
 *         required: false
 *         description: Case-insensitive search by ticket class or name. Partial matches are supported.
 *         schema:
 *           type: string
 *           maxLength: 50
 *           example: premium
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
 *         description: Paginated ticket classes retrieved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   description: Ticket classes matching the search and day filters for the requested page.
 *                   items:
 *                     type: object
 *                 metadata:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                       example: 3
 *                     page:
 *                       type: integer
 *                       example: 1
 *                     limit:
 *                       type: integer
 *                       example: 10
 *                     totalPages:
 *                       type: integer
 *                       example: 1
 *       400:
 *         description: Invalid page, limit, search, or day.
 *       500:
 *         description: Server error.
 */
router.get("/ticket-classes", getPaginatedTicketClasses);

/**
 * @swagger
 * /api/trips:
 *   get:
 *     summary: Get a paginated list of trips
 *     tags:
 *       - Trips
 *     parameters:
 *       - in: query
 *         name: page
 *         required: false
 *         description: Positive page number. Defaults to 1.
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: region
 *         required: false
 *         description: Exact region value from meta.availableFilters.regions.
 *         schema:
 *           type: string
 *       - in: query
 *         name: season
 *         required: false
 *         description: Exact bestSeason value from meta.availableFilters.seasons.
 *         schema:
 *           type: string
 *       - in: query
 *         name: search
 *         required: false
 *         description: Case-insensitive partial match against trip name or description. Blank values are ignored.
 *         schema:
 *           type: string
 *           maxLength: 100
 *     responses:
 *       200:
 *         description: A page containing up to 10 trips.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - results
 *                 - meta
 *               properties:
 *                 results:
 *                   type: array
 *                   maxItems: 10
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       description:
 *                         type: string
 *                       region:
 *                         type: string
 *                       bestSeason:
 *                         type: string
 *                 meta:
 *                   type: object
 *                   required:
 *                     - page
 *                     - perPage
 *                     - totalItems
 *                     - totalPages
 *                     - hasNextPage
 *                     - hasPreviousPage
 *                     - filters
 *                     - availableFilters
 *                   properties:
 *                     page:
 *                       type: integer
 *                       example: 1
 *                     perPage:
 *                       type: integer
 *                       example: 10
 *                     totalItems:
 *                       type: integer
 *                       example: 11
 *                     totalPages:
 *                       type: integer
 *                       example: 2
 *                     hasNextPage:
 *                       type: boolean
 *                       example: true
 *                     hasPreviousPage:
 *                       type: boolean
 *                       example: false
 *                     filters:
 *                       type: object
 *                       required:
 *                         - search
 *                         - region
 *                         - season
 *                       properties:
 *                         search:
 *                           type: string
 *                           nullable: true
 *                           example: alpine
 *                         region:
 *                           type: string
 *                           nullable: true
 *                           example: central
 *                         season:
 *                           type: string
 *                           nullable: true
 *                           example: autumn
 *                     availableFilters:
 *                       type: object
 *                       required:
 *                         - regions
 *                         - seasons
 *                       properties:
 *                         regions:
 *                           type: array
 *                           items:
 *                             type: string
 *                           example: [central, kansa, kansai, northern]
 *                         seasons:
 *                           type: array
 *                           items:
 *                             type: string
 *                           example: [autumn, spring, summer, winter]
 *       400:
 *         description: The page parameter or one or more filters are invalid.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - error
 *                 - details
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Invalid trip filters
 *                 details:
 *                   type: array
 *                   items:
 *                     type: object
 *                     required:
 *                       - field
 *                       - message
 *                     properties:
 *                       field:
 *                         type: string
 *                         example: region
 *                       message:
 *                         type: string
 *                         example: "Unknown region filter: unknown"
 *       500:
 *         description: Failed to fetch trips
 */
router.get("/trips", getAllTrips);
router.post("/trips", requireApiRole("admin"), createTrip);

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
router.put("/trips/:id", requireApiRole("admin"), updateTrip);
router.delete("/trips/:id", requireApiRole("admin"), deleteTrip);

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
 *           description: Timestamp when the record was updated
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
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Station'
 *       404:
 *         description: Station not found
 *       500:
 *         description: Internal server error
 */
router.get("/stations/:id", getStationById);

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get paginated users with optional filtering and keyword search
 *     description: Returns a paginated list of users for administrators. Users can be filtered by role and searched by display name, username, or email address.
 *     tags: [Users]
 *     parameters:
 *       - in: query
 *         name: page
 *         required: false
 *         description: Page number to retrieve.
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         required: false
 *         description: Number of users to return per page.
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 10
 *       - in: query
 *         name: sort
 *         required: false
 *         description: Field used to sort the user list.
 *         schema:
 *           type: string
 *           enum:
 *             - username
 *             - displayName
 *             - email
 *           default: username
 *       - in: query
 *         name: role
 *         required: false
 *         description: Filter users by role.
 *         schema:
 *           type: string
 *           enum:
 *             - admin
 *             - customer
 *       - in: query
 *         name: keyword
 *         required: false
 *         description: Search display names, usernames, and email addresses.
 *         schema:
 *           type: string
 *           maxLength: 100
 *     responses:
 *       200:
 *         description: Paginated users retrieved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       displayName:
 *                         type: string
 *                       username:
 *                         type: string
 *                       email:
 *                         type: string
 *                       role:
 *                         type: object
 *                         properties:
 *                           name:
 *                             type: string
 *                 metadata:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     totalItems:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *                     sort:
 *                       type: string
 *                     role:
 *                       type: string
 *                       nullable: true
 *                     keyword:
 *                       type: string
 *                       nullable: true
 *       400:
 *         description: Invalid pagination, sorting, role, or keyword parameters.
 *       401:
 *         description: Not authenticated.
 *       403:
 *         description: Administrator access required.
 *       500:
 *         description: Failed to fetch users.
 */

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Get one user by ID
 *     description: Returns a single user for administrators. Password hashes and other private authentication data are not exposed.
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: MongoDB ObjectId of the user.
 *         schema:
 *           type: string
 *           example: 507f1f77bcf86cd799439011
 *     responses:
 *       200:
 *         description: User retrieved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                 displayName:
 *                   type: string
 *                 username:
 *                   type: string
 *                 email:
 *                   type: string
 *                 role:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *       400:
 *         description: Invalid user ID.
 *       401:
 *         description: Not authenticated.
 *       403:
 *         description: Administrator access required.
 *       404:
 *         description: User not found.
 *       500:
 *         description: Failed to fetch user.
 */

router.get("/users", requireApiRole("admin"), getUsers);
router.get("/users/:id", requireApiRole("admin"), getUserByIdApi);
router.put("/users/:id", requireApiLogin, updateUserById);
router.delete("/users/:id", requireApiLogin, deleteUserById);

export default router;
