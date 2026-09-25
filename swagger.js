import swaggerJSDoc from "swagger-jsdoc";
import pkg from "./package.json" with { type: "json" };

// Builds the OpenAPI document from the @swagger comments in the routes files.
const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Kizuna Rail API",
      version: pkg.version,
      description: "JSON API for the Kizuna Rail booking application.",
    },
    servers: [
      {
        url: "http://localhost:3000",
      },
    ],
    tags: [
      {
        name: "Bookings",
        description: "Ticket bookings made through the booking form.",
      },
    ],
  },
  apis: ["./src/routes/*.js"],
};

export default swaggerJSDoc(options);