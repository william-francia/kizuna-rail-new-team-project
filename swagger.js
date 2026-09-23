import swaggerJSDoc from 'swagger-jsdoc';

const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Kizuna Rail API',
            version: '1.0.0',
            description: 'API documentation for the Kizuna Rail project'
        },
        servers: [
            {
                url: 'http://localhost:3000'
            }
        ]
    },

    apis: ['./src/routes/*.js']
};

const swaggerSpec = swaggerJSDoc(swaggerOptions);

export default swaggerSpec;