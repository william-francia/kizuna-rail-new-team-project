import mongoose from "mongoose";
import Station from "./schemas/station.js";

export async function getAllStations() {
  return Station.find({});
}

export async function getStationById(id) {
  const station = await Station.findOne({ id });

  if (station) {
    return station;
  }

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return null;
  }

  return Station.findById(id);
}
