import express from 'express';
import { prisma } from '../index';
import { auth } from '../middleware/auth';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = express.Router();

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/avatars';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, 'avatar-' + Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!allowedTypes.includes(file.mimetype)) {
      const error = new Error('Invalid file type') as any;
      error.code = 'INVALID_FILE_TYPE';
      return cb(error, false);
    }
    cb(null, true);
  }
});

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

// Upload avatar
router.post('/avatar', auth, upload.single('avatar'), async (req: any, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  try {
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        avatar: `/uploads/avatars/${req.file.filename}`
      }
    });

    res.json({ avatarUrl: user.avatar });
  } catch (error) {
    console.error('Error uploading avatar:', error);
    res.status(500).json({ error: 'Error uploading avatar' });
  }
});

// Update user profile
router.put('/profile', auth, async (req: any, res) => {
  const userId = req.user?.id;
  const { username, email, bio } = req.body;

  try {
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        username: username,
        email: email,
        ...(bio !== undefined ? { bio } : {}),
      }
    });

    const { password, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Error updating profile' });
  }
});

// Get user's reputation
router.get('/reputation', auth, async (req: any, res) => {
  const userId = req.user?.id;

  try {
    const votes = await prisma.vote.findMany({
      where: {
        OR: [
          {
            question: {
              authorId: userId
            }
          },
          {
            answer: {
              authorId: userId
            }
          }
        ]
      }
    });

    const reputation = votes.reduce((acc, vote) => acc + vote.value, 0);

    res.json({ reputation });
  } catch (error) {
    console.error('Error fetching reputation:', error);
    res.status(500).json({ error: 'Error fetching reputation' });
  }
});

// Get user's activity (counts, reputation, last seen)
router.get('/:id/activity', auth, async (req: any, res) => {
  const requestedId = Number(req.params.id);
  const requesterId = req.user?.id;

  if (!requesterId) {
    return res.status(401).json({ error: 'Utilisateur non authentifié' });
  }

  // Only allow users to fetch their own activity for now
  if (requesterId !== requestedId) {
    return res.status(403).json({ error: 'Not authorized to view this activity' });
  }

  try {
    const user = await prisma.user.findUnique({ where: { id: requestedId } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const [questionsCount, answersCount, votesGiven, bestAnswers] = await Promise.all([
      prisma.question.count({ where: { authorId: requestedId } }),
      prisma.answer.count({ where: { authorId: requestedId } }),
      prisma.vote.count({ where: { authorId: requestedId } }),
      prisma.answer.count({ where: { authorId: requestedId, isAccepted: true } }),
    ]);

    // Sum of vote values received on user's questions and answers
    const votesReceivedItems = await prisma.vote.findMany({
      where: {
        OR: [
          { question: { authorId: requestedId } },
          { answer: { authorId: requestedId } }
        ]
      },
      select: { value: true }
    });

    const votesReceived = votesReceivedItems.reduce((acc, v) => acc + v.value, 0);

    const activity = {
      questionsCount,
      answersCount,
      votesReceived,
      votesGiven,
      bestAnswers,
      reputation: votesReceived,
      lastSeenAt: user.updatedAt ? user.updatedAt.toISOString() : null,
    };

    res.json(activity);
  } catch (error) {
    console.error('Error fetching user activity:', error);
    res.status(500).json({ error: 'Error fetching user activity' });
  }
});

// Public: list users (lightweight)
router.get('/', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        avatar: true,
        createdAt: true,
      },
      orderBy: { username: 'asc' }
    });

    res.json(users);
  } catch (error) {
    console.error('Error fetching users list:', error);
    res.status(500).json({ error: 'Error fetching users list' });
  }
});

// Public: get a user's public profile by id
router.get('/:id', async (req, res) => {
  const id = Number(req.params.id);
  try {
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        questions: true,
        answers: true,
      },
    });

    if (!user) return res.status(404).json({ error: 'User not found' });

    const { password, ...publicUser } = user as any;
    res.json(publicUser);
  } catch (error) {
    console.error('Error fetching user profile by id:', error);
    res.status(500).json({ error: 'Error fetching user profile' });
  }
});

export default router;

