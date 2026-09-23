import { Router } from 'express';
import challengeScenariosRouter from './scenarios.js';
import apiRoutes from './api-routes.js';
import ejsRoutes from './ejs-routes.js';
import { homePage, aboutPage, testErrorPage } from './index.js';

const router = Router();

// Home page
router.get('/', homePage);

// About page
router.get('/about', aboutPage);

// JSON API routes
router.use('/api', apiRoutes);

// EJS page routes (trips, booking pages, bookings admin)
router.use('/', ejsRoutes);

// Challenge scenarios
router.use('/scenarios', challengeScenariosRouter);

// Test 500 error page
router.get('/500', testErrorPage);

export default router;