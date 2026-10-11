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

export async function getPaginatedUsers(
  page = 1,
  limit = 10,
  sort = "username",
  role = "",
  keyword = "",
) {
  const sortFields = {
    username: 1,
    displayName: 1,
    email: 1,
  };

  const skip = (page - 1) * limit;

  const filters = {};

  if (role) {
    const roleDocument = await Role.findOne({ name: role }).select("_id");

    if (!roleDocument) {
      return {
        users: [],
        totalItems: 0,
      };
    }

    filters.role = roleDocument._id;
  }

  if (keyword) {
    const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    filters.$or = [
      { displayName: { $regex: escapedKeyword, $options: "i" } },
      { username: { $regex: escapedKeyword, $options: "i" } },
      { email: { $regex: escapedKeyword, $options: "i" } },
    ];
  }

  const [users, totalItems] = await Promise.all([
    User.find(filters)
      .populate("role")
      .select("displayName username email role")
      .sort({ [sort]: sortFields[sort] })
      .collation({ locale: "en", strength: 2 })
      .skip(skip)
      .limit(limit)
      .lean(),

    User.countDocuments(filters),
  ]);

  return {
    users,
    totalItems,
  };
}