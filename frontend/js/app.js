const API_URL = "http://localhost:3000/api/expenses";

const form = document.getElementById("expense-form");
const tableBody = document.getElementById("expenses-table");
const loading = document.getElementById("loading");
const alertBox = document.getElementById("alert-box");
const filterSelect = document.getElementById("filter-category");

let allExpenses = [];

async function getExpenses() {
  const response = await fetch(API_URL);
  const data = await response.json();
  return data;
}

async function addExpense(data) {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  return response;
}

async function updateExpense(id, data) {
  const response = await fetch(API_URL + "/" + id, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  return response;
}

async function deleteExpense(id) {
  const response = await fetch(API_URL + "/" + id, {
    method: "DELETE"
  });
  return response;
}

function showLoading() {
  loading.classList.remove("d-none");
}

function hideLoading() {
  loading.classList.add("d-none");
}

function showAlert(message, type) {
  alertBox.innerHTML = "<div class='alert alert-" + type + "'>" + message + "</div>";
  setTimeout(function () {
    alertBox.innerHTML = "";
  }, 3000);
}

function renderTable(list) {
  const filter = filterSelect.value;
  let filtered = list;

  if (filter !== "All") {
    filtered = list.filter(function (item) {
      return item.category === filter;
    });
  }

  tableBody.innerHTML = "";

  if (filtered.length === 0) {
    tableBody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">No expenses</td></tr>';
    return;
  }

  filtered.forEach(function (item) {
    const row = document.createElement("tr");
    row.innerHTML =
      "<td>" + item.title + "</td>" +
      "<td>" + item.amount + "</td>" +
      "<td><span class='badge bg-primary'>" + item.category + "</span></td>" +
      "<td>" + item.date + "</td>" +
      "<td>" +
        "<button class='btn btn-sm btn-warning me-1' onclick='openEdit(" + item.id + ")'>Edit</button>" +
        "<button class='btn btn-sm btn-danger' onclick='handleDelete(" + item.id + ")'>Delete</button>" +
      "</td>";
    tableBody.appendChild(row);
  });
}

function renderSummary(list) {
  const total = list.reduce(function (sum, item) {
    return sum + Number(item.amount);
  }, 0);

  document.getElementById("total-amount").textContent = total.toFixed(2);
  document.getElementById("total-count").textContent = list.length;

  if (list.length > 0) {
    const highest = list.reduce(function (max, item) {
      return Number(item.amount) > Number(max.amount) ? item : max;
    });
    document.getElementById("highest-amount").textContent = Number(highest.amount).toFixed(2);
    document.getElementById("highest-title").textContent = highest.title;
  } else {
    document.getElementById("highest-amount").textContent = "0.00";
    document.getElementById("highest-title").textContent = "";
  }
}

function applyFilter() {
  renderTable(allExpenses);
}

async function refresh() {
  showLoading();
  try {
    const list = await getExpenses();
    allExpenses = list;
    renderTable(list);
    renderSummary(list);
  } catch (error) {
    showAlert("Error loading data", "danger");
  }
  hideLoading();
}

form.addEventListener("submit", async function (e) {
  e.preventDefault();

  document.getElementById("title-error").textContent = "";
  document.getElementById("amount-error").textContent = "";
  document.getElementById("category-error").textContent = "";

  const title = document.getElementById("title").value.trim();
  const amount = document.getElementById("amount").value;
  const category = document.getElementById("category").value;
  const date = document.getElementById("date").value;

  let valid = true;

  if (!title) {
    document.getElementById("title-error").textContent = "Title is required.";
    valid = false;
  }
  if (!amount || Number(amount) <= 0) {
    document.getElementById("amount-error").textContent = "Enter an amount greater than 0.";
    valid = false;
  }
  if (!category) {
    document.getElementById("category-error").textContent = "Choose a category.";
    valid = false;
  }

  if (!valid) return;

  try {
    const response = await addExpense({
      title: title,
      amount: amount,
      category: category,
      date: date
    });

    if (response.ok) {
      form.reset();
      showAlert("Expense added", "success");
      refresh();
    } else {
      const err = await response.json();
      showAlert(err.error || "Error", "danger");
    }
  } catch (error) {
    showAlert("Server error", "danger");
  }
});

function openEdit(id) {
  const item = allExpenses.find(function (e) {
    return e.id === id;
  });
  if (!item) return;

  document.getElementById("edit-id").value = item.id;
  document.getElementById("edit-title").value = item.title;
  document.getElementById("edit-amount").value = item.amount;
  document.getElementById("edit-category").value = item.category;
  document.getElementById("edit-date").value = item.date;

  const modal = new bootstrap.Modal(document.getElementById("editModal"));
  modal.show();
}

document.getElementById("save-edit").addEventListener("click", async function () {
  const id = document.getElementById("edit-id").value;
  const title = document.getElementById("edit-title").value;
  const amount = document.getElementById("edit-amount").value;
  const category = document.getElementById("edit-category").value;
  const date = document.getElementById("edit-date").value;

  try {
    const response = await updateExpense(id, {
      title: title,
      amount: amount,
      category: category,
      date: date
    });

    if (response.ok) {
      bootstrap.Modal.getInstance(document.getElementById("editModal")).hide();
      showAlert("Expense updated", "success");
      refresh();
    }
  } catch (error) {
    showAlert("Server error", "danger");
  }
});

async function handleDelete(id) {
  if (!confirm("Delete this expense?")) return;

  try {
    const response = await deleteExpense(id);
    if (response.ok) {
      showAlert("Expense deleted", "success");
      refresh();
    }
  } catch (error) {
    showAlert("Server error", "danger");
  }
}

filterSelect.addEventListener("change", function () {
  applyFilter();
});

const darkModeToggle = document.getElementById("dark-mode-toggle");
const body = document.getElementById("body");

function applyDarkMode() {
  const isDark = localStorage.getItem("darkMode") === "true";
  if (isDark) {
    body.classList.add("dark-mode");
    darkModeToggle.textContent = "Light Mode";
  } else {
    body.classList.remove("dark-mode");
    darkModeToggle.textContent = "Dark Mode";
  }
}

darkModeToggle.addEventListener("click", function () {
  const isDark = body.classList.contains("dark-mode");
  localStorage.setItem("darkMode", !isDark);
  applyDarkMode();
});

applyDarkMode();

refresh();