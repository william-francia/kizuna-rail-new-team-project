import * as stationModel from '../models/stations.js';

export async function getAllStations(req, res) {
    try {
        const stations = await stationModel.getAllStations();
        res.status(200).json(stations);
    } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve stations' });
    }
}

export async function getStationById(req, res) {
    try {
        const { id } = req.params;
        const station = await stationModel.getStationById(id);

        if (!station) {
            return res.status(404).json({ error: 'Station not found' });
        }

        res.status(200).json(station);
    } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve station details' });
    }
}