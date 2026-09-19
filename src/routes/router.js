import challengeScenariosRouter from './scenarios.js';
import railRoutesRouter from './routes.js';
import { Router } from 'express';
import apiRoutesRouter from './api-routes.js';
import { homePage, aboutPage, testErrorPage } from './index.js';

const router = Router();

// Home page
router.get('/', homePage);

// About page
router.get('/about', aboutPage);

// API routes (Stations, etc.)
router.use('/api', apiRoutesRouter);

// Rail routes
router.use('/routes', railRoutesRouter);

// Challenge scenarios
router.use('/scenarios', challengeScenariosRouter);

// Test 500 error page
router.get('/500', testErrorPage);

export default router;