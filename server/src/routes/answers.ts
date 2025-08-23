import { Router, Request, Response } from 'express';
import { prisma } from '../index';
import { auth } from '../middleware/auth';
import type { Prisma } from '@prisma/client';

const router = Router();

interface AuthRequest extends Request {
  user?: {
    id: number;
  };
}

// Get answers for a question
router.get('/question/:questionId', async (req: Request, res: Response) => {
  const questionId = Number(req.params.questionId);

  try {
    const answers = await prisma.answer.findMany({
      where: {
        questionId: questionId,
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
        id: Number(req.params.id),
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
  const { content } = req.body;
  const questionId = Number(req.body.questionId);
  const authorId = req.user?.id;

  if (!authorId) {
    return res.status(401).json({ error: 'User not authenticated' });
  }

  try {
    const answer = await prisma.answer.create({
      data: {
        content,
        questionId,
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
  const answerId = Number(req.params.id);

  try {
    // Verify answer ownership
    const answer = await prisma.answer.findUnique({
      where: { id: Number(answerId) },
      select: { authorId: true },
    });

    if (!answer) {
      return res.status(404).json({ error: 'Answer not found' });
    }

    if (Number((answer as any).authorId) !== authorId) {
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
  const answerId = Number(req.params.id);

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
    await prisma.$transaction(async (tx) => {
      // Delete related comments
      await tx.comment.deleteMany({
        where: { answerId },
      });

      // Delete related votes
      await tx.vote.deleteMany({
        where: { answerId },
      });

      // Finally, delete the answer
      await tx.answer.delete({
        where: { id: answerId },
      });
    });

    res.json({ message: 'Answer deleted successfully' });
  } catch (error) {
    console.error('Error deleting answer:', error);
    res.status(500).json({ error: 'Error deleting answer' });
  }
});

// Get vote status for an answer
router.get('/:id/vote', auth, async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  const answerId = Number(req.params.id);

  if (!userId) {
    return res.status(401).json({ error: 'User not authenticated' });
  }

  try {
    const userVote = await prisma.vote.findFirst({
      where: {
        authorId: userId,
        answerId,
      },
    });

    const voteCount = await prisma.vote.aggregate({
      where: {
        answerId,
      },
      _sum: {
        value: true,
      },
    });

    res.json({
      userVote: userVote ? userVote.value : 0,
      totalVotes: voteCount._sum.value || 0,
    });
  } catch (error) {
    console.error('Error getting vote status:', error);
    res.status(500).json({ error: 'Error getting vote status' });
  }
});

// Vote on an answer
router.post('/:id/vote', auth, async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  const answerId = Number(req.params.id);
  const { value } = req.body;

  if (!userId) {
    return res.status(401).json({ error: 'User not authenticated' });
  }

  try {
    const existingVote = await prisma.vote.findFirst({
      where: {
        authorId: userId,
        answerId,
      },
    });

    if (existingVote) {
      if (existingVote.value === value) {
        await prisma.vote.delete({
          where: {
            id: existingVote.id,
          },
        });
      } else {
        await prisma.vote.update({
          where: {
            id: existingVote.id,
          },
          data: {
            value,
          },
        });
      }
    } else {
      await prisma.vote.create({
        data: {
          value,
          authorId: userId,
          answerId,
        },
      });
    }

    const voteCount = await prisma.vote.aggregate({
      where: {
        answerId,
      },
      _sum: {
        value: true,
      },
    });

    res.json({ 
      success: true, 
      totalVotes: voteCount._sum.value || 0 
    });
  } catch (error) {
    console.error('Error voting on answer:', error);
    res.status(500).json({ error: 'Error voting on answer' });
  }
});

// Mark answer as accepted
router.patch('/:id/accept', auth, async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  const answerId = Number(req.params.id);

  if (!userId) {
    return res.status(401).json({ error: 'User not authenticated' });
  }

  try {
    // Get the answer and its question
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

    // Update answer as accepted
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

// Mark answer as accepted
router.patch('/:id/accept', auth, async (req: AuthRequest, res: Response) => {
  const answerId = Number(req.params.id);
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
    if (answer.question?.authorId !== userId) {
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