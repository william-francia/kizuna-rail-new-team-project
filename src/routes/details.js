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

    const startStationId = details.startStationId
      ? details.startStationId
      : (details.startStation ? details.startStation.toLowerCase().trim() : '');

    const endStationId = details.endStationId
      ? details.endStationId
      : (details.endStation ? details.endStation.toLowerCase().trim() : '');

    const formattedDetails = {
      ...details,
      startStationId,
      endStationId
    };

    res.render('routes/details', {
      title: details.name,
      details: formattedDetails
    });
  } catch (error) {
    next(error);
  }
}