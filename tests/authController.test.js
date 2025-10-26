
import request from 'supertest';
import express from 'express';
import authRoutes from '../routes/authRoutes';
import { createUser, findUserByEmail, findUserById } from '../models/User.js';
import { generateToken, generateRefreshToken } from '../utils/jwt.js';
import argon2 from 'argon2';
import cookieParser from 'cookie-parser';

jest.mock('../models/User.js');
jest.mock('../utils/logger.js');
jest.mock('argon2', () => ({
  hash: jest.fn().mockResolvedValue('hashed_password'),
  verify: jest.fn().mockResolvedValue(true),
}));
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn().mockReturnValue('signed_token'),
  verify: jest.fn().mockReturnValue({ id: 1, email: 'test@example.com' }),
}));

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use('/auth', authRoutes);
app.use((err, req, res, next) => {
  res.status(err.statusCode || 500).json({ message: err.message });
});

describe('Auth Controller', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /auth/signup', () => {
    it('should create a new user and return a token', async () => {
      const userData = {
        email: 'test@example.com',
        masterPassword: 'Password123!',
        confirmPassword: 'Password123!',
        hint: 'test hint',
        firstName: 'Test',
        lastName: 'User',
      };

      const createdUser = { id: 1, ...userData, password_hash: 'hashed_password' };

      createUser.mockResolvedValue(createdUser);

      const res = await request(app)
        .post('/auth/signup')
        .send(userData);

      expect(res.statusCode).toEqual(201);
      expect(res.body.user).toHaveProperty('id', 1);
      expect(res.headers['set-cookie']).toBeDefined();
    });

    it('should return 409 if user already exists', async () => {
      const userData = {
        email: 'test@example.com',
        masterPassword: 'Password123!',
        confirmPassword: 'Password123!',
      };

      createUser.mockRejectedValue({ code: '23505' });

      const res = await request(app)
        .post('/auth/signup')
        .send(userData);

      expect(res.statusCode).toEqual(409);
      expect(res.body.message).toBe('User with this email already exists.');
    });
  });

  describe('POST /auth/login', () => {
    it('should login a user and return a token', async () => {
      const loginData = {
        email: 'test@example.com',
        masterPassword: 'Password123!',
      };

      const user = { id: 1, email: loginData.email, password_hash: 'hashed_password' };

      findUserByEmail.mockResolvedValue(user);

      const res = await request(app)
        .post('/auth/login')
        .send(loginData);

      expect(res.statusCode).toEqual(200);
      expect(res.body.user).toHaveProperty('id', 1);
      expect(res.headers['set-cookie']).toBeDefined();
    });

    it('should return 401 for invalid credentials', async () => {
      const loginData = {
        email: 'test@example.com',
        masterPassword: 'WrongPassword123!',
      };

      findUserByEmail.mockResolvedValue(null);

      const res = await request(app)
        .post('/auth/login')
        .send(loginData);

      expect(res.statusCode).toEqual(401);
      expect(res.body.message).toBe('Invalid email or password.');
    });
  });

  describe('POST /auth/logout', () => {
    it('should logout a user', async () => {
      findUserById.mockResolvedValue({ id: 1, email: 'test@example.com' });
      const res = await request(app)
        .post('/auth/logout')
        .set('Cookie', 'token=some-token; refreshToken=some-refresh-token');

      expect(res.statusCode).toEqual(200);
      expect(res.body.message).toBe('Logged out successfully.');
      expect(res.headers['set-cookie']).toEqual([
        'token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT',
        'refreshToken=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT'
      ]);
    });
  });
});
