import { getAllRoutes, getListOfRegions, getListOfSeasons } from '../models/model.js';

export default async (req, res) => {
    const regions = await getListOfRegions();
    const routes = await getAllRoutes();
    const seasons = await getListOfSeasons();

    res.render('routes/list', { 
        title: 'Scenic Train Routes',
        regions,
        routes,
        seasons
    });
};