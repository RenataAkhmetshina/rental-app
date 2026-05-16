const express = require('express');
const router = express.Router();
const Lease = require('../models/Lease');
const Property = require('../models/Property');
const { protect } = require('../middleware/auth');
const { broadcastToAll } = require('../utils/websocket');

// GET /api/leases - user's leases 
router.get('/', protect, async (req, res, next) => {
  try {
    const { role } = req.query; 
    let filter = {};

    if (role === 'owner') {
      const properties = await Property.find({ owner: req.user._id }).select('_id');
      const propertyIds = properties.map((p) => p._id);
      filter = { property: { $in: propertyIds } };
    } else {
      filter = { tenant: req.user._id };
    }

    const leases = await Lease.find(filter)
      .populate('tenant', 'name email avatar phone')
      .populate({
        path: 'property',
        populate: { path: 'owner', select: 'name email avatar phone' },
      })
      .sort('-createdAt');

    res.json({ leases });
  } catch (err) {
    next(err);
  }
});

// POST /api/leases - create lease request 
router.post('/', protect, async (req, res, next) => {
  try {
    const { propertyId, startDate, endDate, notes } = req.body;
    const property = await Property.findById(propertyId);

    if (!property || !property.isAvailable) {
      return res.status(400).json({ message: 'Property not available' });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    let months = (end.getFullYear() - start.getFullYear()) * 12;
    months += end.getMonth() - start.getMonth();

    if (end.getDate() < start.getDate()) {
      months--;
    }

    const finalMonths = Math.max(1, months);
    const totalPrice = Math.round(finalMonths * property.pricePerMonth);

    const lease = await Lease.create({
      tenant: req.user._id,
      property: propertyId,
      startDate: start,
      endDate: end,
      totalPrice,
      notes,
    });

    await lease.populate('tenant', 'name email avatar');
    await lease.populate({
        path: 'property',
        populate: { path: 'owner', select: 'name email avatar' },
    });

    const wss = req.app.get('wss');
    if (wss) {
      broadcastToAll(wss, { type: 'LEASE_CREATED', lease });
    }

    res.status(201).json({ lease });
  } catch (err) {
    next(err);
  }
});

// PUT /api/leases/:id/status 
router.put('/:id/status', protect, async (req, res, next) => {
  try {
    const { status } = req.body;
    const lease = await Lease.findById(req.params.id).populate('property');

    if (!lease) return res.status(404).json({ message: 'Lease not found' });

    if (lease.property.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    lease.status = status;
    if (status === 'active') {
      await Property.findByIdAndUpdate(lease.property._id, { isAvailable: false });
    } else if (status === 'completed' || status === 'cancelled') {
      await Property.findByIdAndUpdate(lease.property._id, { isAvailable: true });
    }

    await lease.save();
    
    await lease.populate('tenant', 'name email avatar');
    await lease.populate({
        path: 'property',
        populate: { path: 'owner', select: 'name email avatar' },
    });

    const wss = req.app.get('wss');
    if (wss) {
      broadcastToAll(wss, { type: 'LEASE_UPDATED', lease });
      broadcastToAll(wss, { 
        type: 'PROPERTY_UPDATED', 
        property: lease.property 
      });
    }

    res.json({ lease });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/leases/:id 
router.delete('/:id', protect, async (req, res, next) => {
  try {
    const lease = await Lease.findById(req.params.id);
    if (!lease) return res.status(404).json({ message: 'Lease not found' });

    const leaseId = lease._id;
    await Lease.findByIdAndDelete(req.params.id);

    const wss = req.app.get('wss');
    if (wss) {
      broadcastToAll(wss, { type: 'LEASE_DELETED', leaseId });
    }

    res.json({ message: 'Lease cancelled' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;