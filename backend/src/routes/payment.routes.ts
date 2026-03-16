import { Router } from 'express';
import {
  recordPayment,
  getPaymentsByInvoice,
  deletePayment,
} from '../controllers/payment.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

router.use(protect);

router.post('/', recordPayment);
router.get('/invoice/:invoiceId', getPaymentsByInvoice);
router.delete('/:id', deletePayment);

export default router;
