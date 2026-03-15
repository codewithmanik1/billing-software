import { Router } from 'express';
import {
  getSummary,
  getOutstanding,
  getCollections,
  getTopCustomers,
  getPaymentModes,
} from '../controllers/report.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

router.use(protect);

router.get('/summary', getSummary);
router.get('/outstanding', getOutstanding);
router.get('/collections', getCollections);
router.get('/top-customers', getTopCustomers);
router.get('/payment-modes', getPaymentModes);

export default router;
