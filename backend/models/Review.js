const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Author is required'],
    },
    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Property',
      required: [true, 'Property is required'],
    },
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5'],
    },
    comment: {
      type: String,
      required: [true, 'Comment is required'],
      trim: true,
      minlength: [10, 'Comment must be at least 10 characters'],
      maxlength: [1000, 'Comment cannot exceed 1000 characters'],
    },
    photos: [
      {
        type: String,
      },
    ],
  },
  {
    timestamps: true,
  }
);

reviewSchema.index({ author: 1, property: 1 }, { unique: true });
reviewSchema.index({ property: 1, rating: -1 });

reviewSchema.post('save', async function () {
  const Property = mongoose.model('Property');
  const stats = await mongoose.model('Review').aggregate([
    { $match: { property: this.property } },
    {
      $group: {
        _id: '$property',
        avgRating: { $avg: '$rating' },
        count: { $sum: 1 },
      },
    },
  ]);
  if (stats.length > 0) {
    await Property.findByIdAndUpdate(this.property, {
      averageRating: Math.round(stats[0].avgRating * 10) / 10,
      reviewCount: stats[0].count,
    });
  }
});

reviewSchema.post('findOneAndDelete', async function (doc) {
  if (doc) {
    const Property = mongoose.model('Property');
    const stats = await mongoose.model('Review').aggregate([
      { $match: { property: doc.property } },
      {
        $group: {
          _id: '$property',
          avgRating: { $avg: '$rating' },
          count: { $sum: 1 },
        },
      },
    ]);
    await Property.findByIdAndUpdate(doc.property, {
      averageRating: stats.length > 0 ? Math.round(stats[0].avgRating * 10) / 10 : 0,
      reviewCount: stats.length > 0 ? stats[0].count : 0,
    });
  }
});

module.exports = mongoose.model('Review', reviewSchema);
