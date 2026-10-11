import TicketClass from "./schemas/ticket-classes.js";

export async function getPaginatedTicketClasses(
  page = 1,
  limit = 10,
  { search = "", day = "" } = {}
) {
  const skip = (page - 1) * limit;
  const query = {};

  if (search) {
    const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    query.$or = [
      {
        class: {
          $regex: escapedSearch,
          $options: "i",
        },
      },
      {
        name: {
          $regex: escapedSearch,
          $options: "i",
        },
      },
    ];
  }

  if (day) {
    query.availableDays = day;
  }

  const [ticketClasses, total] = await Promise.all([
    TicketClass.find(query)
      .sort({ pricePerKm: 1, _id: 1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    TicketClass.countDocuments(query),
  ]);

  return {
    ticketClasses,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}
