import {
  createUser,
  findUserByEmail,
  verifyPassword,
} from "../models/users.js";

const registrationValues = (displayName, username, email) => ({
  displayName: typeof displayName === "string" ? displayName.trim() : "",
  username: typeof username === "string" ? username.trim() : "",
  email: typeof email === "string" ? email.trim().toLowerCase() : "",
});

export async function register(req, res) {
  const { displayName, username, email, password } = req.body;
  const values = registrationValues(displayName, username, email);

  if (!values.displayName || !values.username || !values.email || !password?.trim()) {
    return res.status(400).render("auth/register", {
      title: "Register",
      error: "Please complete all required fields.",
      values,
    });
  }

  try {
    await createUser(values.displayName, values.username, values.email, password);

    return res.redirect("/login");
  } catch (error) {
    console.error("Unable to register user:", error);

    const message =
      error.code === 11000
        ? "Unable to create account. The username or email may already be in use."
        : "Unable to create account. Please try again.";

    return res.status(400).render("auth/register", {
      title: "Register",
      error: message,
      values,
    });
  }
}

export async function login(req, res) {
  const email = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";
  const password = req.body.password;
  const values = { email };

  if (!email || !password?.trim()) {
    return res.status(400).render("auth/login", {
      title: "Login",
      error: "Email and password are required.",
      values,
    });
  }

  try {
    const user = await findUserByEmail(email);
    const passwordMatches = user && (await verifyPassword(password, user.passwordHash));

    if (!passwordMatches || !user.role?.name) {
      return res.status(401).render("auth/login", {
        title: "Login",
        error: "Invalid email or password.",
        values,
      });
    }

    req.session.user = {
      id: user._id.toString(),
      displayName: user.displayName,
      username: user.username,
      email: user.email,
      role: user.role.name,
    };

    return res.redirect("/");
  } catch (error) {
    console.error("Unable to log in user:", error);

    return res.status(401).render("auth/login", {
      title: "Login",
      error: "Invalid email or password.",
      values,
    });
  }
}

export function logout(req, res) {
  req.session.destroy((error) => {
    if (error) {
      console.error("Unable to log out user:", error);

      return res.status(500).render("auth/login", {
        title: "Login",
        error: "Unable to log out. Please try again.",
        values: {},
      });
    }

    return res.redirect("/login");
  });
}
