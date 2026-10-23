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
  profilePhoto: user.profilePhoto || null,
});

export const isValidProfilePhoto = (value) => {
  if (value === null) {
    return true;
  }

  if (typeof value !== 'string') {
    return false;
  }

  const match = value.match(
    /^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/]+={0,2})$/,
  );

  if (!match) {
    return false;
  }

  const [, format, encodedImage] = match;
  const image = Buffer.from(encodedImage, 'base64');

  if (
    image.length === 0 ||
    image.length > 512 * 1024 ||
    image.toString('base64') !== encodedImage
  ) {
    return false;
  }

  if (format === 'jpeg') {
    return image[0] === 0xff &&
      image[1] === 0xd8 &&
      image[2] === 0xff;
  }

  if (format === 'png') {
    return image.subarray(0, 8).equals(
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    );
  }

  return (
    image.subarray(0, 4).toString('ascii') === 'RIFF' &&
    image.subarray(8, 12).toString('ascii') === 'WEBP'
  );
};

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

export const updateCurrentUser = async (req, res, next) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ message: 'Authentication is unavailable while MongoDB is disconnected.' });
    }

    const { name, email, age, gender, profilePhoto } = req.body;
    const normalizedName = typeof name === 'string' ? name.trim() : '';
    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    const normalizedGender = typeof gender === 'string' ? gender.trim() : '';
    const numericAge = Number(age);

    if (!normalizedName || normalizedName.length > 120) {
      return res.status(400).json({ message: 'Name is required and must be 120 characters or fewer.' });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return res.status(400).json({ message: 'A valid email address is required.' });
    }

    if (!Number.isInteger(numericAge) || numericAge < 0 || numericAge > 120) {
      return res.status(400).json({ message: 'Age must be a whole number between 0 and 120.' });
    }

    if (!normalizedGender || normalizedGender.length > 50) {
      return res.status(400).json({ message: 'Gender is required and must be 50 characters or fewer.' });
    }

    if (
      Object.hasOwn(req.body, 'profilePhoto') &&
      !isValidProfilePhoto(profilePhoto)
    ) {
      return res.status(400).json({
        message: 'Profile photo must be a JPEG, PNG, or WebP image no larger than 512 KB.',
      });
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const existingUser = await User.findOne({
      email: normalizedEmail,
      _id: { $ne: user._id },
    });
    if (existingUser) {
      return res.status(409).json({ message: 'User already exists with this email.' });
    }

    user.name = normalizedName;
    user.email = normalizedEmail;
    user.age = numericAge;
    user.gender = normalizedGender;
    if (Object.hasOwn(req.body, 'profilePhoto')) {
      user.profilePhoto = profilePhoto;
    }

    await user.save();
    return res.status(200).json(serializeUser(user));
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({ message: 'User already exists with this email.' });
    }

    return next(error);
  }
};
