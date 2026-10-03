import mongoose from 'mongoose';

const connectDB = async () => {
  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;

  if (!mongoUri) {
    console.error('MongoDB connection unavailable: MONGODB_URI is not configured.');
    return false;
  }

  try {
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 15000,
    });
    console.log('MongoDB connected successfully.');
    return true;
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    return false;
  }
};

export default connectDB;
