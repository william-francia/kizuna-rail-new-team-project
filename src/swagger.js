import swaggerJSDoc from "swagger-jsdoc";

const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Kizuna Rail API",
      version: "1.0.0",
      description: "API documentation for the Kizuna Rail project.",
    },
  },
  apis: ["./src/routes/api-routes.js"],
};

const swaggerSpec = swaggerJSDoc(swaggerOptions);

export default swaggerSpec;