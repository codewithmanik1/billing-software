import { Router } from 'express';
import { getProfile, updateProfile } from '../controllers/profile.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

router.use(protect);

router.get('/', getProfile);
router.put('/', updateProfile);

export default router;
