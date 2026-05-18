const mongoose = require('mongoose');

const propertySchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Owner is required'],
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      minlength: [5, 'Title must be at least 5 characters'],
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      minlength: [20, 'Description must be at least 20 characters'],
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    address: {
      type: String,
      required: [true, 'Address is required'],
      trim: true,
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true,
      index: true,
    },
    pricePerMonth: {
      type: Number,
      required: [true, 'Price per month is required'],
      min: [1, 'Price must be greater than 0'],
    },
    rooms: {
      type: Number,
      required: [true, 'Number of rooms is required'],
      min: [1, 'Must have at least 1 room'],
      max: [20, 'Cannot exceed 20 rooms'],
    },
    area: {
      type: Number,
      required: [true, 'Area is required'],
      min: [10, 'Area must be at least 10 sqm'],
    },
    images: [
      {
        type: String,
      },
    ],
    type: {
      type: String,
      required: [true, 'Property type is required'],
      enum: {
        values: ['apartment', 'house', 'room'],
        message: 'Type must be apartment, house, or room',
      },
    },
    isAvailable: {
      type: Boolean,
      default: true,
      index: true,
    },
    amenities: [String],
    savedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    reviewCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

propertySchema.index({ city: 1, type: 1, isAvailable: 1 });
propertySchema.index({ pricePerMonth: 1 });
propertySchema.index({ title: 'text', description: 'text', city: 'text' });

module.exports = mongoose.model('Property', propertySchema);
