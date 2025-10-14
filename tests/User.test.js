
import { updateUserProfile, updateNotificationPrefs, createUser, findUserByEmail } from '../models/User.js';
import { dbPool as pool } from '../config/db.js';

jest.mock('../config/db.js');

describe('User Model', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('updateUserProfile', () => {
    it('should update user profile with valid data', async () => {
      const mockUser = { id: 1, firstName: 'John', lastName: 'Doe', email: 'john.doe@example.com' };
      pool.query.mockResolvedValue({ rows: [mockUser] });

      const result = await updateUserProfile(1, { firstName: 'John' });
      expect(result).toEqual(mockUser);
      expect(pool.query).toHaveBeenCalledWith(expect.stringContaining('UPDATE users'), expect.any(Array));
    });

    it('should not update user profile with invalid data', async () => {
      const result = await updateUserProfile(1, { invalidColumn: 'someValue' });
      expect(result).toBeNull();
      expect(pool.query).not.toHaveBeenCalled();
    });
  });

  describe('updateNotificationPrefs', () => {
    it('should update notification preferences with valid data', async () => {
      const mockPrefs = { id: 1, email_notifications: true };
      pool.query.mockResolvedValue({ rows: [mockPrefs] });

      const result = await updateNotificationPrefs(1, { emailNotifications: true });
      expect(result).toEqual(mockPrefs);
      expect(pool.query).toHaveBeenCalledWith(expect.stringContaining('UPDATE users'), expect.any(Array));
    });

    it('should not update notification preferences with invalid data', async () => {
      const result = await updateNotificationPrefs(1, { invalidPref: 'someValue' });
      expect(result).toBeNull();
      expect(pool.query).not.toHaveBeenCalled();
    });
  });
});
