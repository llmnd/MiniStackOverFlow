import type { Request, Response } from 'express';
import { Router } from 'express';
import { prisma } from '../index';
import { auth } from '../middleware/auth';
import type { Prisma } from '@prisma/client';

const router = Router();

interface AuthRequest extends Request {
  user?: {
    id: number;
  };
}

// Get all questions with relations
router.get('/', async (req: Request, res: Response) => {
  try {
    console.log('Fetching questions with possible filters...');
    // Accept optional query params: query (keyword), tag, domain, sort (newest|votes|unanswered)
    const q = (req.query.query as string) || '';
    const tag = (req.query.tag as string) || '';
    const domain = (req.query.domain as string) || '';
    const sort = (req.query.sort as string) || 'newest';

    const where: any = {};

    if (q) {
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { content: { contains: q, mode: 'insensitive' } },
      ];
    }

    if (domain) {
      where.domain = domain;
    }

    if (tag) {
      where.tags = {
        some: {
          tag: {
            name: tag.toLowerCase(),
          },
        },
      };
    }

    // Unanswered filter handled by where.answers.none
    if (sort === 'unanswered') {
      where.AND = where.AND || [];
      where.AND.push({ answers: { none: {} } });
    }

    let orderBy: Prisma.Enumerable<Prisma.QuestionOrderByWithRelationInput> = [];
    
    if (sort === 'votes') {
      orderBy = [{
        votes: {
          _count: 'desc'
        }
      }, { createdAt: 'desc' }];
    } else {
      orderBy = [{ createdAt: 'desc' }];
    }

    console.log('Query params for questions:', { q, tag, domain, sort });
    console.log('Prisma where about to be used:', JSON.stringify(where));
    console.log('Prisma orderBy about to be used:', JSON.stringify(orderBy));

    const questions = await prisma.question.findMany({
      where: where,
      orderBy: orderBy,
      include: {
        author: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
        _count: {
          select: {
            answers: true,
            votes: true,
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
      }
    });
    console.log('Questions fetched successfully:', questions.length);
    res.json(questions);
  } catch (error: unknown) {
    console.error('Error fetching questions:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message, error.stack);
    }
    res.status(500).json({ 
      error: 'Error fetching questions',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get a specific question by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const question = await prisma.question.findUnique({
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
  const { title, content, tags, domain } = req.body;
  const authorId = req.user?.id;

  if (!authorId) {
    return res.status(401).json({ error: 'Utilisateur non authentifié' });
  }

  // authorId is checked above; create a narrowed/typed alias so TypeScript
  // treats it as a non-null number inside async callbacks (e.g. transactions).
  const authorIdNumber: number = authorId as number;

  // Validation
  if (!title || title.length < 15) {
    return res.status(400).json({ error: 'Le titre doit contenir au moins 15 caractères' });
  }

  if (!content || content.length < 30) {
    return res.status(400).json({ error: 'Le contenu doit contenir au moins 30 caractères' });
  }

  if (!domain) {
    return res.status(400).json({ error: 'Le domaine est obligatoire' });
  }

  try {
    // Create question and connect tags in a transaction
    const question = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Create the question
      const newQuestion = await tx.question.create({
        data: {
          title,
          content,
          domain: domain || 'Other',  // Utilisation d'une valeur par défaut si non spécifié
          authorId: authorIdNumber,
        },
      });

      // Process tags
      if (tags && Array.isArray(tags)) {
        for (const tagName of tags) {
          // Find or create tag
          const tag = await tx.tag.upsert({
            where: { name: tagName.toLowerCase() },
            create: { name: tagName.toLowerCase() },
            update: {},
          });

          // Create question-tag relation
          await tx.questionTag.create({
            data: {
              questionId: newQuestion.id,
              tagId: tag.id,
            },
          });
        }
      }

      // Return the created question with all relations
      return tx.question.findUnique({
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
  const questionId = Number(req.params.id);

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
  const questionId = Number(req.params.id);

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

// Get vote status for a question
router.get('/:id/vote', auth, async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  const questionId = Number(req.params.id);

  if (!userId) {
    return res.status(401).json({ error: 'User not authenticated' });
  }

  try {
    // Get user's vote
    const userVote = await prisma.vote.findFirst({
      where: {
        authorId: userId,
        questionId,
      },
    });

    // Get total votes
    const voteCount = await prisma.vote.aggregate({
      where: {
        questionId,
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

// Vote on a question
router.post('/:id/vote', auth, async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  const questionId = Number(req.params.id);
  const { value } = req.body; // value should be 1 for upvote, -1 for downvote

  if (!userId) {
    return res.status(401).json({ error: 'User not authenticated' });
  }

  try {
    console.log('Attempting to vote:', { userId, questionId, value });
    
    // Check if user has already voted on this question
    const existingVote = await prisma.vote.findFirst({
      where: {
        authorId: userId,
        questionId,
      },
    });
    
    console.log('Existing vote:', existingVote);

    if (existingVote) {
      if (existingVote.value === value) {
        console.log('Removing existing vote');
        // Remove the vote if clicking the same button again
        await prisma.vote.delete({
          where: {
            id: existingVote.id,
          },
        });
      } else {
        console.log('Updating vote value');
        // Update the vote if changing from upvote to downvote or vice versa
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
      console.log('Creating new vote');
      try {
        const newVote = await prisma.vote.create({
          data: {
            value,
            authorId: userId,
            questionId,
          },
        });
        console.log('New vote created:', newVote);
      } catch (createError) {
        console.error('Error creating vote:', createError);
        throw createError;
      }
    }

    // Get updated vote count
    const voteCount = await prisma.vote.aggregate({
      where: {
        questionId,
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
    console.error('Error voting on question:', error);
    res.status(500).json({ error: 'Error voting on question' });
  }
});

export default router;
