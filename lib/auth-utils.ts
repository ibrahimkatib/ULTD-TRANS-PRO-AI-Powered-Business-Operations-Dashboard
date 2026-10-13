import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";

export async function requirePrincipal() {
  const session = await getServerSession(authOptions);

  if (!session || !(session.user as any)?.id) {
    throw new Error("UNAUTHORIZED");
  }

  const userId = (session.user as any).id as string;
  const role = (session.user as any).role as string;
  const prisma = getPrisma();

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { organization: { include: { workspaces: true } } }
  });

  const workspaceId = user?.organization?.workspaces[0]?.id;

  if (!workspaceId) {
    throw new Error("NO_WORKSPACE_ASSIGNED");
  }

  return { userId, workspaceId, role };
}