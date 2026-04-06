import { Router } from 'express';
import {
  createBishi,
  getAllBishis,
  getBishiById,
  updateBishi,
  deleteBishi,
  addMembers,
  getMembers,
  removeMember,
  getPaymentsByMonth,
  recordPayment,
  announceWinners,
  getWinners,
  exportBishiMonth,
} from '../controllers/bishi.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

router.use(protect);

// Bishi Management
router.post('/', createBishi);
router.get('/', getAllBishis);
router.get('/:id', getBishiById);
router.patch('/:id', updateBishi);
router.put('/:id', updateBishi);
router.delete('/:id', deleteBishi);

// Members
router.post('/:id/members', addMembers);
router.get('/:id/members', getMembers);
router.delete('/:id/members/:mid', removeMember);

// Payments
router.get('/:id/payments/:monthNum', getPaymentsByMonth);
router.post('/:id/payments', recordPayment);

// Winners
router.post('/:id/winners', announceWinners);
router.get('/:id/winners', getWinners);

// Export
router.get('/:id/export/:monthNum', exportBishiMonth);

export default router;
