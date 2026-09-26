import { getAllRoutes, getRouteById } from '../models/model.js';

export default async function routeDetails(req, res, next) {
    try {
        const { id } = req.params;

        const routes = (await getAllRoutes()) || [];

        const details = getRouteById(routes, id);

        if (!details) {
            const err = new Error('Route Not Found');
            err.status = 404;
            return next(err);
        }

        res.render('routes/details', {
            title: details.name,
            details
        });
    } catch (error) {
        next(error);
    }
}