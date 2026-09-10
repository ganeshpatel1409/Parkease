import { Request, Response } from 'express';
import db from '../services/db';
import { AIService } from '../services/ai';
import { AuthenticatedRequest } from '../middleware/auth';

export class ParkingController {
  // Get all active verified parking spaces
  static async getAll(req: Request, res: Response) {
    try {
      const { ownerId } = req.query;

      const whereClause: any = { status: 'VERIFIED' };
      if (ownerId) {
        whereClause.ownerId = ownerId as string;
        // Owners can see their own listings even if they are pending or rejected
        delete whereClause.status;
      }

      const spaces = await db.parkingSpace.findMany({
        where: whereClause,
        include: {
          images: true,
          reviews: true,
        },
      });

      res.json(spaces);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  // Get single space by ID
  static async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const space = await db.parkingSpace.findUnique({
        where: { id },
        include: {
          images: true,
          reviews: {
            include: {
              driver: {
                select: { name: true, email: true },
              },
            },
          },
          verifications: true,
          owner: {
            select: { name: true, email: true },
          },
        },
      });

      if (!space) {
        return res.status(404).json({ error: 'Parking space listing not found.' });
      }

      // Calculate dynamic price recommendations
      const dynamicPricing = await AIService.calculateDynamicPrice(space.id);

      // Availability probability prediction
      const availabilityPrediction = await AIService.predictAvailability(
        space.id,
        new Date(),
        2 // Default 2 hours forecast
      );

      res.json({
        ...space,
        dynamicPricing,
        availabilityPrediction,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  // Search parking with AI scoring and journey optimization
  static async search(req: Request, res: Response) {
    try {
      const { lat, lng, date, startTime, duration, vehicleType } = req.query;

      if (!lat || !lng) {
        return res.status(400).json({ error: 'Search requires latitude (lat) and longitude (lng).' });
      }

      const searchLat = parseFloat(lat as string);
      const searchLng = parseFloat(lng as string);
      const searchDuration = parseFloat((duration as string) || '2');
      const searchDate = date ? new Date(date as string) : new Date();

      // Set target datetime
      let targetTime = new Date(searchDate);
      if (startTime) {
        const [hours, minutes] = (startTime as string).split(':').map(Number);
        targetTime.setHours(hours, minutes, 0, 0);
      }

      // Fetch all verified listings
      const spaces = await db.parkingSpace.findMany({
        where: {
          status: 'VERIFIED',
          availabilityStatus: 'AVAILABLE',
          ...(vehicleType && vehicleType !== 'BOTH'
            ? { vehicleType: { in: [vehicleType as string, 'BOTH'] } }
            : {}),
        },
        include: {
          images: true,
          reviews: true,
          verifications: true,
        },
      });

      // Calculate events influence
      const activeEvents = await db.event.findMany({
        where: {
          startTime: { lte: targetTime },
          endTime: { gte: targetTime },
        },
      });

      const processedResults = await Promise.all(
        spaces.map(async (space) => {
          const distance = AIService.calculateDistance(
            searchLat,
            searchLng,
            space.latitude,
            space.longitude
          );

          // Only show spaces within 3km radius for relevance
          if (distance > 3.0) return null;

          // Walking time: 12 minutes per km
          const walkingTime = Math.round(distance * 12);

          // Event and traffic level calculation
          let trafficLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH' = 'LOW';
          let nearestEventDistance = 999;
          let activeEventName = '';

          for (const event of activeEvents) {
            const evDist = AIService.calculateDistance(
              space.latitude,
              space.longitude,
              event.latitude,
              event.longitude
            );
            if (evDist < nearestEventDistance) {
              nearestEventDistance = evDist;
              activeEventName = event.name;
              if (event.estimatedDemand === 'VERY_HIGH' && evDist <= 1.0) {
                trafficLevel = 'VERY_HIGH';
              } else if (event.estimatedDemand === 'HIGH' && evDist <= 1.2) {
                trafficLevel = 'HIGH';
              } else if (evDist <= 1.5) {
                trafficLevel = 'MEDIUM';
              }
            }
          }

          // Driving time: base 3 mins per km. Traffic adds penalty multiplier.
          const trafficMultiplier =
            trafficLevel === 'VERY_HIGH'
              ? 2.5
              : trafficLevel === 'HIGH'
              ? 1.8
              : trafficLevel === 'MEDIUM'
              ? 1.3
              : 1.0;
          const drivingTime = Math.round(distance * 3 * trafficMultiplier);

          // Get availability probability prediction
          const availPredict = await AIService.predictAvailability(
            space.id,
            targetTime,
            searchDuration
          );

          // Calculate average review rating
          const avgRating =
            space.reviews.length > 0
              ? space.reviews.reduce((acc, r) => acc + r.rating, 0) / space.reviews.length
              : 4.5; // Default rating for verified properties without ratings

          // Compute AI Scores
          const distScore = Math.max(0, 100 - (distance / 2.0) * 100); // 100 points for 0km, 0 points for 2km+
          const priceScore = Math.max(0, 100 - (space.pricePerHour / 80) * 100); // 100 points for ₹0, 0 points for ₹80+
          const availScore = availPredict.probability;
          const trafficScore =
            trafficLevel === 'LOW'
              ? 100
              : trafficLevel === 'MEDIUM'
              ? 70
              : trafficLevel === 'HIGH'
              ? 40
              : 10;
          const ratingScore = avgRating * 20; // Scale 0-5 to 0-100
          const reliabilityScore = space.verificationScore || 90;

          // AI Weighted Scoring (from requirements):
          // 30% convenience (distance/walk), 20% price, 20% availability, 15% traffic, 10% rating, 5% reliability
          const aiScore = Math.round(
            0.3 * distScore +
              0.2 * priceScore +
              0.2 * availScore +
              0.15 * trafficScore +
              0.1 * ratingScore +
              0.05 * reliabilityScore
          );

          // Recommended dynamic pricing (what could be charged)
          const dynamicRec = await AIService.calculateDynamicPrice(space.id);

          // Generate understandable reasonings for the AI recommendation
          const recommendations: string[] = [];
          if (distance <= 0.4) {
            recommendations.push(`✓ Close location: ${(distance * 1000).toFixed(0)}m away (${walkingTime} min walk)`);
          } else {
            recommendations.push(`✓ Reasonable walk: ${walkingTime} min walk to destination`);
          }

          if (trafficLevel === 'LOW') {
            recommendations.push('✓ Traffic congestion is minimal');
          } else {
            recommendations.push(`⚠ Traffic is ${trafficLevel.toLowerCase()} near ${activeEventName}`);
          }

          if (availPredict.probability >= 75) {
            recommendations.push(`✓ High occupancy confidence (${availPredict.probability}% probability)`);
          }

          const avgPriceNear = 50; // Reference average
          if (space.pricePerHour < avgPriceNear) {
            recommendations.push(`✓ ₹${Math.round(avgPriceNear - space.pricePerHour)} cheaper than average nearby`);
          }

          if (avgRating >= 4.7) {
            recommendations.push(`✓ Excellent guest reviews (${avgRating.toFixed(1)}★)`);
          }

          return {
            id: space.id,
            name: space.name,
            description: space.description,
            address: space.address,
            latitude: space.latitude,
            longitude: space.longitude,
            pricePerHour: space.pricePerHour,
            capacity: space.capacity,
            vehicleType: space.vehicleType,
            status: space.status,
            verificationScore: space.verificationScore,
            availabilityStatus: space.availabilityStatus,
            images: space.images,
            distance,
            walkingTime,
            drivingTime,
            trafficLevel,
            availabilityProbability: availPredict.probability,
            availabilityExplanation: availPredict.explanation,
            rating: avgRating,
            reviewCount: space.reviews.length,
            aiScore,
            recommendationNotes: recommendations,
            estimatedTotal: space.pricePerHour * searchDuration,
            recommendedPrice: dynamicRec.recommendedPrice,
            recommendedPriceExplanation: dynamicRec.explanation,
          };
        })
      );

      // Filter out nulls and sort by AI Score descending (best matches first)
      const filteredResults = processedResults
        .filter((r) => r !== null)
        .sort((a, b) => (b?.aiScore || 0) - (a?.aiScore || 0));

      res.json(filteredResults);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  // Create new listing + AI Image Verification
  static async create(req: Request, res: Response) {
    try {
      const authReq = req as AuthenticatedRequest;
      const ownerId = authReq.user?.id;

      if (!ownerId) {
        return res.status(401).json({ error: 'Unauthorized: User session missing' });
      }

      const { name, description, address, latitude, longitude, pricePerHour, capacity, vehicleType, imageUrl } =
        req.body;

      if (!name || !address || !latitude || !longitude || !pricePerHour || !capacity || !vehicleType || !imageUrl) {
        return res.status(400).json({ error: 'Required fields missing to register parking listing.' });
      }

      // 1. Create the ParkingSpace in DB (initially PENDING verification)
      const space = await db.parkingSpace.create({
        data: {
          ownerId,
          name,
          description: description || '',
          address,
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
          pricePerHour: parseFloat(pricePerHour),
          capacity: parseInt(capacity),
          vehicleType,
          status: 'PENDING',
          verificationScore: 0,
          availabilityStatus: 'AVAILABLE',
        },
      });

      // 2. Attach the image
      const image = await db.parkingImage.create({
        data: {
          parkingSpaceId: space.id,
          url: imageUrl,
          isVerificationPhoto: true,
        },
      });

      // 3. Trigger AI verification logic (non-blocking in background, or await to respond immediately for UI satisfaction)
      const aiResult = await AIService.verifyParkingImage(imageUrl, name);

      // 4. Update the listing state with AI assessment
      const updatedSpace = await db.parkingSpace.update({
        where: { id: space.id },
        data: {
          status: aiResult.status === 'VERIFIED' ? 'VERIFIED' : 'PENDING', // If NEEDS_REVIEW, keep pending
          verificationScore: Math.round(aiResult.confidence * 100),
        },
        include: { images: true },
      });

      // 5. Store Verification History log
      await db.verification.create({
        data: {
          parkingSpaceId: space.id,
          status: aiResult.status,
          confidence: aiResult.confidence,
          details: JSON.stringify(aiResult.details),
        },
      });

      res.status(201).json({
        message: 'Parking space listing created successfully.',
        space: updatedSpace,
        verification: aiResult,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  // Update space details
  static async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const authReq = req as AuthenticatedRequest;
      const ownerId = authReq.user?.id;

      const space = await db.parkingSpace.findUnique({ where: { id } });
      if (!space) {
        return res.status(404).json({ error: 'Parking space not found.' });
      }

      // Check ownership (Admin can override)
      if (space.ownerId !== ownerId && authReq.user?.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Forbidden: You do not own this listing.' });
      }

      const { name, description, address, pricePerHour, capacity, vehicleType, availabilityStatus } = req.body;

      const updated = await db.parkingSpace.update({
        where: { id },
        data: {
          name: name ?? space.name,
          description: description ?? space.description,
          address: address ?? space.address,
          pricePerHour: pricePerHour ? parseFloat(pricePerHour) : space.pricePerHour,
          capacity: capacity ? parseInt(capacity) : space.capacity,
          vehicleType: vehicleType ?? space.vehicleType,
          availabilityStatus: availabilityStatus ?? space.availabilityStatus,
        },
      });

      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  // Delete space
  static async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const authReq = req as AuthenticatedRequest;
      const ownerId = authReq.user?.id;

      const space = await db.parkingSpace.findUnique({ where: { id } });
      if (!space) {
        return res.status(404).json({ error: 'Parking space not found.' });
      }

      if (space.ownerId !== ownerId && authReq.user?.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Forbidden: You do not own this listing.' });
      }

      await db.parkingSpace.delete({ where: { id } });
      res.json({ message: 'Parking space listing deleted successfully.' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}
