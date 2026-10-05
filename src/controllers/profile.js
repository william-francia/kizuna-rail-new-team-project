import {
  changeUserPassword,
  deactivateUser,
  findUserById,
  updateUserProfile,
} from "../models/users.js";

export async function profilePage(req, res, next) {
  try {
    const user = await findUserById(req.session.user.id);

    if (!user) {
      return res.redirect("/login");
    }

    return res.render("profile", {
      title: "My Profile",
      user,
      error: null,
      success: null,
    });
  } catch (error) {
    console.error("Unable to load profile:", error);
    return next(error);
  }
}

export async function updateProfile(req, res, next) {
  try {
    const { displayName, email, bio, avatarUrl } = req.body;

    if (!displayName?.trim() || !email?.trim()) {
      const user = await findUserById(req.session.user.id);

      return res.status(400).render("profile", {
        title: "My Profile",
        user,
        error: "Display name and email are required.",
        success: null,
      });
    }

    const user = await updateUserProfile(req.session.user.id, {
      displayName,
      email,
      bio,
      avatarUrl,
    });

    if (!user) {
      return res.redirect("/login");
    }

    req.session.user.displayName = user.displayName;
    req.session.user.email = user.email;

    return res.render("profile", {
      title: "My Profile",
      user,
      error: null,
      success: "Profile updated successfully.",
    });
  } catch (error) {
    console.error("Unable to update profile:", error);

    if (error.code === 11000) {
      const user = await findUserById(req.session.user.id);

      return res.status(400).render("profile", {
        title: "My Profile",
        user,
        error: "That email address is already in use.",
        success: null,
      });
    }

    return next(error);
  }
}

export async function changePassword(req, res, next) {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    const user = await findUserById(req.session.user.id);

    if (!user) {
      return res.redirect("/login");
    }

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).render("profile", {
        title: "My Profile",
        user,
        error: "Please complete all password fields.",
        success: null,
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).render("profile", {
        title: "My Profile",
        user,
        error: "The new passwords do not match.",
        success: null,
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).render("profile", {
        title: "My Profile",
        user,
        error: "The new password must be at least 8 characters long.",
        success: null,
      });
    }

    const result = await changeUserPassword(
      req.session.user.id,
      currentPassword,
      newPassword,
    );

    if (!result.success) {
      return res.status(400).render("profile", {
        title: "My Profile",
        user,
        error:
          result.reason === "invalid-password"
            ? "The current password is incorrect."
            : "Unable to change the password.",
        success: null,
      });
    }

    return res.render("profile", {
      title: "My Profile",
      user,
      error: null,
      success: "Password changed successfully.",
    });
  } catch (error) {
    console.error("Unable to change password:", error);
    return next(error);
  }
}

export async function deactivateAccount(req, res, next) {
  try {
    const user = await deactivateUser(req.session.user.id);

    if (!user) {
      return res.redirect("/login");
    }

    req.session.destroy((error) => {
      if (error) {
        console.error("Unable to destroy session:", error);
        return next(error);
      }

      return res.redirect("/login");
    });
  } catch (error) {
    console.error("Unable to deactivate account:", error);
    return next(error);
  }
}
