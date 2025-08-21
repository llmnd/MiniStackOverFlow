import express from 'express';
import { prisma } from '../index';
import { auth } from '../middleware/auth';

const router = express.Router();

// Get user profile
router.get('/profile', auth, async (req: any, res) => {
  const userId = req.user?.id;

  try {
    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      include: {
        questions: true,
        answers: true,
      },
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Remove password from response
    const { password, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching user profile' });
  }
});

export default router;
