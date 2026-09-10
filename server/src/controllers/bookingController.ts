import { Request, Response } from 'express';
import db from '../services/db';
import { AuthenticatedRequest } from '../middleware/auth';

export class BookingController {
  // Create a new booking (transaction-safe)
  static async create(req: Request, res: Response) {
    try {
      const authReq = req as AuthenticatedRequest;
      const driverId = authReq.user?.id;

      if (!driverId) {
        return res.status(401).json({ error: 'Unauthorized: Driver account required.' });
      }

      const { parkingSpaceId, startTime, endTime } = req.body;

      if (!parkingSpaceId || !startTime || !endTime) {
        return res.status(400).json({ error: 'Required fields: parkingSpaceId, startTime, endTime.' });
      }

      const start = new Date(startTime);
      const end = new Date(endTime);

      if (start >= end) {
        return res.status(400).json({ error: 'Start time must be before end time.' });
      }

      // 1. Transaction-safe capacity validation to prevent double booking
      const result = await db.$transaction(async (tx) => {
        // Fetch the parking space with a lock (or verify state immediately)
        const space = await tx.parkingSpace.findUnique({
          where: { id: parkingSpaceId },
        });

        if (!space) {
          throw new Error('Parking space listing not found.');
        }

        if (space.status !== 'VERIFIED') {
          throw new Error('This parking space is not yet verified.');
        }

        if (space.availabilityStatus !== 'AVAILABLE') {
          throw new Error('This parking space is currently marked unavailable by the owner.');
        }

        // Count overlapping reservations
        const overlappingBookings = await tx.booking.count({
          where: {
            parkingSpaceId,
            status: { in: ['RESERVED', 'OCCUPIED'] },
            OR: [
              {
                startTime: { lte: start },
                endTime: { gt: start },
              },
              {
                startTime: { lt: end },
                endTime: { gte: end },
              },
              {
                startTime: { gte: start },
                endTime: { lte: end },
              },
            ],
          },
        });

        if (overlappingBookings >= space.capacity) {
          throw new Error('No capacity available for the requested timeframe. The space is already booked.');
        }

        // Calculate cost metrics
        const diffMs = end.getTime() - start.getTime();
        const durationHours = Math.ceil((diffMs / (1000 * 60 * 60)) * 10) / 10; // Round to 1 decimal place

        const baseAmount = durationHours * space.pricePerHour;
        const platformFee = Math.round(baseAmount * 0.15); // 15% platform fee
        const totalAmount = baseAmount + platformFee;

        // Generate unique booking code
        const uniqueString = `QR_${space.id.substring(0, 4)}_${driverId.substring(0, 4)}_${Date.now()}`;

        // Create booking as PENDING (needs payment verify to change to RESERVED)
        const booking = await tx.booking.create({
          data: {
            driverId,
            parkingSpaceId,
            startTime: start,
            endTime: end,
            durationHours,
            totalAmount: baseAmount,
            platformFee,
            status: 'PENDING',
            qrCode: uniqueString,
          },
          include: {
            parkingSpace: true,
          },
        });

        return booking;
      });

      res.status(201).json({
        message: 'Booking reservation initialized.',
        booking: result,
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  // Get bookings (Driver's bookings, Owner's bookings, or Admin's total list)
  static async getAll(req: Request, res: Response) {
    try {
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user?.id;
      const role = authReq.user?.role;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      let bookings;

      if (role === 'DRIVER') {
        bookings = await db.booking.findMany({
          where: { driverId: userId },
          include: {
            parkingSpace: {
              include: { images: true },
            },
            payment: true,
          },
          orderBy: { createdAt: 'desc' },
        });
      } else if (role === 'OWNER') {
        bookings = await db.booking.findMany({
          where: {
            parkingSpace: { ownerId: userId },
          },
          include: {
            parkingSpace: true,
            driver: { select: { name: true, email: true } },
            payment: true,
          },
          orderBy: { createdAt: 'desc' },
        });
      } else if (role === 'ADMIN') {
        bookings = await db.booking.findMany({
          include: {
            parkingSpace: true,
            driver: { select: { name: true, email: true } },
            payment: true,
          },
          orderBy: { createdAt: 'desc' },
        });
      }

      res.json(bookings);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  // Get single booking detail
  static async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user?.id;

      const booking = await db.booking.findUnique({
        where: { id },
        include: {
          parkingSpace: {
            include: {
              owner: { select: { name: true, email: true } },
            },
          },
          driver: { select: { name: true, email: true } },
          payment: true,
        },
      });

      if (!booking) {
        return res.status(404).json({ error: 'Booking details not found.' });
      }

      // Check access permission (Driver, Owner, or Admin)
      const isDriver = booking.driverId === userId;
      const isOwner = booking.parkingSpace.ownerId === userId;
      const isAdmin = authReq.user?.role === 'ADMIN';

      if (!isDriver && !isOwner && !isAdmin) {
        return res.status(403).json({ error: 'Forbidden: You do not have permission to view this booking.' });
      }

      res.json(booking);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  // QR Check-in transition (RESERVED -> OCCUPIED)
  static async checkIn(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { qrCode } = req.body;
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user?.id;

      const booking = await db.booking.findUnique({
        where: { id },
        include: { parkingSpace: true },
      });

      if (!booking) {
        return res.status(404).json({ error: 'Booking reservation not found.' });
      }

      // Verify QR Code match
      if (qrCode && booking.qrCode !== qrCode) {
        return res.status(400).json({ error: 'QR Code mismatch. Access verification failed.' });
      }

      // Verify that the booking belongs to the driver OR the owner/admin is performing it
      const isDriver = booking.driverId === userId;
      const isOwner = booking.parkingSpace.ownerId === userId;
      const isAdmin = authReq.user?.role === 'ADMIN';

      if (!isDriver && !isOwner && !isAdmin) {
        return res.status(403).json({ error: 'Unauthorized access to booking check-in.' });
      }

      if (booking.status !== 'RESERVED') {
        return res.status(400).json({
          error: `Check-in is only allowed for RESERVED bookings. Current status is ${booking.status}.`,
        });
      }

      const updated = await db.booking.update({
        where: { id },
        data: {
          status: 'OCCUPIED',
          checkInTime: new Date(),
        },
      });

      // Create notification for driver & owner
      await db.notification.createMany({
        data: [
          {
            userId: booking.driverId,
            title: 'Check-in Confirmed',
            message: `You have successfully parked at ${booking.parkingSpace.name}.`,
          },
          {
            userId: booking.parkingSpace.ownerId,
            title: 'Spot Occupied',
            message: `A driver has checked into your spot: ${booking.parkingSpace.name}.`,
          },
        ],
      });

      res.json({ message: 'Check-in validated. Session started.', booking: updated });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  // QR Check-out transition (OCCUPIED -> COMPLETED)
  static async checkOut(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user?.id;

      const booking = await db.booking.findUnique({
        where: { id },
        include: { parkingSpace: true },
      });

      if (!booking) {
        return res.status(404).json({ error: 'Booking reservation not found.' });
      }

      const isDriver = booking.driverId === userId;
      const isOwner = booking.parkingSpace.ownerId === userId;
      const isAdmin = authReq.user?.role === 'ADMIN';

      if (!isDriver && !isOwner && !isAdmin) {
        return res.status(403).json({ error: 'Unauthorized access to booking check-out.' });
      }

      if (booking.status !== 'OCCUPIED') {
        return res.status(400).json({
          error: `Check-out is only allowed for OCCUPIED bookings. Current status is ${booking.status}.`,
        });
      }

      const updated = await db.booking.update({
        where: { id },
        data: {
          status: 'COMPLETED',
          checkOutTime: new Date(),
        },
      });

      // Create notification for driver & owner
      await db.notification.createMany({
        data: [
          {
            userId: booking.driverId,
            title: 'Check-out Completed',
            message: `Your booking session at ${booking.parkingSpace.name} has ended.`,
          },
          {
            userId: booking.parkingSpace.ownerId,
            title: 'Spot Available',
            message: `Driver has checked out. Your spot is now available.`,
          },
        ],
      });

      res.json({ message: 'Check-out completed successfully.', booking: updated });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  // Cancel reservation (PENDING or RESERVED -> CANCELLED)
  static async cancel(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user?.id;

      const booking = await db.booking.findUnique({
        where: { id },
        include: { parkingSpace: true },
      });

      if (!booking) {
        return res.status(404).json({ error: 'Booking details not found.' });
      }

      if (booking.driverId !== userId && authReq.user?.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Forbidden: You cannot cancel this booking.' });
      }

      if (['COMPLETED', 'OCCUPIED', 'CANCELLED'].includes(booking.status)) {
        return res.status(400).json({ error: `Cannot cancel a booking with status ${booking.status}.` });
      }

      const updated = await db.booking.update({
        where: { id },
        data: { status: 'CANCELLED' },
      });

      res.json({ message: 'Booking has been cancelled.', booking: updated });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}
