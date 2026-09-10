import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import apiRouter from './routes';
import { errorHandler } from './middleware/error';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for frontend cross-origin requests
app.use(cors({
  origin: '*', // Allow all origins for the hackathon prototype
  credentials: true,
}));

// Setup JSON parsing rules
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// Health Check Endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'ParkEase API Server is healthy and running.' });
});

// Attach API Routing
app.use('/api', apiRouter);

// Attach global error-handling boundary middleware
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(`  ParkEase Express Server has started!`);
  console.log(`  Running on: http://localhost:${PORT}`);
  console.log(`  Health check: http://localhost:${PORT}/health`);
  console.log(`===============================================`);
});
