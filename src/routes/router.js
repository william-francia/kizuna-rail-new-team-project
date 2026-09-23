import challengeScenariosRouter from './scenarios.js';
import ejsRoutesRouter from './ejs-routes.js';
import apiRoutesRouter from './api-routes.js';
import { Router } from 'express';
import { homePage, aboutPage, testErrorPage } from './index.js';

const router = Router();

// Home page
router.get('/', homePage);

// About page
router.get('/about', aboutPage);

// API routes
router.use('/api', apiRoutesRouter);

// Rail routes
router.use('/routes', ejsRoutesRouter);

// Challenge scenarios
router.use('/scenarios', challengeScenariosRouter);

// Test 500 error page
router.get('/500', testErrorPage);

export default router;