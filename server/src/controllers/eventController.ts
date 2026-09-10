import { Request, Response } from 'express';
import db from '../services/db';

export class EventController {
  // GET /api/events
  static async getAll(req: Request, res: Response) {
    try {
      const events = await db.event.findMany({
        orderBy: { startTime: 'asc' },
      });
      res.json(events);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}
