import { createConfirmation, getScheduleById } from "../models/model.js";

import { getAllTicketClasses } from "../models/ticket-classes.js";

const bookingPage = async (req, res) => {
  const { scheduleId } = req.params;

  const schedule = await getScheduleById(scheduleId);

  if (!schedule) {
    return res.status(404).send("Schedule not found");
  }

  const ticketClasses = await getAllTicketClasses();

  const ticketOptions = ticketClasses.map((ticketClass) => ({
    class: ticketClass.class,
    name: ticketClass.name,
    price: ticketClass.pricePerKm,
    amenities: ticketClass.amenities,
    description: ticketClass.description,
  }));

  res.render("routes/book", {
    title: "Book Trip",
    schedule,
    ticketOptions,
  });
};

const processBookingRequest = async (req, res) => {
  const data = req.body;

  const confirmationNum = await createConfirmation(data);

  res.redirect(`/routes/confirmation/${confirmationNum}`);
};

export { bookingPage, processBookingRequest };
