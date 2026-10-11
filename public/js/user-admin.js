const statusMessage = document.querySelector("#users-status");
const usersList = document.querySelector("#users-list");
const userTemplate = document.querySelector("#user-template");
const pagination = document.querySelector("#users-pagination");
const filterForm = document.querySelector("#user-filters");
const keywordInput = document.querySelector("#user-keyword");
const roleFilter = document.querySelector("#user-role-filter");
const clearFiltersButton = document.querySelector("#clear-user-filters");

const currentUserRole = document.body.dataset.userRole || "";
const currentUserId = document.body.dataset.userId || "";

let currentPage = 1;
const usersPerPage = 10;
const sortField = "username";
let currentKeyword = "";
let currentRole = "";

const fetchUsers = async () => {
  const params = new URLSearchParams({
    page: currentPage,
    limit: usersPerPage,
    sort: sortField,
  });

  if (currentRole) {
    params.set("role", currentRole);
  }

  if (currentKeyword) {
    params.set("keyword", currentKeyword);
  }

  const response = await fetch(`/api/users?${params.toString()}`);

  if (!response.ok) {
    throw new Error("Unable to load users.");
  }

  return response.json();
};

const updateUser = async (id, data) => {
  const response = await fetch(`/api/users/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || "Unable to update user.");
  }
};

const deleteUser = async (id) => {
  const response = await fetch(`/api/users/${id}`, {
    method: "DELETE",
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || "Unable to delete user.");
  }
};

const renderUsers = (users) => {
  const fragment = document.createDocumentFragment();

  users.forEach((user) => {
    const card = userTemplate.content.cloneNode(true);
    const form = card.querySelector(".user-form");

    card.querySelector(".user-name").textContent = user.displayName;

    form.querySelector(".user-display-name").value = user.displayName;
    form.querySelector(".user-username").value = user.username;
    form.querySelector(".user-email").value = user.email;

    const roleField = form.querySelector(".user-role");

    if (roleField) {
      roleField.value = user.role?.name || "customer";
    }

    form.dataset.userId = user._id;

    form.addEventListener("submit", async (event) => {
      event.preventDefault();

      const data = {
        displayName: form.querySelector(".user-display-name").value,
        username: form.querySelector(".user-username").value,
        email: form.querySelector(".user-email").value,
      };

      if (currentUserRole === "admin") {
        data.role = form.querySelector(".user-role").value;
      }

      const password = form.querySelector(".user-password").value;

      if (password) {
        data.password = password;
      }

      try {
        statusMessage.textContent = "Updating user...";

        await updateUser(form.dataset.userId, data);
        await loadUsers();

        statusMessage.textContent = "User updated successfully.";
      } catch (error) {
        statusMessage.textContent = error.message;
      }
    });

    card.querySelector(".delete-user").addEventListener("click", async () => {
      if (!window.confirm("Are you sure you want to delete this user?")) {
        return;
      }

      try {
        statusMessage.textContent = "Deleting user...";

        await deleteUser(form.dataset.userId);

        if (form.dataset.userId === currentUserId) {
          window.location.href = "/login";
          return;
        }

        await loadUsers();

        statusMessage.textContent = "User deleted successfully.";
      } catch (error) {
        statusMessage.textContent = error.message;
      }
    });

    fragment.append(card);
  });

  usersList.replaceChildren(fragment);
};

const renderPagination = (metadata) => {
  pagination.replaceChildren();

  if (metadata.totalPages <= 1) {
    return;
  }

  const previousButton = document.createElement("button");
  previousButton.type = "button";
  previousButton.textContent = "Previous";
  previousButton.disabled = metadata.page === 1;

  previousButton.addEventListener("click", () => {
    currentPage -= 1;
    loadUsers();
  });

  const pageMessage = document.createElement("span");
  pageMessage.textContent = `Page ${metadata.page} of ${metadata.totalPages}`;

  const nextButton = document.createElement("button");
  nextButton.type = "button";
  nextButton.textContent = "Next";
  nextButton.disabled = metadata.page === metadata.totalPages;

  nextButton.addEventListener("click", () => {
    currentPage += 1;
    loadUsers();
  });

  pagination.append(previousButton, pageMessage, nextButton);
};

const loadUsers = async () => {
  statusMessage.textContent = "Loading users...";

  try {
    const result = await fetchUsers();

    renderUsers(result.data);
    renderPagination(result.metadata);

    statusMessage.textContent =
      result.data.length === 0
        ? "No users found."
        : `Showing ${result.data.length} user${
            result.data.length === 1 ? "" : "s"
          } on page ${result.metadata.page} of ${result.metadata.totalPages}.`;
  } catch (error) {
    usersList.replaceChildren();
    pagination.replaceChildren();
    statusMessage.textContent = error.message;
  }
};

filterForm.addEventListener("submit", (event) => {
  event.preventDefault();

  currentKeyword = keywordInput.value.trim();
  currentRole = roleFilter.value;
  currentPage = 1;

  loadUsers();
});

clearFiltersButton.addEventListener("click", () => {
  keywordInput.value = "";
  roleFilter.value = "";

  currentKeyword = "";
  currentRole = "";
  currentPage = 1;

  loadUsers();
});

loadUsers();