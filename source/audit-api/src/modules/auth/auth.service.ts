import { prisma } from '../../prisma/client.js';
import bcrypt from 'bcrypt';
import { LoginRequest } from './auth.dto.js';

export class AuthService {
  async validateUser(username: string, password: string) {
    // Find user by username
    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      return null;
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.passwordHash);
    
    if (!isValid) {
      return null;
    }

    return user;
  }

  async getUserById(id: number) {
    return prisma.user.findUnique({
      where: { id },
    });
  }

  async getUserByUsername(username: string) {
    return prisma.user.findUnique({
      where: { username },
    });
  }
}

