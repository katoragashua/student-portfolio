const menuButton = document.querySelector(".menu-toggle");
const navigation = document.querySelector(".site-nav");
const currentPage = window.location.pathname.split("/").pop() || "index.html";

document.querySelectorAll(".site-nav a").forEach((link) => {
  if (link.getAttribute("href") === currentPage) {
    link.setAttribute("aria-current", "page");
  }
});

if (menuButton && navigation) {
  menuButton.addEventListener("click", () => {
    const isExpanded = menuButton.getAttribute("aria-expanded") === "true";
    menuButton.setAttribute("aria-expanded", String(!isExpanded));
    menuButton.setAttribute("aria-label", isExpanded ? "Open navigation menu" : "Close navigation menu");
    navigation.classList.toggle("is-open", !isExpanded);
  });

  navigation.addEventListener("click", (event) => {
    if (event.target instanceof HTMLAnchorElement) {
      menuButton.setAttribute("aria-expanded", "false");
      menuButton.setAttribute("aria-label", "Open navigation menu");
      navigation.classList.remove("is-open");
    }
  });
}

document.querySelectorAll(".portrait-image").forEach((image) => {
  image.addEventListener("error", () => {
    const fallback = image.dataset.fallback;
    if (fallback && image.getAttribute("src") !== fallback) {
      image.setAttribute("src", fallback);
    }
  }, { once: true });
});

document.querySelectorAll("[data-current-year]").forEach((element) => {
  element.textContent = String(new Date().getFullYear());
});

const taskForm = document.querySelector("#task-form");
const taskList = document.querySelector("#task-list");

if (taskForm instanceof HTMLFormElement && taskList instanceof HTMLUListElement) {
  const taskTitle = taskForm.elements.namedItem("task");
  const taskDue = taskForm.elements.namedItem("due");
  const taskCount = document.querySelector("#task-count");
  const emptyState = document.querySelector("#task-empty");
  const filterButtons = [...document.querySelectorAll(".filter-button")];
  const storageKey = "alex-morgan-academic-planner";
  let tasks = [];
  let activeFilter = "all";

  try {
    const savedTasks = JSON.parse(localStorage.getItem(storageKey) ?? "[]");
    if (Array.isArray(savedTasks)) {
      tasks = savedTasks.filter((task) =>
        task && typeof task.id === "string" && typeof task.title === "string" &&
        typeof task.completed === "boolean" && typeof task.due === "string"
      );
    }
  } catch {
    taskList.insertAdjacentHTML("beforebegin", '<p class="storage-notice">Saved tasks could not be loaded. You can still add tasks for this visit.</p>');
  }

  const saveTasks = () => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(tasks));
    } catch {
      let notice = document.querySelector(".storage-notice");
      if (!notice) {
        notice = document.createElement("p");
        notice.className = "storage-notice";
        taskList.before(notice);
      }
      notice.textContent = "Your browser could not save this update. Tasks will remain until you close this page.";
    }
  };

  const renderTasks = () => {
    taskList.replaceChildren();

    const filteredTasks = tasks.filter((task) => {
      if (activeFilter === "active") return !task.completed;
      if (activeFilter === "completed") return task.completed;
      return true;
    });

    filteredTasks.forEach((task) => {
      const item = document.createElement("li");
      item.className = `task-item${task.completed ? " is-complete" : ""}`;

      const label = document.createElement("label");
      label.className = "task-label";
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = task.completed;
      checkbox.setAttribute("aria-label", `Mark ${task.title} as ${task.completed ? "not done" : "done"}`);
      checkbox.addEventListener("change", () => {
        task.completed = checkbox.checked;
        saveTasks();
        renderTasks();
      });

      const checkVisual = document.createElement("span");
      checkVisual.className = "task-check-visual";
      checkVisual.setAttribute("aria-hidden", "true");
      const title = document.createElement("span");
      title.className = "task-title";
      title.textContent = task.title;
      label.append(checkbox, checkVisual, title);

      const details = document.createElement("div");
      details.className = "task-details";
      if (task.due) {
        const dueDate = document.createElement("time");
        dueDate.dateTime = task.due;
        const parsedDate = new Date(`${task.due}T00:00:00`);
        dueDate.textContent = new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(parsedDate);
        details.append(dueDate);
      }

      const deleteButton = document.createElement("button");
      deleteButton.type = "button";
      deleteButton.className = "task-delete";
      deleteButton.setAttribute("aria-label", `Delete ${task.title}`);
      deleteButton.textContent = "×";
      deleteButton.addEventListener("click", () => {
        tasks = tasks.filter((savedTask) => savedTask.id !== task.id);
        saveTasks();
        renderTasks();
      });

      item.append(label, details, deleteButton);
      taskList.append(item);
    });

    const openTasks = tasks.filter((task) => !task.completed).length;
    if (taskCount) taskCount.textContent = `${openTasks} ${openTasks === 1 ? "open task" : "open tasks"}`;
    document.querySelectorAll("[data-filter-count]").forEach((counter) => {
      const filter = counter.getAttribute("data-filter-count");
      const count = filter === "active" ? openTasks : filter === "completed" ? tasks.length - openTasks : tasks.length;
      counter.textContent = String(count);
    });
    if (emptyState) emptyState.hidden = filteredTasks.length > 0;
  };

  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      activeFilter = button.dataset.filter ?? "all";
      filterButtons.forEach((filterButton) => {
        const isActive = filterButton === button;
        filterButton.classList.toggle("is-active", isActive);
        filterButton.setAttribute("aria-pressed", String(isActive));
      });
      renderTasks();
    });
  });

  taskForm.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!(taskTitle instanceof HTMLInputElement) || !(taskDue instanceof HTMLInputElement)) return;
    const title = taskTitle.value.trim();
    if (!title) {
      taskTitle.focus();
      return;
    }

    tasks.unshift({
      id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      title,
      due: taskDue.value,
      completed: false
    });
    saveTasks();
    renderTasks();
    taskForm.reset();
    taskTitle.focus();
  });

  renderTasks();
}

