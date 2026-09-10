import { Request, Response } from 'express';
import db from '../services/db';

export class AdminController {
  // GET /api/admin/dashboard (System-wide analytics)
  static async getAnalytics(req: Request, res: Response) {
    try {
      const totalUsers = await db.user.count();
      const totalSpaces = await db.parkingSpace.count();
      
      const verifiedSpaces = await db.parkingSpace.count({
        where: { status: 'VERIFIED' },
      });

      const pendingSpaces = await db.parkingSpace.count({
        where: { status: 'PENDING' },
      });

      const activeBookings = await db.booking.count({
        where: { status: { in: ['RESERVED', 'OCCUPIED'] } },
      });

      const payments = await db.payment.findMany({
        where: { status: 'SUCCESS' },
      });

      // Sum revenue (platform fees + payments total)
      const platformRevenue = payments.reduce((acc, p) => acc + (p.amount * 0.15), 0); // 15% platform cut
      const totalVolume = payments.reduce((acc, p) => acc + p.amount, 0);

      res.json({
        totalUsers,
        totalSpaces,
        verifiedSpaces,
        pendingSpaces,
        activeBookings,
        platformRevenue: Math.round(platformRevenue),
        totalVolume: Math.round(totalVolume),
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  // GET /api/admin/listings/pending (Verification Queue)
  static async getPendingListings(req: Request, res: Response) {
    try {
      const pendingListings = await db.parkingSpace.findMany({
        where: { status: 'PENDING' },
        include: {
          owner: { select: { name: true, email: true } },
          images: true,
          verifications: true,
        },
      });

      res.json(pendingListings);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  // POST /api/admin/listings/:id/approve
  static async approveListing(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const space = await db.parkingSpace.findUnique({ where: { id } });
      if (!space) {
        return res.status(404).json({ error: 'Parking space listing not found.' });
      }

      const updated = await db.parkingSpace.update({
        where: { id },
        data: {
          status: 'VERIFIED',
          verificationScore: space.verificationScore || 100, // Make sure score is set
        },
      });

      // Add a verification history entry
      await db.verification.create({
        data: {
          parkingSpaceId: id,
          status: 'VERIFIED',
          confidence: 1.0,
          details: JSON.stringify({ approvedBy: 'ADMIN', timestamp: new Date().toISOString() }),
        },
      });

      // Create notification for owner
      await db.notification.create({
        data: {
          userId: space.ownerId,
          title: 'Listing Approved',
          message: `Your listing "${space.name}" has been approved by the admin and is now live!`,
        },
      });

      res.json({ message: 'Listing approved successfully.', space: updated });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  // POST /api/admin/listings/:id/reject
  static async rejectListing(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      const space = await db.parkingSpace.findUnique({ where: { id } });
      if (!space) {
        return res.status(404).json({ error: 'Parking space listing not found.' });
      }

      const updated = await db.parkingSpace.update({
        where: { id },
        data: { status: 'REJECTED' },
      });

      await db.verification.create({
        data: {
          parkingSpaceId: id,
          status: 'REJECTED',
          confidence: 1.0,
          details: JSON.stringify({ rejectedBy: 'ADMIN', reason: reason || 'Inappropriate image or incorrect details' }),
        },
      });

      // Create notification for owner
      await db.notification.create({
        data: {
          userId: space.ownerId,
          title: 'Listing Rejected',
          message: `Your listing "${space.name}" was rejected. Reason: ${reason || 'Inappropriate details.'}`,
        },
      });

      res.json({ message: 'Listing rejected.', space: updated });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  // GET /api/admin/users (List all registered users)
  static async getUsers(req: Request, res: Response) {
    try {
      const users = await db.user.findMany({
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      res.json(users);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}
