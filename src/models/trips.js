import mongoose from "mongoose";
import Trip from "./schemas/trips.js";

export async function getTripById(id) {
  return await Trip.findById(id);
}

export async function getAllTrips({ skip = 0, limit = 10, filter = {} } = {}) {
  return await Trip.find(filter).skip(skip).limit(limit);
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

export async function countAllTrips(filter = {}) {
  return await Trip.countDocuments(filter);
}