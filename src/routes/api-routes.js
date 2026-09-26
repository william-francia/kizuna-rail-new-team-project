import express from 'express';
import { getAllStations, getStationById } from '../controllers/stations.js';

const router = express.Router();

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
router.get('/stations', getAllStations);

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
router.get('/stations/:id', getStationById);

export default router;