import { Router } from 'express';
import { AuthController } from './controllers/authController';
import { ParkingController } from './controllers/parkingController';
import { BookingController } from './controllers/bookingController';
import { PaymentController } from './controllers/paymentController';
import { AIController } from './controllers/aiController';
import { EventController } from './controllers/eventController';
import { ReviewController } from './controllers/reviewController';
import { AdminController } from './controllers/adminController';
import { authenticateToken, requireRole, AuthenticatedRequest } from './middleware/auth';
import db from './services/db';

const router = Router();

// --- AUTHENTICATION ---
router.post('/auth/register', AuthController.register);
router.post('/auth/login', AuthController.login);
router.get('/auth/me', authenticateToken, AuthController.me);

// --- PARKING ---
router.get('/parking/search', ParkingController.search); // Search first to prevent match on ID
router.get('/parking', ParkingController.getAll);
router.get('/parking/:id', ParkingController.getById);
router.post('/parking', authenticateToken, requireRole(['OWNER', 'ADMIN']), ParkingController.create);
router.put('/parking/:id', authenticateToken, requireRole(['OWNER', 'ADMIN']), ParkingController.update);
router.delete('/parking/:id', authenticateToken, requireRole(['OWNER', 'ADMIN']), ParkingController.delete);

// --- BOOKINGS ---
router.post('/bookings', authenticateToken, requireRole(['DRIVER']), BookingController.create);
router.get('/bookings', authenticateToken, BookingController.getAll);
router.get('/bookings/:id', authenticateToken, BookingController.getById);
router.post('/bookings/:id/check-in', authenticateToken, BookingController.checkIn);
router.post('/bookings/:id/check-out', authenticateToken, BookingController.checkOut);
router.post('/bookings/:id/cancel', authenticateToken, BookingController.cancel);

// --- PAYMENTS ---
router.post('/payments/create', authenticateToken, requireRole(['DRIVER']), PaymentController.createIntent);
router.post('/payments/verify', authenticateToken, requireRole(['DRIVER']), PaymentController.verify);

// --- AI SERVICE ---
router.get('/ai/availability', AIController.getAvailabilityPrediction);
router.get('/ai/pricing', AIController.getPricingRecommendation);
router.post('/ai/verify-image', AIController.analyzeListingImage);

// --- EVENTS ---
router.get('/events', EventController.getAll);

// --- REVIEWS ---
router.post('/reviews', authenticateToken, requireRole(['DRIVER']), ReviewController.create);

// --- ADMIN SYSTEM ---
router.get('/admin/dashboard', authenticateToken, requireRole(['ADMIN']), AdminController.getAnalytics);
router.get('/admin/listings/pending', authenticateToken, requireRole(['ADMIN']), AdminController.getPendingListings);
router.post('/admin/listings/:id/approve', authenticateToken, requireRole(['ADMIN']), AdminController.approveListing);
router.post('/admin/listings/:id/reject', authenticateToken, requireRole(['ADMIN']), AdminController.rejectListing);
router.get('/admin/users', authenticateToken, requireRole(['ADMIN']), AdminController.getUsers);

// --- NOTIFICATIONS ---
router.get('/notifications', authenticateToken, async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user?.id;
    const notifications = await db.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
    res.json(notifications);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/notifications/read-all', authenticateToken, async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user?.id;
    await db.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
    res.json({ message: 'Notifications marked as read.' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// --- CONFIGS ---
router.get('/config/google-maps-key', (req, res) => {
  res.json({ apiKey: process.env.GOOGLE_MAPS_API_KEY || '' });
});

export default router;
