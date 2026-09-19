import challengeScenariosRouter from './scenarios.js';
import railRoutesRouter from './routes.js';
import ejsRoutes from './ejs-routes.js';
import apiRoutes from './api-routes.js';
import { Router } from 'express';
import { homePage, aboutPage, testErrorPage } from './index.js';

const router = Router();

// Home page
router.get('/', homePage);

// About page
router.get('/about', aboutPage);

// Rail routes
router.use('/routes', railRoutesRouter);

// Challenge scenarios
router.use('/scenarios', challengeScenariosRouter);

// EJS page routes (booking pages and bookings admin)
router.use('/', ejsRoutes);

// JSON API routes
router.use('/api', apiRoutes);

// Test 500 error page
router.get('/500', testErrorPage);

export default router;
