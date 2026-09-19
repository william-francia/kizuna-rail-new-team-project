import listRoutesPage from './list.js';
import routeDetailsPage from './details.js';
import { Router } from 'express';

const router = Router();

// List all routes
router.get('/', listRoutesPage);

// Route details page
router.get('/:routeId', routeDetailsPage);

export default router;