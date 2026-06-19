import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

const API_URL = "http://192.168.32.104:30090/api";
// const API_URL = "todo-svc-backend:5000/api";

function App() {
  const [todos, setTodos] = useState([]);
  const [title, setTitle] = useState("");
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const filteredTodos = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return todos.filter((todo) => {
      const matchesFilter =
        filter === "all" ||
        (filter === "active" && !todo.completed) ||
        (filter === "completed" && todo.completed);
      const matchesSearch = todo.title.toLowerCase().includes(normalizedSearch);

      return matchesFilter && matchesSearch;
    });
  }, [filter, search, todos]);

  const remainingCount = todos.filter((todo) => !todo.completed).length;
  const completedCount = todos.length - remainingCount;
  const progress = todos.length ? Math.round((completedCount / todos.length) * 100) : 0;

  useEffect(() => {
    fetchTodos();
  }, []);

  async function request(path, options = {}) {
    const response = await fetch(`${API_URL}${path}`, {
      headers: {
        "Content-Type": "application/json"
      },
      ...options
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      throw new Error(payload.message || "Request failed");
    }

    if (response.status === 204) {
      return null;
    }

    return response.json();
  }

  async function fetchTodos() {
    try {
      setIsLoading(true);
      setError("");
      const data = await request("/todos");
      setTodos(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  async function addTodo(event) {
    event.preventDefault();
    const trimmedTitle = title.trim();

    if (!trimmedTitle) {
      return;
    }

    try {
      setError("");
      const todo = await request("/todos", {
        method: "POST",
        body: JSON.stringify({ title: trimmedTitle })
      });
      setTodos((currentTodos) => [todo, ...currentTodos]);
      setTitle("");
    } catch (err) {
      setError(err.message);
    }
  }

  async function toggleTodo(todo) {
    try {
      setError("");
      const updatedTodo = await request(`/todos/${todo._id}`, {
        method: "PATCH",
        body: JSON.stringify({ completed: !todo.completed })
      });
      setTodos((currentTodos) =>
        currentTodos.map((item) => (item._id === updatedTodo._id ? updatedTodo : item))
      );
    } catch (err) {
      setError(err.message);
    }
  }

  function startEditing(todo) {
    setEditingId(todo._id);
    setEditingTitle(todo.title);
  }

  function cancelEditing() {
    setEditingId(null);
    setEditingTitle("");
  }

  async function saveTodoTitle(todo) {
    const trimmedTitle = editingTitle.trim();

    if (!trimmedTitle) {
      setError("Todo title cannot be empty");
      return;
    }

    if (trimmedTitle === todo.title) {
      cancelEditing();
      return;
    }

    try {
      setError("");
      const updatedTodo = await request(`/todos/${todo._id}`, {
        method: "PATCH",
        body: JSON.stringify({ title: trimmedTitle })
      });
      setTodos((currentTodos) =>
        currentTodos.map((item) => (item._id === updatedTodo._id ? updatedTodo : item))
      );
      cancelEditing();
    } catch (err) {
      setError(err.message);
    }
  }

  async function deleteTodo(id) {
    try {
      setError("");
      await request(`/todos/${id}`, {
        method: "DELETE"
      });
      setTodos((currentTodos) => currentTodos.filter((todo) => todo._id !== id));
    } catch (err) {
      setError(err.message);
    }
  }

  async function clearCompleted() {
    const completedTodos = todos.filter((todo) => todo.completed);

    if (!completedTodos.length) {
      return;
    }

    try {
      setError("");
      await Promise.all(
        completedTodos.map((todo) =>
          request(`/todos/${todo._id}`, {
            method: "DELETE"
          })
        )
      );
      setTodos((currentTodos) => currentTodos.filter((todo) => !todo.completed));
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <main className="app-shell">
      <section className="todo-panel">
        <div className="header-row">
          <div>
            <p className="eyebrow">React + Express + MongoDB</p>
            <h1>Todo List</h1>
          </div>
          <span className="counter">{remainingCount} left</span>
        </div>

        <div className="progress-block" aria-label="Todo progress">
          <div className="progress-copy">
            <span>{completedCount} done</span>
            <span>{progress}% complete</span>
          </div>
          <div className="progress-track">
            <span style={{ width: `${progress}%` }} />
          </div>
        </div>

        <form className="todo-form" onSubmit={addTodo}>
          <input
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Add a new task"
            maxLength="120"
            aria-label="New todo title"
          />
          <button type="submit">Add</button>
        </form>

        <div className="toolbar">
          <div className="filters" aria-label="Todo filters">
            {["all", "active", "completed"].map((name) => (
              <button
                key={name}
                type="button"
                className={filter === name ? "active" : ""}
                onClick={() => setFilter(name)}
              >
                {name}
              </button>
            ))}
          </div>
          <button
            className="clear-button"
            type="button"
            onClick={clearCompleted}
            disabled={!completedCount}
          >
            Clear done
          </button>
        </div>

        <input
          className="search-input"
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search tasks"
          aria-label="Search todos"
        />

        {error && <p className="error">{error}</p>}

        <div className="todo-list">
          {isLoading ? (
            <p className="empty-state">Loading todos...</p>
          ) : filteredTodos.length ? (
            filteredTodos.map((todo) => (
              <article className="todo-item" key={todo._id}>
                {editingId === todo._id ? (
                  <form
                    className="edit-form"
                    onSubmit={(event) => {
                      event.preventDefault();
                      saveTodoTitle(todo);
                    }}
                  >
                    <input
                      type="text"
                      value={editingTitle}
                      onChange={(event) => setEditingTitle(event.target.value)}
                      maxLength="120"
                      aria-label="Edit todo title"
                      autoFocus
                    />
                    <div className="item-actions">
                      <button type="submit">Save</button>
                      <button className="ghost-button" type="button" onClick={cancelEditing}>
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <>
                    <label>
                      <input
                        type="checkbox"
                        checked={todo.completed}
                        onChange={() => toggleTodo(todo)}
                      />
                      <span className={todo.completed ? "completed" : ""}>{todo.title}</span>
                    </label>
                    <div className="item-actions">
                      <button
                        className="ghost-button"
                        type="button"
                        onClick={() => startEditing(todo)}
                      >
                        Edit
                      </button>
                      <button type="button" onClick={() => deleteTodo(todo._id)}>
                        Delete
                      </button>
                    </div>
                  </>
                )}
              </article>
            ))
          ) : (
            <p className="empty-state">No todos here yet.</p>
          )}
        </div>
      </section>
    </main>
  );
}

createRoot(document.getElementById("root")).render(<App />);
