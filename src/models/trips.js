import mongoose from "mongoose";
import Trip from "./schemas/trips.js";

export async function getTripById(id) {
  return Trip.findOne({ id }).lean();
}

export async function createTrip(tripData) {
  const trip = await Trip.create(tripData);

  return trip.toObject();
}

export function escapeSearchText(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function buildTripQuery(filters = {}) {
  const query = {};

  if (filters.region) {
    query.region = filters.region;
  }

  if (filters.season) {
    query.bestSeason = filters.season;
  }

  if (filters.search) {
    const escapedSearch = escapeSearchText(filters.search);
    query.$or = [
      { name: { $regex: escapedSearch, $options: "i" } },
      { description: { $regex: escapedSearch, $options: "i" } },
    ];
  }

  return query;
}

export async function getTripFilterOptions(tripModel = Trip) {
  const [regions, seasons] = await Promise.all([
    tripModel.distinct("region"),
    tripModel.distinct("bestSeason"),
  ]);

  const cleanAndSort = (values) => values
    .filter((value) => typeof value === "string" && value.length > 0)
    .sort((left, right) => left.localeCompare(right));

  return {
    regions: cleanAndSort(regions),
    seasons: cleanAndSort(seasons),
  };
}

export async function getTripsPage(page, perPage, filters = {}, tripModel = Trip) {
  const skip = (page - 1) * perPage;
  const query = buildTripQuery(filters);

  const [results, totalItems] = await Promise.all([
    tripModel.find(query).sort({ id: 1 }).skip(skip).limit(perPage).lean(),
    tripModel.countDocuments(query),
  ]);

  return { results, totalItems };
}

export const updateTripById = async (id, updateData) => {
  const query = mongoose.Types.ObjectId.isValid(id)
    ? { $or: [{ _id: id }, { id }] }
    : { id };

  return await Trip.findOneAndUpdate(
    query, 
    { $set: updateData }, 
    { returnDocument: 'after', runValidators: true } 
  ).lean();
};

export const deleteTripById = async (id) => {
  const query = mongoose.Types.ObjectId.isValid(id)
    ? { $or: [{ _id: id }, { id }] }
    : { id };

  return await Trip.findOneAndDelete(query).lean();
};
