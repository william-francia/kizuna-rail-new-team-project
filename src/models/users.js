import bcrypt from "bcrypt";
import Role from "./schemas/roles.js";
import User from "./schemas/users.js";

export async function createUser(displayName, username, email, password) {
  const customerRole = await Role.findOne({ name: "customer" });

  if (!customerRole) {
    throw new Error("Customer role is not initialized.");
  }

  const passwordHash = await bcrypt.hash(password, 12);

  return User.create({
    displayName,
    username,
    email: email.trim().toLowerCase(),
    passwordHash,
    role: customerRole._id,
  });
}

export async function findUserByEmail(email) {
  return User.findOne({ email: email.trim().toLowerCase() }).populate("role");
}

export async function verifyPassword(password, passwordHash) {
  return bcrypt.compare(password, passwordHash);
}
