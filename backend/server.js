import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { getJwtSecret } from './config/auth.js';
import connectDB from './config/db.js';
import ecgRoutes from './routes/ecgRoutes.js';
import analysisRoutes from './routes/analysisRoutes.js';
import alertRoutes from './routes/alertRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import authRoutes from './routes/authRoutes.js';
import { errorHandler, notFound } from './middleware/errorMiddleware.js';
import { checkMLHealth } from './services/mlService.js';

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 5000);

app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', async (req, res) => {
  const databaseConnected = mongoose.connection.readyState === 1;
  let ml;
  try {
    const health = await checkMLHealth();
    ml = {
      status: health.ready === true ? 'available' : 'not_ready',
      ready: health.ready === true,
      apiRunning: health.api_running === true,
      modelLoaded: health.model_loaded === true,
      preprocessingArtifactsAvailable: health.preprocessing_artifacts_available === true,
    };
  } catch (error) {
    ml = { status: error.statusCode === 504 ? 'timeout' : 'unavailable' };
  }

  res.status(databaseConnected ? 200 : 503).json({
    backend: 'ok',
    mongodb: databaseConnected ? 'connected' : 'disconnected',
    ml,
    ecgSource: 'DEMO',
    esp32: 'not_connected',
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/ecg', ecgRoutes);
app.use('/api/analysis', analysisRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/reports', reportRoutes);

app.use(notFound);
app.use(errorHandler);

const startServer = async () => {
  try {
    getJwtSecret();
  } catch (error) {
    console.error(`Configuration error: ${error.message}`);
    process.exitCode = 1;
    return;
  }

  const databaseConnected = await connectDB();

  const server = app.listen(port, () => {
    console.log(`Server running on port ${port}`);
    if (!databaseConnected) {
      console.log('MongoDB is unavailable; database-backed features will return 503.');
    }
  });

  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      console.error(`Port ${port} is already in use. Please stop the existing backend process before starting another instance.`);
    } else {
      console.error(`Backend server failed to start: ${error.message}`);
    }
    process.exitCode = 1;
  });
};

startServer();
