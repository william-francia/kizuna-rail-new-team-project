import { Router } from 'express';
import challengeScenariosRouter from './scenarios.js';
import apiRoutes from './api-routes.js';
import ejsRoutes from './ejs-routes.js';
import railRoutesRouter from './routes.js';
import { homePage, aboutPage, testErrorPage } from './index.js';

const router = Router();

// Home page
router.get('/', homePage);

// About page
router.get('/about', aboutPage);

// EJS pages
router.use('/', ejsRoutes);

// Rail routes
router.use('/routes', railRoutesRouter);

// JSON API
router.use('/api', apiRoutes);

// Challenge scenarios
router.use('/scenarios', challengeScenariosRouter);

// Test 500 error page
router.get('/500', testErrorPage);

export default router;