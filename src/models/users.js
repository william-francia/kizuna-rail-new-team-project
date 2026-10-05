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

export async function findUserById(userId) {
  return User.findById(userId).populate("role");
}

export async function updateUserProfile(userId, profileData) {
  return User.findByIdAndUpdate(
    userId,
    {
      displayName: profileData.displayName.trim(),
      email: profileData.email.trim().toLowerCase(),
      bio: profileData.bio?.trim() || "",
      avatarUrl: profileData.avatarUrl?.trim() || "",
    },
    { new: true, runValidators: true },
  ).populate("role");
}

export async function changeUserPassword(userId, currentPassword, newPassword) {
  const user = await User.findById(userId);

  if (!user) {
    return { success: false, reason: "not-found" };
  }

  const passwordMatches = await bcrypt.compare(
    currentPassword,
    user.passwordHash,
  );

  if (!passwordMatches) {
    return { success: false, reason: "invalid-password" };
  }

  user.passwordHash = await bcrypt.hash(newPassword, 12);
  await user.save();

  return { success: true };
}

export async function deactivateUser(userId) {
  return User.findByIdAndUpdate(
    userId,
    { isActive: false },
    { new: true },
  );
}

export async function recordUserLogin(userId) {
  return User.findByIdAndUpdate(
    userId,
    { lastLogin: new Date() },
    { new: true },
  );
}

export async function getAllUsers() {
  return User.find()
    .populate("role")
    .select("-passwordHash")
    .sort({ displayName: 1 });
}

export async function getUserById(userId) {
  return User.findById(userId).populate("role").select("-passwordHash");
}

export async function updateUser(userId, userData) {
  const updateData = {};

  if (typeof userData.displayName === "string") {
    updateData.displayName = userData.displayName.trim();
  }

  if (typeof userData.username === "string") {
    updateData.username = userData.username.trim();
  }

  if (typeof userData.email === "string") {
    updateData.email = userData.email.trim().toLowerCase();
  }

  if (typeof userData.password === "string" && userData.password.trim()) {
    updateData.passwordHash = await bcrypt.hash(userData.password, 12);
  }

  if (userData.role) {
    const role = await Role.findOne({ name: userData.role });

    if (!role) {
      throw new Error("Invalid role.");
    }

    updateData.role = role._id;
  }

  return User.findByIdAndUpdate(userId, updateData, {
    new: true,
    runValidators: true,
  })
    .populate("role")
    .select("-passwordHash");
}

export async function deleteUser(userId) {
  return User.findByIdAndDelete(userId);
}

export async function verifyPassword(password, passwordHash) {
  return bcrypt.compare(password, passwordHash);
}

export async function getPaginatedUsers(page = 1, limit = 10, sort = "username") {
  const sortFields = {
    username: 1,
    displayName: 1,
    email: 1,
  };

  const skip = (page - 1) * limit;

  const [users, totalItems] = await Promise.all([
    User.find()
      .populate("role")
      .select("displayName username email role")
      .sort({ [sort]: sortFields[sort] })
      .collation({ locale: "en", strength: 2 })
      .skip(skip)
      .limit(limit)
      .lean(),

    User.countDocuments(),
  ]);

  return {
    users,
    totalItems,
  };
}