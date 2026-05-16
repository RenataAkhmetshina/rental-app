const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const Property = require('../models/Property');
const { protect } = require('../middleware/auth');
const { broadcastToAll } = require('../utils/websocket');

// GET /api/reviews/property/:propertyId
router.get('/property/:propertyId', async (req, res, next) => {
  try {
    const reviews = await Review.find({ property: req.params.propertyId })
      .populate('author', 'name avatar')
      .sort('-createdAt');
    res.json({ reviews });
  } catch (err) {
    next(err);
  }
});

// POST /api/reviews - create review
router.post('/', protect, async (req, res, next) => {
  try {
    const { propertyId, rating, comment, photos } = req.body;

    const property = await Property.findById(propertyId);
    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }

    const existing = await Review.findOne({
      author: req.user._id,
      property: propertyId,
    });
    if (existing) {
      return res.status(409).json({ message: 'You have already reviewed this property' });
    }

    const review = await Review.create({
      author: req.user._id,
      property: propertyId,
      rating,
      comment,
      photos: photos || [],
    });

    await review.populate('author', 'name avatar');
    res.status(201).json({ review });
  } catch (err) {
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    next(err);
  }
});

// PUT /api/reviews/:id - update review
router.put('/:id', protect, async (req, res, next) => {
  try {
    const { comment, rating } = req.body;
    let review = await Review.findById(req.params.id);

    if (!review) return res.status(404).json({ message: 'Review not found' });
    if (review.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    review.comment = comment;
    review.rating = rating;
    await review.save();
    
    review = await review.populate('author', 'name avatar');

    const wss = req.app.get('wss');
    if (wss) {
      broadcastToAll(wss, { type: 'REVIEW_UPDATED', review });
    }

    res.json({ review });
  } catch (err) { next(err); }
});

// DELETE /api/reviews/:id 
router.delete('/:id', protect, async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ message: 'Review not found' });

    if (review.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const propertyId = review.property; 
    const reviewId = review._id;

    await Review.findOneAndDelete({ _id: req.params.id });

    const wss = req.app.get('wss');
    if (wss) {
      broadcastToAll(wss, { 
        type: 'REVIEW_DELETED', 
        reviewId,
        propertyId 
      });
    }

    res.json({ message: 'Review deleted', reviewId });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
