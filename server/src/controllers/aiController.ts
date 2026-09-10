import { Request, Response } from 'express';
import { AIService } from '../services/ai';

export class AIController {
  // GET /api/ai/availability
  static async getAvailabilityPrediction(req: Request, res: Response) {
    try {
      const { spaceId, targetTime, duration } = req.query;

      if (!spaceId) {
        return res.status(400).json({ error: 'spaceId is required.' });
      }

      const time = targetTime ? new Date(targetTime as string) : new Date();
      const dur = duration ? parseFloat(duration as string) : 2.0;

      const prediction = await AIService.predictAvailability(
        spaceId as string,
        time,
        dur
      );

      res.json(prediction);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  // GET /api/ai/pricing
  static async getPricingRecommendation(req: Request, res: Response) {
    try {
      const { spaceId } = req.query;

      if (!spaceId) {
        return res.status(400).json({ error: 'spaceId is required.' });
      }

      const recommendation = await AIService.calculateDynamicPrice(spaceId as string);

      res.json(recommendation);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  // POST /api/ai/verify-image
  static async analyzeListingImage(req: Request, res: Response) {
    try {
      const { imageUrl, spaceName } = req.body;

      if (!imageUrl || !spaceName) {
        return res.status(400).json({ error: 'imageUrl and spaceName are required.' });
      }

      const result = await AIService.verifyParkingImage(imageUrl, spaceName);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}
