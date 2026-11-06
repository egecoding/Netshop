import { defineAction, ActionError } from 'astro:actions';
import { prisma } from '../lib/db';
import { hashPassword, verifyPassword, createSession, setSessionCookie } from '../lib/auth';
import { mergeGuestCartIntoUserCart } from '../lib/cart';
import { registerSchema, loginSchema } from '../lib/validation';

export const auth = {
  register: defineAction({
    accept: 'form',
    input: registerSchema,
    handler: async (input, context) => {
      const existing = await prisma.user.findUnique({ where: { email: input.email } });
      if (existing) {
        throw new ActionError({ code: 'CONFLICT', message: 'An account with that email already exists' });
      }

      const passwordHash = await hashPassword(input.password);
      const user = await prisma.user.create({
        data: { email: input.email, name: input.name, passwordHash },
      });

      const token = await createSession(user.id);
      setSessionCookie(context.cookies, token);
      await mergeGuestCartIntoUserCart(context.cookies, user.id);

      return { id: user.id, name: user.name };
    },
  }),

  login: defineAction({
    accept: 'form',
    input: loginSchema,
    handler: async (input, context) => {
      const user = await prisma.user.findUnique({ where: { email: input.email } });
      const valid = user ? await verifyPassword(input.password, user.passwordHash) : false;
      if (!user || !valid) {
        throw new ActionError({ code: 'UNAUTHORIZED', message: 'Invalid email or password' });
      }

      const token = await createSession(user.id);
      setSessionCookie(context.cookies, token);
      await mergeGuestCartIntoUserCart(context.cookies, user.id);

      return { id: user.id, name: user.name, role: user.role };
    },
  }),
};
