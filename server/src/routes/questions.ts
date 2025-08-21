import type { Request, Response } from 'express';
import { Router } from 'express';
import { prisma } from '../index';
import { auth } from '../middleware/auth';
import type { Prisma } from '@prisma/client';

const router = Router();

interface AuthRequest extends Request {
  user?: {
    id: string;
  };
}

// Get all questions with relations
router.get('/', async (req: Request, res: Response) => {
  try {
    const questions = await prisma.question.findMany({
      include: {
        author: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
        answers: {
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
        tags: {
          include: {
            tag: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    res.json(questions);
  } catch (error: unknown) {
    console.error('Error fetching questions:', error);
    res.status(500).json({ error: 'Error fetching questions' });
  }
});

// Get a specific question by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const question = await prisma.question.findUnique({
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
        answers: {
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
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }

    res.json(question);
  } catch (error: unknown) {
    console.error('Error fetching question:', error);
    res.status(500).json({ error: 'Error fetching question' });
  }
});

// Create a question with tags
router.post('/', auth, async (req: AuthRequest, res: Response) => {
  const { title, content, tags } = req.body;
  const authorId = req.user?.id;

  if (!authorId) {
    return res.status(401).json({ error: 'User not authenticated' });
  }

  try {
    // Create question and connect tags in a transaction
    const question = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Create the question
      const newQuestion = await tx.question.create({
        data: {
          title,
          content,
          authorId,
        },
      });

      // Process tags
      if (tags && Array.isArray(tags)) {
        for (const tagName of tags) {
          // Find or create tag
          const tag = await prisma.tag.upsert({
            where: { name: tagName.toLowerCase() },
            create: { name: tagName.toLowerCase() },
            update: {},
          });

          // Create question-tag relation
          await prisma.questionTag.create({
            data: {
              questionId: newQuestion.id,
              tagId: tag.id,
            },
          });
        }
      }

      // Return the created question with all relations
      return prisma.question.findUnique({
        where: { id: newQuestion.id },
        include: {
          author: {
            select: {
              id: true,
              username: true,
            },
          },
          tags: {
            include: {
              tag: true,
            },
          },
        },
      });
    });

    res.json(question);
  } catch (error) {
    console.error('Error creating question:', error);
    res.status(500).json({ error: 'Error creating question' });
  }
});

// Update a question
router.put('/:id', auth, async (req: AuthRequest, res: Response) => {
  const { title, content, tags } = req.body;
  const authorId = req.user?.id;
  const questionId = req.params.id;

  try {
    // Verify question ownership
    const question = await prisma.question.findUnique({
      where: { id: questionId },
      select: { authorId: true },
    });

    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }

    if (question.authorId !== authorId) {
      return res.status(403).json({ error: 'Not authorized to update this question' });
    }

    // Update question and tags in a transaction
    const updatedQuestion = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Update the question
      await prisma.question.update({
        where: { id: questionId },
        data: {
          title,
          content,
        },
      });

      if (tags && Array.isArray(tags)) {
        // Remove existing tags
        await prisma.questionTag.deleteMany({
          where: { questionId },
        });

        // Add new tags
        for (const tagName of tags) {
          const tag = await prisma.tag.upsert({
            where: { name: tagName.toLowerCase() },
            create: { name: tagName.toLowerCase() },
            update: {},
          });

          await prisma.questionTag.create({
            data: {
              questionId,
              tagId: tag.id,
            },
          });
        }
      }

      // Return updated question with relations
      return prisma.question.findUnique({
        where: { id: questionId },
        include: {
          author: {
            select: {
              id: true,
              username: true,
            },
          },
          tags: {
            include: {
              tag: true,
            },
          },
        },
      });
    });

    res.json(updatedQuestion);
  } catch (error) {
    console.error('Error updating question:', error);
    res.status(500).json({ error: 'Error updating question' });
  }
});

// Delete a question
router.delete('/:id', auth, async (req: AuthRequest, res: Response) => {
  const authorId = req.user?.id;
  const questionId = req.params.id;

  try {
    // Verify question ownership
    const question = await prisma.question.findUnique({
      where: { id: questionId },
      select: { authorId: true },
    });

    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }

    if (question.authorId !== authorId) {
      return res.status(403).json({ error: 'Not authorized to delete this question' });
    }

    // Delete question and related data in a transaction
    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Delete related QuestionTags
      await prisma.questionTag.deleteMany({
        where: { questionId },
      });

      // Delete related comments
      await prisma.comment.deleteMany({
        where: { questionId },
      });

      // Delete related votes
      await prisma.vote.deleteMany({
        where: { questionId },
      });

      // Delete related answers (and their comments and votes)
      const answers = await prisma.answer.findMany({
        where: { questionId },
        select: { id: true },
      });

      for (const answer of answers) {
        await prisma.comment.deleteMany({
          where: { answerId: answer.id },
        });
        await prisma.vote.deleteMany({
          where: { answerId: answer.id },
        });
      }

      await prisma.answer.deleteMany({
        where: { questionId },
      });

      // Finally, delete the question
      await prisma.question.delete({
        where: { id: questionId },
      });
    });

    res.json({ message: 'Question deleted successfully' });
  } catch (error) {
    console.error('Error deleting question:', error);
    res.status(500).json({ error: 'Error deleting question' });
  }
});

// Search questions by title or content
router.get('/search/:query', async (req: Request, res: Response) => {
  const { query } = req.params;

  try {
    const questions = await prisma.question.findMany({
      where: {
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { content: { contains: query, mode: 'insensitive' } },
        ],
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
          },
        },
        tags: {
          include: {
            tag: true,
          },
        },
        _count: {
          select: {
            answers: true,
            votes: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json(questions);
  } catch (error: unknown) {
    console.error('Error searching questions:', error);
    res.status(500).json({ error: 'Error searching questions' });
  }
});

export default router;
