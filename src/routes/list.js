import { getAllRoutes, getListOfRegions, getListOfSeasons } from '../models/model.js';

export default async (req, res, next) => {
    try {
        const routes = (await getAllRoutes()) || [];
        const regions = getListOfRegions(routes);
        const seasons = getListOfSeasons(routes);

        res.render('routes/list', { 
            title: 'Scenic Train Routes',
            regions,
            routes,
            seasons
        });
    } catch (error) {
        next(error);
    }
};