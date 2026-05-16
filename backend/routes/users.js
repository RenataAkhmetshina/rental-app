const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Property = require('../models/Property');
const { protect } = require('../middleware/auth');

// GET /api/users/saved - get saved properties 
router.get('/saved', protect, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate({
      path: 'savedProperties',
      populate: { path: 'owner', select: 'name avatar' },
    });
    res.json({ savedProperties: user.savedProperties });
  } catch (err) {
    next(err);
  }
});

// GET /api/users/:id - get user profile 
router.get('/:id', async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password -savedProperties -isOnline');
    if (!user) return res.status(404).json({ message: 'User not found' });

    const propertyCount = await Property.countDocuments({ owner: req.params.id });
    res.json({ user: { ...user.toJSON(), propertyCount } });
  } catch (err) {
    next(err);
  }
});

// PUT /api/users/profile - update current user profile
router.put('/profile', protect, async (req, res, next) => {
  try {
    const { name, phone, avatar } = req.body;
    const user = await User.findById(req.user._id);

    if (name) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (avatar !== undefined) user.avatar = avatar;

    await user.save();
    res.json({ user });
  } catch (err) {
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    next(err);
  }
});

// PUT /api/users/password - change password
router.put('/password', protect, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();
    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
