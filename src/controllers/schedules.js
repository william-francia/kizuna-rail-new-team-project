import {
    getSchedulesByTripId as findSchedulesByTripId
} from '../models/schedules.js';

export async function getSchedulesForTrip(req, res) {
    try {
        const { id } = req.params;

        const schedules = await findSchedulesByTripId(id);

        if (schedules === null) {
            return res.status(404).json({
                error: 'Trip not found'
            });
        }

        return res.status(200).json(schedules);
    } catch (error) {
        console.error('Error fetching schedules:', error);

        return res.status(500).json({
            error: 'Failed to fetch schedules'
        });
    }
}

export async function getSchedulesForTripAndMonth(req, res) {
    try {
        const { id } = req.params;
        const month = Number(req.query.month);

        if (!Number.isInteger(month) || month < 1 || month > 12) {
            return res.status(400).json({
                error: 'Month must be an integer from 1 to 12'
            });
        }

        const schedules = await findSchedulesByTripId(id, month);

        if (schedules === null) {
            return res.status(404).json({
                error: 'Trip not found'
            });
        }

        return res.status(200).json(schedules);
    } catch (error) {
        console.error('Error fetching schedules for month:', error);

        return res.status(500).json({
            error: 'Failed to fetch schedules'
        });
    }
}