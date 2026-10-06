import mongoose from "mongoose";
import {
  getPaginatedUsers,
  getUserById,
  updateUser,
  deleteUser,
} from "../models/users.js";

export function userAdminPage(req, res) {
  res.render("user-admin", {
    title: "User Admin",
  });
}

export async function usersAdminPage(req, res, next) {
  try {
    const users = await getPaginatedUsers();

    return res.render("users-admin", {
      title: "Users Admin",
      users: users.users,
    });
  } catch (error) {
    console.error("Error loading users admin page:", error);
    return next(error);
  }
}

export async function getUsers(req, res) {
  try {
    const pageValue = req.query.page ?? "1";
    const limitValue = req.query.limit ?? "10";
    const sort = req.query.sort ?? "username";

    const page = Number(pageValue);
    const limit = Number(limitValue);

    if (
      !Number.isInteger(page) ||
      page < 1 ||
      String(page) !== String(pageValue)
    ) {
      return res.status(400).json({
        error: "Page must be a positive integer.",
      });
    }

    if (
      !Number.isInteger(limit) ||
      limit < 1 ||
      String(limit) !== String(limitValue)
    ) {
      return res.status(400).json({
        error: "Limit must be a positive integer.",
      });
    }

    const allowedSortFields = ["username", "displayName", "email"];

    if (!allowedSortFields.includes(sort)) {
      return res.status(400).json({
        error: "Invalid sort field.",
      });
    }

    const { users, totalItems } = await getPaginatedUsers(
      page,
      limit,
      sort,
    );

    const totalPages = Math.ceil(totalItems / limit);

    return res.status(200).json({
      data: users,
      metadata: {
        page,
        limit,
        totalItems,
        totalPages,
        sort,
      },
    });
  } catch (error) {
    console.error("Error fetching users:", error);

    return res.status(500).json({
      error: "Failed to fetch users",
    });
  }
}

export async function updateUserById(req, res) {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        error: "Invalid user ID",
      });
    }

    if (req.user.role !== "admin" && req.user.id !== id) {
      return res.status(403).json({
        error: "Forbidden",
      });
    }

    if (req.user.role !== "admin" && req.body.role) {
      return res.status(403).json({
        error: "You cannot change your role",
      });
    }

    const user = await updateUser(id, req.body);

    if (!user) {
      return res.status(404).json({
        error: "User not found",
      });
    }

    if (req.user.id === id) {
      req.session.user = {
        ...req.session.user,
        displayName: user.displayName,
        username: user.username,
        email: user.email,
        role: user.role.name,
      };
      req.user = req.session.user;
      res.locals.user = req.user;
    }

    return res.status(200).json(user);
  } catch (error) {
    console.error("Error updating user:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        error: "Username or email is already in use.",
      });
    }

    return res.status(400).json({
      error: "Failed to update user",
    });
  }
}

export async function deleteUserById(req, res) {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        error: "Invalid user ID",
      });
    }

    if (req.user.role !== "admin" && req.user.id !== id) {
      return res.status(403).json({
        error: "Forbidden",
      });
    }

    const user = await deleteUser(id);

    if (!user) {
      return res.status(404).json({
        error: "User not found",
      });
    }

    if (req.user.id === id) {
      req.session.destroy((error) => {
        if (error) {
          console.error("Error destroying session:", error);
        }
      });
    }

    return res.status(200).json({
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting user:", error);

    return res.status(500).json({
      error: "Failed to delete user",
    });
  }
}