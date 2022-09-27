import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { OPEN_ISSUE } from "~/issues/lib/issues";

const prisma = new PrismaClient();

async function seed () {
  const username = "AllanSimoyi";

  // cleanup the existing database
  await prisma.user.delete({ where: { username } }).catch(() => {
    // no worries if it doesn't exist yet
  });

  const hashedPassword = await bcrypt.hash("racheliscool", 10);

  const user = await prisma.user.create({
    data: {
      username,
      password: hashedPassword,
    },
  });

  await prisma.product.createMany({
    data: [
      {
        name: "Remove Background",
        description: "Easily remove the background from an image",
      },
      {
        name: "Merge PDF",
        description: "Merge 2 or more PDF files into a single PDF file",
      },
      {
        name: "PDF to Word",
        description: "Convert PDF to Word and keep the format",
      },
      {
        name: "JPEG to PDF",
        description: "Convert JPEG images to PDF",
      },
      {
        name: "Compress PDF",
        description: "Reduce the file size of a PDF file",
      },
      {
        name: "Edit PDF",
        description: "Free PDF editor to modify PDF files",
      },
      {
        name: "Split PDF",
        description: "Split into two or more PDF files",
      },
      {
        name: "PDF to JPG",
        description: "Convert PDF to JPG and download each page as an image",
      },
    ],
  });

  const products = await prisma.product.findMany();

  await products.reduce(async (acc, product) => {
    await acc;
    const issueData = {
      productId: product.id,
      state: OPEN_ISSUE,
      title: "The thing is doing this particular thing in a shitty way",
      description: [
        `In ut pellentesque neque. Donec non orci feugiat,`,
        `sodales ipsum quis, tincidunt quam. Aliquam vel sollicitudin diam.`,
        `Quisque hendrerit, sapien id semper convallis, mi libero viverra nisl,`,
        `id varius leo dolor vitae nulla.`
      ].join("")
    }
    await prisma.issue.createMany({
      data: [issueData, issueData, issueData, issueData]
    });
  }, Promise.resolve());

  const issues = await prisma.issue.findMany();

  await issues.reduce(async (acc, issue) => {
    await acc;
    const commentData = {
      issueId: issue.id,
      content: [
        `Aliquam vel sollicitudin diam.`,
        `Quisque hendrerit, sapien id semper convallis, mi libero viverra nisl`
      ].join(""),
      userId: user.id,
    }
    await prisma.comment.createMany({
      data: [commentData, commentData, commentData, commentData, commentData]
    });
  }, Promise.resolve());

  console.log(`Database has been seeded. 🌱`);
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
