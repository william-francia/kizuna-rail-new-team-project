import connectDB from './src/models/db.js';

import Route from './src/models/schemas/route.js';
import Station from './src/models/schemas/station.js';
import Schedule from './src/models/schemas/schedules.js';
import TicketClass from './src/models/schemas/ticket-class.js';
import Train from './src/models/schemas/train.js';

import routes from './src/models/seeds/routes.json' with { type: 'json' };
import stations from './src/models/seeds/stations.json' with { type: 'json' };
import schedules from './src/models/seeds/schedules.json' with { type: 'json' };
import ticketClasses from './src/models/seeds/ticket-classes.json' with { type: 'json' };
import trains from './src/models/seeds/trains.json' with { type: 'json' };

const seedDatabase = async () => {
    try {
        await connectDB();

        console.log('Clearing existing MongoDB data...');

        await Route.deleteMany({});
        await Station.deleteMany({});
        await Schedule.deleteMany({});
        await TicketClass.deleteMany({});
        await Train.deleteMany({});

        console.log('Inserting routes...');
        await Route.insertMany(routes);

        console.log('Inserting stations...');
        await Station.insertMany(stations);

        console.log('Inserting schedules...');
        await Schedule.insertMany(schedules);

        console.log('Inserting ticket classes...');
        await TicketClass.insertMany(ticketClasses);

        console.log('Inserting trains...');
        await Train.insertMany(trains);

        console.log('✓ Database seeded successfully');

        process.exit(0);
    } catch (error) {
        console.error('✗ Error seeding database:', error);
        process.exit(1);
    }
};

seedDatabase();
