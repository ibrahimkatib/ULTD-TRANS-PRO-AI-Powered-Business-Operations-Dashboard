import "dotenv/config";
import { defineConfig, env } from "prisma/config";


export default defineConfig({
  datasource: {
    url: process.env.DATABASE_URL,
  },
  migrations: {
    seed: "node --import tsx prisma/seed.ts",
  },
});
