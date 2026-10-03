import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { getJwtSecret } from '../config/auth.js';
import User from '../models/User.js';

const generateToken = (user) =>
  jwt.sign(
    {
      userId: user._id || user.userId,
      email: user.email,
      name: user.name,
    },
    getJwtSecret(),
    { expiresIn: '7d' },
  );

const serializeUser = (user) => ({
  userId: user._id || user.userId,
  name: user.name,
  email: user.email,
  age: user.age,
  gender: user.gender,
});

export const signupUser = async (req, res, next) => {
  try {
    const { name, email, password, age, gender } = req.body;

    if (!name || !email || !password || age === undefined || !gender) {
      return res.status(400).json({ message: 'Name, email, password, age and gender are required.' });
    }

    if (!Number.isInteger(Number(age)) || Number(age) < 0 || Number(age) > 120) {
      return res.status(400).json({ message: 'Age must be a whole number between 0 and 120.' });
    }

    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ message: 'Authentication is unavailable while MongoDB is disconnected.' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({ message: 'User already exists with this email.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      age: Number(age),
      gender,
    });
    const token = generateToken(user);

    return res.status(201).json({ token, user: serializeUser(user) });
  } catch (error) {
    return next(error);
  }
};

export const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ message: 'Authentication is unavailable while MongoDB is disconnected.' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    const matches = await bcrypt.compare(password, user.password);
    if (!matches) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    const token = generateToken(user);
    return res.status(200).json({ token, user: serializeUser(user) });
  } catch (error) {
    return next(error);
  }
};

export const getCurrentUser = async (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ message: 'Authentication is unavailable while MongoDB is disconnected.' });
  }

  const user = await User.findById(req.user.userId).select('-password');

  if (!user) {
    return res.status(404).json({ message: 'User not found.' });
  }

  return res.status(200).json(serializeUser(user));
};
