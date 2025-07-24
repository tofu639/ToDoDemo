import { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';

/**
 * Main router configuration that combines all route modules
 */
const router = Router();

// Mount authentication routes
router.use('/auth', authRoutes);

// Mount user routes
router.use('/users', userRoutes);

export default router;