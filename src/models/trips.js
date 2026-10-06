import mongoose from "mongoose";
import Trip from "./schemas/trips.js";

export async function getTripById(id) {
  return Trip.findOne({ id }).lean();
}

export async function getTripsPage(page, perPage, tripModel = Trip) {
  const skip = (page - 1) * perPage;

  const [results, totalItems] = await Promise.all([
    tripModel.find({}).sort({ id: 1 }).skip(skip).limit(perPage).lean(),
    tripModel.countDocuments({}),
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
