const express = require('express');
const router = express.Router();
const Property = require('../models/Property');
const { protect, optionalAuth } = require('../middleware/auth');
const { broadcastToAll } = require('../utils/websocket');

// GET /api/properties - list with search/filter
router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const {
      city,
      type,
      minPrice,
      maxPrice,
      rooms,
      isAvailable,
      search,
      page = 1,
      limit = 12,
      sort = '-createdAt',
    } = req.query;

    const filter = {};

    if (city) filter.city = new RegExp(city, 'i');
    if (type) filter.type = type;
    if (isAvailable !== undefined) filter.isAvailable = isAvailable === 'true';
    if (rooms) filter.rooms = parseInt(rooms);
    if (minPrice || maxPrice) {
      filter.pricePerMonth = {};
      if (minPrice) filter.pricePerMonth.$gte = parseInt(minPrice);
      if (maxPrice) filter.pricePerMonth.$lte = parseInt(maxPrice);
    }
    if (search) {
      filter.$or = [
        { title: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') },
        { city: new RegExp(search, 'i') },
        { address: new RegExp(search, 'i') },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Property.countDocuments(filter);
    const properties = await Property.find(filter)
      .populate('owner', 'name avatar email phone')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    res.json({
      properties,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/properties/:id
router.get('/:id', optionalAuth, async (req, res, next) => {
  try {
    const property = await Property.findById(req.params.id)
      .populate('owner', 'name avatar email phone');

    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }

    res.json({ property });
  } catch (err) {
    next(err);
  }
});

// POST /api/properties - create 
router.post('/', protect, async (req, res, next) => {
  try {
    const {
      title, description, address, city, pricePerMonth,
      rooms, area, images, type, amenities,
    } = req.body;

    const property = await Property.create({
      owner: req.user._id,
      title, description, address, city, pricePerMonth,
      rooms, area, images: images || [], type,
      amenities: amenities || [],
    });

    await property.populate('owner', 'name avatar email phone');

    const wss = req.app.get('wss');
    if (wss) {
      broadcastToAll(wss, { 
        type: 'NEW_PROPERTY', 
        property: property 
      });
    }

    res.status(201).json({ property });
  } catch (err) {
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    next(err);
  }
});

// PUT /api/properties/:id 
router.put('/:id', protect, async (req, res, next) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }

    if (property.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this property' });
    }

    const allowed = [
      'title', 'description', 'address', 'city', 'pricePerMonth',
      'rooms', 'area', 'images', 'type', 'isAvailable', 'amenities',
    ];
    allowed.forEach((field) => {
      if (req.body[field] !== undefined) property[field] = req.body[field];
    });

    await property.save();
    await property.populate('owner', 'name avatar email phone');

    const wss = req.app.get('wss');
    if (wss) {
      broadcastToAll(wss, { 
        type: 'PROPERTY_UPDATED', 
        property: property 
      });
    }

    res.json({ property });
  } catch (err) {
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    next(err);
  }
});

// DELETE /api/properties/:id
router.delete('/:id', protect, async (req, res, next) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }

    if (property.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const propertyId = property._id; 
    await Property.findByIdAndDelete(req.params.id);

    const wss = req.app.get('wss');
    if (wss) {
      broadcastToAll(wss, { 
        type: 'PROPERTY_DELETED', 
        propertyId: propertyId 
      });
    }

    res.json({ message: 'Property deleted successfully' });
  } catch (err) {
    next(err);
  }
});

// POST /api/properties/:id/save 
router.post('/:id/save', protect, async (req, res, next) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }

    const userId = req.user._id;
    const User = require('../models/User');

    const isSaved = property.savedBy.includes(userId);

    if (isSaved) {
      property.savedBy.pull(userId);
      await User.findByIdAndUpdate(userId, { $pull: { savedProperties: property._id } });
    } else {
      property.savedBy.push(userId);
      await User.findByIdAndUpdate(userId, { $addToSet: { savedProperties: property._id } });
    }

    await property.save();
    res.json({ isSaved: !isSaved, savedCount: property.savedBy.length });
  } catch (err) {
    next(err);
  }
});

module.exports = router;