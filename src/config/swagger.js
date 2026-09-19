import swaggerJSDoc from "swagger-jsdoc";
import pkg from "../../package.json" with { type: "json" };

// Builds the OpenAPI document from the @swagger comments in the API routes file.
// The path is relative to the project root, so start the app from that folder.
const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Kizuna Rail API",
      version: pkg.version,
      description: "JSON API for the Kizuna Rail booking application.",
    },
    tags: [
      {
        name: "Bookings",
        description: "Ticket bookings made through the booking form.",
      },
    ],
  },
  apis: ["./src/routes/api-routes.js"],
};

export default swaggerJSDoc(options);
