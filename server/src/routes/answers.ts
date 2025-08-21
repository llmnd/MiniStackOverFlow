import { Router, Request, Response } from 'express';
import { prisma } from '../index';
import { auth } from '../middleware/auth';
import type { Prisma } from '@prisma/client';

const router = Router();

interface AuthRequest extends Request {
  user?: {
    id: string;
  };
}

// Get answers for a question
router.get('/question/:questionId', async (req: Request, res: Response) => {
  const { questionId } = req.params;

  try {
    const answers = await prisma.answer.findMany({
      where: {
        questionId: questionId, // MongoDB ObjectId is already a string
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
        votes: true,
        comments: {
          include: {
            author: {
              select: {
                id: true,
                username: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    res.json(answers);
  } catch (error: unknown) {
    console.error('Error fetching answers:', error);
    res.status(500).json({ error: 'Error fetching answers' });
  }
});

// Get a specific answer
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const answer = await prisma.answer.findUnique({
      where: {
        id: req.params.id,
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
        votes: true,
        comments: {
          include: {
            author: {
              select: {
                id: true,
                username: true,
              },
            },
          },
        },
        question: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    if (!answer) {
      return res.status(404).json({ error: 'Answer not found' });
    }

    res.json(answer);
  } catch (error: unknown) {
    console.error('Error fetching answer:', error);
    res.status(500).json({ error: 'Error fetching answer' });
  }
});

// Create an answer
router.post('/', auth, async (req: AuthRequest, res: Response) => {
  const { content, questionId } = req.body;
  const authorId = req.user?.id;

  if (!authorId) {
    return res.status(401).json({ error: 'User not authenticated' });
  }

  try {
    const answer = await prisma.answer.create({
      data: {
        content,
        questionId, // MongoDB ObjectId is already a string
        authorId,
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });
    res.json(answer);
  } catch (error) {
    console.error('Error creating answer:', error);
    res.status(500).json({ error: 'Error creating answer' });
  }
});

// Update an answer
router.put('/:id', auth, async (req: AuthRequest, res: Response) => {
  const { content } = req.body;
  const authorId = req.user?.id;
  const answerId = req.params.id;

  try {
    // Verify answer ownership
    const answer = await prisma.answer.findUnique({
      where: { id: answerId },
      select: { authorId: true },
    });

    if (!answer) {
      return res.status(404).json({ error: 'Answer not found' });
    }

    if (answer.authorId !== authorId) {
      return res.status(403).json({ error: 'Not authorized to update this answer' });
    }

    // Update the answer
    const updatedAnswer = await prisma.answer.update({
      where: { id: answerId },
      data: { content },
      include: {
        author: {
          select: {
            id: true,
            username: true,
          },
        },
        votes: true,
        comments: true,
      },
    });

    res.json(updatedAnswer);
  } catch (error) {
    console.error('Error updating answer:', error);
    res.status(500).json({ error: 'Error updating answer' });
  }
});

// Delete an answer
router.delete('/:id', auth, async (req: AuthRequest, res: Response) => {
  const authorId = req.user?.id;
  const answerId = req.params.id;

  try {
    // Verify answer ownership
    const answer = await prisma.answer.findUnique({
      where: { id: answerId },
      select: { authorId: true },
    });

    if (!answer) {
      return res.status(404).json({ error: 'Answer not found' });
    }

    if (answer.authorId !== authorId) {
      return res.status(403).json({ error: 'Not authorized to delete this answer' });
    }

    // Delete answer and related data in a transaction
    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Delete related comments
      await prisma.comment.deleteMany({
        where: { answerId },
      });

      // Delete related votes
      await prisma.vote.deleteMany({
        where: { answerId },
      });

      // Finally, delete the answer
      await prisma.answer.delete({
        where: { id: answerId },
      });
    });

    res.json({ message: 'Answer deleted successfully' });
  } catch (error) {
    console.error('Error deleting answer:', error);
    res.status(500).json({ error: 'Error deleting answer' });
  }
});

// Mark answer as accepted
router.patch('/:id/accept', auth, async (req: AuthRequest, res: Response) => {
  const answerId = req.params.id;
  const userId = req.user?.id;

  try {
    const answer = await prisma.answer.findUnique({
      where: { id: answerId },
      include: {
        question: {
          select: {
            authorId: true,
          },
        },
      },
    });

    if (!answer) {
      return res.status(404).json({ error: 'Answer not found' });
    }

    // Only the question author can accept an answer
    if (answer.question.authorId !== userId) {
      return res.status(403).json({ error: 'Only the question author can accept an answer' });
    }

    const updatedAnswer = await prisma.answer.update({
      where: { id: answerId },
      data: { isAccepted: true },
      include: {
        author: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });

    res.json(updatedAnswer);
  } catch (error) {
    console.error('Error accepting answer:', error);
    res.status(500).json({ error: 'Error accepting answer' });
  }
});

export default router;
