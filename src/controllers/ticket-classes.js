import {
  getAllTicketClasses as findAllTicketClasses,
  getTicketClassesForDay as findTicketClassesForDay,
} from "../models/ticket-classes.js";

/**
 * @swagger
 * /api/ticket-classes:
 *   get:
 *     summary: Get all ticket classes
 *     tags:
 *       - Ticket Classes
 *     responses:
 *       200:
 *         description: List of all ticket classes
 *       500:
 *         description: Server error
 */
export async function getAllTicketClasses(req, res) {
  try {
    const ticketClasses = await findAllTicketClasses();

    return res.status(200).json(ticketClasses);
  } catch (error) {
    console.error("Error fetching ticket classes:", error);

    return res.status(500).json({
      error: "Failed to fetch ticket classes",
    });
  }
}

/**
 * @swagger
 * /api/ticket-classes:
 *   get:
 *     summary: Get ticket classes available for a specific day
 *     tags:
 *       - Ticket Classes
 *     parameters:
 *       - in: query
 *         name: day
 *         required: true
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
 *         description: Day of the week
 *     responses:
 *       200:
 *         description: List of ticket classes available on the specified day
 *       400:
 *         description: Day is required
 *       500:
 *         description: Server error
 */
export async function getTicketClassesForDay(req, res) {
  try {
    const { day } = req.query;

    if (!day) {
      return res.status(400).json({
        error: "Day is required",
      });
    }

    const ticketClasses = await findTicketClassesForDay(day);

    return res.status(200).json(ticketClasses);
  } catch (error) {
    console.error("Error fetching ticket classes for day:", error);

    return res.status(500).json({
      error: "Failed to fetch ticket classes for day",
    });
  }
}
