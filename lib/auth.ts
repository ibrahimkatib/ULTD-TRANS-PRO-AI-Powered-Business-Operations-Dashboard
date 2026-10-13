import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { getPrisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET || "development_secret_key_12345",
  providers: [
    CredentialsProvider({
      name: "Development Login",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "admin@example.com" }
      },
      async authorize(credentials) {
        if (!credentials?.email) return null;
        const prisma = getPrisma();
        let user = await prisma.user.findUnique({ where: { email: credentials.email } });

        if (!user) {
          const org = await prisma.organization.findFirst();
          if (!org) throw new Error("No organization found. Please run the seed script.");

          user = await prisma.user.create({
            data: {
              email: credentials.email,
              name: credentials.email.split("@")[0],
              role: "OWNER",
              organizationId: org.id
            }
          });
        }
        return { id: user.id, email: user.email, name: user.name, role: user.role };
      }
    })
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
      }
      return session;
    }
  }
};