import { getPrisma } from "@/lib/prisma";
import type { ToolContext, RegisteredTool } from "@/tools/types";

export const workspaceSearchTool: RegisteredTool = {
    name: "workspace_search",
    description: "Search workspace data. Use this tool to find customers, count total customers, lookup invoices, and search audit logs.",
    parameters: {
        type: "object",
        properties: {
            query: { type: "string", description: "The search keyword, name, or terms like 'customers' or 'invoices'." }
        },
        required: ["query"]
    },
    approvalRequired: false,
    async execute(args: unknown, context: ToolContext) {
        const typedArgs = args as { query?: string; };
        const prisma = getPrisma() as any;
        const rawQuery = (typedArgs?.query ?? "").trim().toLowerCase();

        // Determine if the user is asking a broad question (like "how many customers")
        const isBroadQuery = !rawQuery ||
            rawQuery.includes("how many") ||
            rawQuery.includes("list") ||
            rawQuery.includes("all") ||
            rawQuery.includes("customer") ||
            rawQuery.includes("invoice");

        const customerModel = prisma.customer || prisma.client || prisma.user;

        const [customers, invoices, auditEvents] = await Promise.all([
            customerModel ? customerModel.findMany({
                where: {
                    workspaceId: context.workspaceId,
                    // If it's a specific search term (and not a broad question), filter by it. Otherwise, fetch all workspace records.
                    ...(!isBroadQuery && rawQuery ? {
                        OR: [
                            { name: { contains: rawQuery, mode: "insensitive" } },
                            { company: { contains: rawQuery, mode: "insensitive" } },
                            { email: { contains: rawQuery, mode: "insensitive" } }
                        ]
                    } : {})
                },
                take: 50
            }).catch(() => []) : Promise.resolve([]),

            prisma.invoice ? prisma.invoice.findMany({
                where: {
                    workspaceId: context.workspaceId,
                    ...(!isBroadQuery && rawQuery ? { number: { contains: rawQuery, mode: "insensitive" } } : {})
                },
                take: 10
            }).catch(() => []) : Promise.resolve([]),

            prisma.auditEvent ? prisma.auditEvent.findMany({
                where: {
                    workspaceId: context.workspaceId
                },
                take: 5,
                orderBy: { createdAt: "desc" }
            }).catch(() => []) : Promise.resolve([])
        ]);

        return {
            query: rawQuery,
            summary: `Found a total of ${customers.length} customer(s) and ${invoices.length} invoice(s) in the workspace.`,
            totalCustomersCount: customers.length,
            results: {
                customers: customers.map((c: any) => ({
                    id: c.id,
                    name: c.name ?? c.email ?? "Unknown",
                    company: c.company ?? "N/A"
                })),
                invoices: invoices.map((i: any) => ({
                    number: i.number,
                    amount: i.amount,
                    status: i.status
                }))
            }
        };
    },
    risk: "read-only"
};