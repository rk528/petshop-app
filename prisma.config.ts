// Pet Shop POS System - Prisma Configuration
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: "postgresql://postgres:yoyo21@localhost:5432/petshop_1?schema=public",
  },
});
