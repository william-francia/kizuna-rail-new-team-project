import Train from "./schemas/train.js";

export async function getTrainById(id) {
  return Train.findOne({ id }).lean();
}

export async function getAllTrains({
  page = 1,
  limit = 10,
  search = "",
  sort = "name-asc",
} = {}) {
  const skip = (page - 1) * limit;

  const filter = {};

  if (search) {
    const searchRegex = new RegExp(search, "i");

    filter.$or = [
      { id: searchRegex },
      { name: searchRegex },
      { operator: searchRegex },
      { type: searchRegex },
      { powerSource: searchRegex },
      { bestFor: searchRegex },
      { description: searchRegex },
    ];
  }

  const sortOptions = {
    "name-asc": { name: 1 },
    "name-desc": { name: -1 },
    "speed-asc": { maxSpeedKmh: 1 },
    "speed-desc": { maxSpeedKmh: -1 },
    "capacity-asc": { capacity: 1 },
    "capacity-desc": { capacity: -1 },
  };

  const sortValue = sortOptions[sort];

  const [trains, total] = await Promise.all([
    Train.find(filter).sort(sortValue).skip(skip).limit(limit).lean(),
    Train.countDocuments(filter),
  ]);

  return {
    trains,
    total,
  };
}
