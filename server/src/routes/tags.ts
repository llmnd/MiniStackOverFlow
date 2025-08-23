import { Router } from 'express';
import { prisma } from '../index';

const router = Router();

// Return popular tags with counts
router.get('/', async (req, res) => {
  try {
    const tags = await prisma.tag.findMany({
      select: {
        id: true,
        name: true,
        _count: {
          select: { questions: true }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 50
    });

    res.json(tags.map(t => ({ name: t.name, count: (t as any)._count?.questions || 0 })));
  } catch (error) {
    console.error('Error fetching tags:', error);
    res.status(500).json({ error: 'Error fetching tags' });
  }
});

export default router;
