import type { User } from "@prisma/client";
import bcrypt from "bcryptjs";

import { prisma } from "~/db.server";

export type { User } from "@prisma/client";

export type UserWithoutPassword = Omit<User, "hashedPassword">;

export async function getUserById (id: User["id"]) {
  return prisma.user.findUnique({ where: { id } });
}

export async function getUserByUsername (username: User["username"]) {
  return prisma.user.findFirst({ where: { username } });
}

type CreateUserProps = Pick<User, "username"> & {
  password: string;
}

export async function createUser (props: CreateUserProps) {
  const { username, password } = props;
  return prisma.user.create({
    data: {
      username: username.toLowerCase().trim(),
      password: await bcrypt.hash(password.trim(), 10),
    },
  });
}

export async function deleteUserByUsername (username: User["username"]) {
  return prisma.user.delete({ where: { username } });
}

export async function verifyLogin (
  username: User["username"],
  password: string,
) {
  const userWithPassword = await prisma.user.findUnique({
    where: { username },
  });
  if (!userWithPassword || !userWithPassword.password) {
    return null;
  }
  const isValid = await bcrypt.compare(
    password,
    userWithPassword.password
  );
  if (!isValid) {
    return null;
  }
  const { password: hashedPassword, ...userWithoutPassword } = userWithPassword;
  return userWithoutPassword;
}
