"use strict";

require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });

const { PrismaClient } = require("@prisma/client");

/** @type {import('@prisma/client').PrismaClient} */
const prisma = new PrismaClient();

async function main() {}

main()
  .catch((e) => {
    console.error("[seed]", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
