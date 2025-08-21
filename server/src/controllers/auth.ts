import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../index';

export const register = async (req: Request, res: Response) => {
  try {
    console.log('Requête d\'inscription reçue:', {
      body: req.body,
      headers: req.headers,
    });

    const { email, password, username } = req.body;

    // Validation détaillée des champs
    const validationErrors = [];
    if (!username) validationErrors.push('Le nom d\'utilisateur est requis');
    if (!email) validationErrors.push('L\'email est requis');
    if (!password) validationErrors.push('Le mot de passe est requis');

    if (validationErrors.length > 0) {
      console.log('Erreurs de validation:', validationErrors);
      return res.status(400).json({ 
        message: 'Erreur de validation des champs', 
        details: validationErrors.join(', ')
      });
    }

    // Validation du format de l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.log('Format d\'email invalide:', email);
      return res.status(400).json({ message: 'Format d\'email invalide' });
    }

    // Validation de la longueur du mot de passe
    if (password.length < 6) {
      console.log('Mot de passe trop court');
      return res.status(400).json({ message: 'Le mot de passe doit contenir au moins 6 caractères' });
    }

    // Vérification si l'utilisateur existe déjà
    console.log('Vérification de l\'existence de l\'utilisateur...');
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { username }
        ]
      }
    });

    if (existingUser) {
      console.log('Utilisateur existant trouvé:', {
        existingEmail: existingUser.email === email,
        existingUsername: existingUser.username === username
      });
      return res.status(400).json({ 
        message: 'Utilisateur déjà existant',
        details: existingUser.email === email ? 'Email déjà utilisé' : 'Nom d\'utilisateur déjà utilisé'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        username,
        password: hashedPassword,
      },
      select: {
        id: true,
        email: true,
        username: true,
      }
    });

    // Generate token
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET!);

    res.status(201).json({ user, token });
  } catch (error) {
    console.error('Error during registration:', error);
    res.status(500).json({ 
      message: 'Erreur lors de l\'inscription',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(400).json({ message: 'Email ou mot de passe incorrect' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: 'Email ou mot de passe incorrect' });
    }

    // Generate token
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET!);

    res.json({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
      },
      token
    });
  } catch (error) {
    console.error('Erreur lors de l\'inscription:', error);
    if (error instanceof Error) {
      return res.status(500).json({ 
        message: 'Erreur lors de l\'inscription',
        details: error.message 
      });
    }
    res.status(500).json({ 
      message: 'Erreur interne du serveur',
      details: 'Une erreur inattendue s\'est produite' 
    });
  }
};
