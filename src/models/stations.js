import Station from './schemas/station.js';

export async function getAllStations() {
    return await Station.find({});
}

export async function getStationById(id) {
    const station = await Station.findOne({ id: id });
    if (!station) {
        return await Station.findById(id);
    }
    return station;
}