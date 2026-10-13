import { getPrisma } from "@/lib/prisma";
import type { RegisteredTool } from "./types";

export const customerSearchTool: RegisteredTool = {
  name: "customer_search",

  description:
    "Search contacts in the current workspace by name, email, phone, title, company, and contact type. " +
    "When the user provides a full name such as 'Maya Chen', search both first and last name together. Read-only.",

  risk: "read-only",
  approvalRequired: false,

  parameters: {
    type: "object",
    properties: {
      query: {
        type: "string",
        minLength: 1,
        description:
          "Required search text. Examples: 'Maya Chen', 'maya@northstar.example', 'Northstar Logistics'."
      },
      type: {
        type: "string",
        enum: ["ANY", "LEAD", "CUSTOMER", "PARTNER", "EMPLOYEE", "CANDIDATE"],
        description: "Optional contact type filter."
      },
      limit: {
        type: "integer",
        minimum: 1,
        maximum: 10,
        description: "Maximum number of contacts to return."
      }
    },
    required: ["query", "type", "limit"],
    additionalProperties: false
  },

  async execute(rawArgs, context) {
    const args = rawArgs as {
      query?: string;
      type?: string;
      limit?: number;
    };

    const prisma = getPrisma();

    const query = String(args.query ?? "").trim();

    if (!query) {
      return {
        error: "A search query is required.",
        count: 0,
        contacts: []
      };
    }

    const limit = Math.max(
      1,
      Math.min(10, Number(args.limit) || 5)
    );

    const type =
      args.type && args.type !== "ANY"
        ? args.type
        : undefined;

    const words = query.split(/\s+/).filter(Boolean);

    const nameConditions =
      words.length >= 2
        ? [
            {
              AND: [
                {
                  firstName: {
                    contains: words[0],
                    mode: "insensitive" as const
                  }
                },
                {
                  lastName: {
                    contains: words.slice(1).join(" "),
                    mode: "insensitive" as const
                  }
                }
              ]
            },
            {
              AND: [
                {
                  firstName: {
                    contains: words.slice(1).join(" "),
                    mode: "insensitive" as const
                  }
                },
                {
                  lastName: {
                    contains: words[0],
                    mode: "insensitive" as const
                  }
                }
              ]
            }
          ]
        : [];

    const contacts = await prisma.contact.findMany({
      where: {
        workspaceId: context.workspaceId,

        ...(type ? { type: type as never } : {}),

        OR: [
          ...nameConditions,

          {
            firstName: {
              contains: query,
              mode: "insensitive"
            }
          },
          {
            lastName: {
              contains: query,
              mode: "insensitive"
            }
          },
          {
            email: {
              contains: query,
              mode: "insensitive"
            }
          },
          {
            phone: {
              contains: query,
              mode: "insensitive"
            }
          },
          {
            title: {
              contains: query,
              mode: "insensitive"
            }
          },
          {
            company: {
              name: {
                contains: query,
                mode: "insensitive"
              }
            }
          }
        ]
      },

      include: {
        company: true
      },

      orderBy: [
        { score: "desc" },
        { updatedAt: "desc" }
      ],

      take: limit
    });

    return {
      query,
      count: contacts.length,

      contacts: contacts.map((contact) => ({
        id: contact.id,
        name: `${contact.firstName} ${contact.lastName}`.trim(),
        email: contact.email,
        phone: contact.phone,
        title: contact.title,
        type: contact.type,
        status: contact.status,
        score: contact.score,
        company: contact.company?.name ?? null
      }))
    };
  }
};