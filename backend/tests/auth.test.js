const request = require('supertest');
const mongoose = require('mongoose');
const { app } = require('../server');
const User = require('../models/User');

beforeAll(async () => {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/rental_test');
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
});

afterEach(async () => {
  await User.deleteMany({});
});

// --- Unit: User model validation ---
describe('User model validation', () => {
  test('should fail without required fields', async () => {
    const user = new User({});
    const err = user.validateSync();
    expect(err.errors.name).toBeDefined();
    expect(err.errors.email).toBeDefined();
  });

  test('should fail with invalid email', async () => {
    const user = new User({ name: 'Test', email: 'not-an-email', password: 'password123' });
    const err = user.validateSync();
    expect(err.errors.email).toBeDefined();
  });

  test('should pass with valid data', async () => {
    const user = new User({ name: 'Test User', email: 'test@example.com', password: 'password123' });
    const err = user.validateSync();
    expect(err).toBeUndefined();
  });
});

// --- Unit: utility function ---
const { generateToken } = require('../utils/jwt');
const jwt = require('jsonwebtoken');

describe('generateToken utility', () => {
  test('should return a valid JWT string', () => {
    const token = generateToken('507f1f77bcf86cd799439011');
    expect(typeof token).toBe('string');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret');
    expect(decoded.id).toBe('507f1f77bcf86cd799439011');
  });

  test('should include expiry', () => {
    const token = generateToken('abc123');
    const decoded = jwt.decode(token);
    expect(decoded.exp).toBeDefined();
  });
});

// --- Integration: auth endpoints ---
describe('POST /api/auth/register', () => {
  test('should register a new user', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password123',
    });
    expect(res.status).toBe(201);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe('john@example.com');
  });

  test('should reject duplicate email', async () => {
    await User.create({ name: 'John', email: 'john@example.com', password: 'password123' });
    const res = await request(app).post('/api/auth/register').send({
      name: 'John2',
      email: 'john@example.com',
      password: 'password456',
    });
    expect(res.status).toBe(409);
  });

  test('should reject missing fields', async () => {
    const res = await request(app).post('/api/auth/register').send({ email: 'a@b.com' });
    expect(res.status).toBe(400);
  });
});

describe('POST /api/auth/login', () => {
  beforeEach(async () => {
    await User.create({ name: 'Jane', email: 'jane@example.com', password: 'secret123' });
  });

  test('should login with valid credentials', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'jane@example.com',
      password: 'secret123',
    });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
  });

  test('should reject wrong password', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'jane@example.com',
      password: 'wrongpassword',
    });
    expect(res.status).toBe(401);
  });
});
