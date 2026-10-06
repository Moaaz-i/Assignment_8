const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { asyncHandler, getLoggedInUserId, isValidId } = require('../utils/helpers');

const JWT_SECRET = process.env.JWT_SECRET || 'assignment8_sticky_notes_secret';

const publicUser = (user) => {
  const { _id, name, email, phone, age, createdAt, updatedAt } = user;
  return { _id, name, email, phone, age, createdAt, updatedAt };
};

const signToken = (user) =>
  jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
  });

// POST /users/signup
const signup = asyncHandler(async (req, res) => {
  const { name, email, age } = req.body;
  const password = req.body.password ?? req.body.Password;
  const phone = req.body.phone ?? req.body.Phone;

  if (!name || !email || !password || !phone) {
    return res.status(400).json({
      message: 'name, email, password and phone are required',
    });
  }

  const exists = await User.findOne({ email: String(email).toLowerCase().trim() });
  if (exists) {
    return res.status(400).json({ message: 'Email already exists' });
  }

  const hashedPassword = await bcrypt.hash(String(password), 10);

  const user = await User.create({ name, email, password: hashedPassword, phone, age });

  res.status(201).json({
    message: 'User signed up successfully',
    token: signToken(user),
    user: publicUser(user),
  });
});

// POST /users/login  (email + password from the body)
const login = asyncHandler(async (req, res) => {
  const email = req.body.email;
  const password = req.body.password ?? req.body.Password;

  if (!email || !password) {
    return res.status(400).json({ message: 'email and password are required' });
  }

  const user = await User.findOne({ email: String(email).toLowerCase().trim() });
  if (!user) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }

  const matches = await bcrypt.compare(String(password), user.password);
  if (!matches) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }

  res.status(200).json({
    message: 'Logged in successfully',
    token: signToken(user),
    user: publicUser(user),
  });
});

// PATCH /users/:id  (update logged-in user info, except the password)
const updateUser = asyncHandler(async (req, res) => {
  const id = getLoggedInUserId(req);
  if (!id || !isValidId(id)) {
    return res.status(400).json({ message: 'A valid logged-in user id is required' });
  }

  // Password can never be updated through this endpoint.
  const { password, Password, _id, __v, ...updates } = req.body;

  if (updates.email !== undefined) {
    const newEmail = String(updates.email).toLowerCase().trim();
    const duplicated = await User.findOne({
      email: newEmail,
      _id: { $ne: id },
    });
    if (duplicated) {
      return res.status(400).json({ message: 'Email already exists' });
    }
    updates.email = newEmail;
  }

  const user = await User.findByIdAndUpdate(id, { $set: updates }, {
    new: true,
    runValidators: true,
    context: 'query',
  }).select('-password');

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  res.status(200).json({ message: 'User updated successfully', user });
});

// DELETE /users?id=...
const deleteUser = asyncHandler(async (req, res) => {
  const id = getLoggedInUserId(req);
  if (!id || !isValidId(id)) {
    return res.status(400).json({ message: 'A valid logged-in user id is required' });
  }

  const user = await User.findByIdAndDelete(id).select('-password');
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  res.status(200).json({ message: 'User deleted successfully', user });
});

// GET /users?id=...
const getUser = asyncHandler(async (req, res) => {
  const id = getLoggedInUserId(req);
  if (!id || !isValidId(id)) {
    return res.status(400).json({ message: 'A valid logged-in user id is required' });
  }

  const user = await User.findById(id).select('-password');
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  res.status(200).json({ user });
});

module.exports = { signup, login, updateUser, deleteUser, getUser };
