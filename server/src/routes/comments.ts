import { Router, Request, Response } from 'express';
import { prisma } from '../index';
import { auth } from '../middleware/auth';

const router = Router();

interface AuthRequest extends Request {
  user?: {
    id: number;
  };
}

// Get comments for a question or answer
router.get('/', async (req: Request, res: Response) => {
  const { questionId, answerId } = req.query;

  try {
    const comments = await prisma.comment.findMany({
      where: {
        ...(questionId ? { questionId: Number(questionId) } : {}),
        ...(answerId ? { answerId: Number(answerId) } : {}),
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    res.json(comments);
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ error: 'Error fetching comments' });
  }
});

// Create a comment
router.post('/', auth, async (req: AuthRequest, res: Response) => {
  const { content, questionId, answerId } = req.body;
  const authorId = req.user?.id;

  if (!authorId) {
    return res.status(401).json({ error: 'User not authenticated' });
  }

  if (!content) {
    return res.status(400).json({ error: 'Content is required' });
  }

  if (!questionId && !answerId) {
    return res.status(400).json({ error: 'Question ID or Answer ID is required' });
  }

  try {
    const comment = await prisma.comment.create({
      data: {
        content,
        authorId,
        ...(questionId ? { questionId: Number(questionId) } : {}),
        ...(answerId ? { answerId: Number(answerId) } : {}),
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
    res.json(comment);
  } catch (error) {
    console.error('Error creating comment:', error);
    res.status(500).json({ error: 'Error creating comment' });
  }
});

// Update a comment
router.put('/:id', auth, async (req: AuthRequest, res: Response) => {
  const { content } = req.body;
  const authorId = req.user?.id;
  const commentId = Number(req.params.id);

  try {
    // Verify comment ownership
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      select: { authorId: true },
    });

    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    if (comment.authorId !== authorId) {
      return res.status(403).json({ error: 'Not authorized to update this comment' });
    }

    const updatedComment = await prisma.comment.update({
      where: { id: commentId },
      data: { content },
      include: {
        author: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });

    res.json(updatedComment);
  } catch (error) {
    console.error('Error updating comment:', error);
    res.status(500).json({ error: 'Error updating comment' });
  }
});

// Delete a comment
router.delete('/:id', auth, async (req: AuthRequest, res: Response) => {
  const authorId = req.user?.id;
  const commentId = Number(req.params.id);

  try {
    // Verify comment ownership
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      select: { authorId: true },
    });

    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    if (comment.authorId !== authorId) {
      return res.status(403).json({ error: 'Not authorized to delete this comment' });
    }

    await prisma.comment.delete({
      where: { id: commentId },
    });

    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({ error: 'Error deleting comment' });
  }
});

export default router;
