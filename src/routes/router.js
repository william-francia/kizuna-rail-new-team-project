import { Router } from 'express';
import challengeScenariosRouter from './scenarios.js';
import apiRoutes from './api-routes.js';
import authRoutes from "./auth-routes.js";
import profileRoutes from "./profile-routes.js";
import ejsRoutes from './ejs-routes.js';
import adminTripsRouter from './admin/trips.js';

import { homePage, aboutPage, testErrorPage } from './index.js';
const router = Router();

router.get('/', homePage);
router.get('/about', aboutPage);

// Authentication pages
router.use("/", authRoutes);

router.use("/", profileRoutes);

router.use('/admin', adminTripsRouter);
router.use('/api', apiRoutes);
router.use('/scenarios', challengeScenariosRouter);

// EJS pages
router.use('/', ejsRoutes);

// JSON API
router.use('/api', apiRoutes);
router.use('/scenarios', challengeScenariosRouter);
router.get('/500', testErrorPage);

export default router;