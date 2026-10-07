import mongoose from "mongoose";
import Trip from "./schemas/trips.js";

export async function getTripById(id) {
  return Trip.findOne({ id }).lean();
}

export async function getTripsPage(page, perPage, filters = {}, tripModel = Trip) {
  const skip = (page - 1) * perPage;
  const { search, region, season } = filters;

  const query = {};

  if (search && search.trim() !== "") {
    const searchRegex = new RegExp(search.trim(), "i");
    query.$or = [
      { route_name: searchRegex },
      { name: searchRegex },
      { description: searchRegex }
    ];
  }

  if (region && region.trim() !== "") {
    query.region = new RegExp(`^${region.trim()}$`, "i");
  }

  if (season && season.trim() !== "") {
    query.bestSeason = new RegExp(`^${season.trim()}$`, "i");
  }

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