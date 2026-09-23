import { getRouteById } from '../models/model.js';

export default async (req, res) => {
    const { routeId } = req.params;

    const details = await getRouteById(routeId);

    // Schedules are loaded later by the client through the API.

    res.render('routes/details', {
        title: 'Route Details',
        details
    });
};