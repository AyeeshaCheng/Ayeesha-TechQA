import NextAuth, { AuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GitHubProvider from 'next-auth/providers/github';
import bcrypt from 'bcryptjs';
import { prisma } from './prisma';

declare module 'next-auth' {
  interface User {
    id: number;
    role: string;
    nickname: string;
  }
  interface Session {
    user: {
      id: number;
      email: string;
      name: string;
      role: string;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: number;
    role: string;
  }
}

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase() },
        });

        if (!user || !user.passwordHash) return null;

        const isValid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!isValid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.nickname,
          role: user.role,
          nickname: user.nickname,
        };
      },
    }),
    GitHubProvider({
      clientId: process.env.AUTH_GITHUB_ID || '',
      clientSecret: process.env.AUTH_GITHUB_SECRET || '',
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === 'github') {
        const email = user.email;
        if (email) {
          const existing = await prisma.user.findUnique({
            where: { email: email.toLowerCase() },
          });
          if (existing) {
            // Auto-link: update githubId for existing email-registered user
            await prisma.user.update({
              where: { id: existing.id },
              data: { githubId: account.providerAccountId },
            });
          }
        }
      }
      return true;
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id as number;
        token.role = (user as { role: string }).role;
      }
      // For GitHub OAuth first-time, look up role from DB
      if (account?.provider === 'github' && !token.role) {
        const dbUser = await prisma.user.findUnique({
          where: { email: token.email?.toLowerCase() || '' },
        });
        if (dbUser) {
          token.id = dbUser.id;
          token.role = dbUser.role;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.AUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