const contactForm = document.querySelector("#contact-form");

if (contactForm instanceof HTMLFormElement) {
  const fields = {
    name: contactForm.elements.namedItem("name"),
    email: contactForm.elements.namedItem("email"),
    phone: contactForm.elements.namedItem("phone"),
    message: contactForm.elements.namedItem("message")
  };
  const status = document.querySelector("#form-status");

  const setError = (field, message) => {
    const error = document.querySelector(`#${field.id.replace("contact-", "")}-error`);
    field.setAttribute("aria-invalid", message ? "true" : "false");
    if (error) error.textContent = message;
  };

  contactForm.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!(fields.name instanceof HTMLInputElement) ||
        !(fields.email instanceof HTMLInputElement) ||
        !(fields.phone instanceof HTMLInputElement) ||
        !(fields.message instanceof HTMLTextAreaElement)) return;

    const values = {
      name: fields.name.value.trim(),
      email: fields.email.value.trim(),
      phone: fields.phone.value.trim(),
      message: fields.message.value.trim()
    };
    const errors = {
      name: values.name ? "" : "Please enter your name.",
      email: /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(values.email) ? "" : "Enter a valid email address.",
      phone: /^\d+$/.test(values.phone) ? "" : "Use digits only for your phone number.",
      message: values.message ? "" : "Please add a message."
    };

    setError(fields.name, errors.name);
    setError(fields.email, errors.email);
    setError(fields.phone, errors.phone);
    setError(fields.message, errors.message);

    const firstInvalid = Object.keys(errors).find((key) => errors[key]);
    if (firstInvalid) {
      fields[firstInvalid].focus();
      if (status) status.textContent = "Please check the highlighted fields.";
      return;
    }

    if (status) status.textContent = "Thanks, " + values.name + "! Your details look good. This demo form is not connected to an email service, so your message hasn’t been sent.";
    contactForm.reset();
    Object.values(fields).forEach((field) => field.removeAttribute("aria-invalid"));
  });

  Object.values(fields).forEach((field) => {
    field.addEventListener("input", () => setError(field, ""));
  });
}
