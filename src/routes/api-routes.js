import { Router } from "express";
import {
  getAllTicketClasses,
  getTicketClassesForDay,
} from "../controllers/ticket-classes.js";

const router = Router();

/**
 * @swagger
 * /api/ticket-classes:
 *   get:
 *     summary: Get ticket classes
 *     description: Returns all ticket classes or filters them by day.
 *     parameters:
 *       - in: query
 *         name: day
 *         required: false
 *         description: Day of the week used to filter available ticket classes.
 *         schema:
 *           type: string
 *           example: monday
 *     responses:
 *       200:
 *         description: Ticket classes retrieved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   class:
 *                     type: string
 *                     example: standard
 *                   name:
 *                     type: string
 *                     example: Standard Class
 *                   pricePerKm:
 *                     type: number
 *                     example: 80
 *                   amenities:
 *                     type: array
 *                     items:
 *                       type: string
 *                     example:
 *                       - Comfortable seats
 *                       - Large windows
 *                       - Complimentary tea
 *                   description:
 *                     type: string
 *                     example: Enjoy scenic views from comfortable seats with complimentary refreshments
 *                   availableDays:
 *                     type: array
 *                     items:
 *                       type: string
 *                     example:
 *                       - monday
 *                       - tuesday
 *                       - wednesday
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

export default router;
