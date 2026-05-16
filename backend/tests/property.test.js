const mongoose = require('mongoose');
const Property = require('../models/Property');
const User = require('../models/User');

beforeAll(async () => {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/rental_test_props');
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
});

afterEach(async () => {
  await Property.deleteMany({});
  await User.deleteMany({});
});

// --- Unit: Property model validation ---
describe('Property model validation', () => {
  let ownerId;

  beforeEach(async () => {
    const user = await User.create({ name: 'Owner', email: 'owner@test.com', password: 'pass123' });
    ownerId = user._id;
  });

  test('should fail without required fields', () => {
    const p = new Property({});
    const err = p.validateSync();
    expect(err.errors.owner).toBeDefined();
    expect(err.errors.title).toBeDefined();
    expect(err.errors.type).toBeDefined();
  });

  test('should fail with invalid type', () => {
    const p = new Property({
      owner: ownerId,
      title: 'Test Property',
      description: 'A great place to live with good amenities nearby',
      address: '123 Main St',
      city: 'Almaty',
      pricePerMonth: 500,
      rooms: 2,
      area: 60,
      type: 'castle',
    });
    const err = p.validateSync();
    expect(err.errors.type).toBeDefined();
  });

  test('should pass with valid data', () => {
    const p = new Property({
      owner: ownerId,
      title: 'Nice Apartment',
      description: 'A great place to live with good amenities nearby',
      address: '123 Main St',
      city: 'Almaty',
      pricePerMonth: 500,
      rooms: 2,
      area: 60,
      type: 'apartment',
    });
    const err = p.validateSync();
    expect(err).toBeUndefined();
  });

  test('should default isAvailable to true', () => {
    const p = new Property({
      owner: ownerId,
      title: 'Test',
      description: 'A great place to live with good amenities',
      address: '1 St',
      city: 'City',
      pricePerMonth: 100,
      rooms: 1,
      area: 20,
      type: 'room',
    });
    expect(p.isAvailable).toBe(true);
  });
});
