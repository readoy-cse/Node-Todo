import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

function App() {
  const [todos, setTodos] = useState([]);
  const [title, setTitle] = useState("");
  const [filter, setFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const filteredTodos = useMemo(() => {
    if (filter === "active") {
      return todos.filter((todo) => !todo.completed);
    }

    if (filter === "completed") {
      return todos.filter((todo) => todo.completed);
    }

    return todos;
  }, [filter, todos]);

  const remainingCount = todos.filter((todo) => !todo.completed).length;

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

        {error && <p className="error">{error}</p>}

        <div className="todo-list">
          {isLoading ? (
            <p className="empty-state">Loading todos...</p>
          ) : filteredTodos.length ? (
            filteredTodos.map((todo) => (
              <article className="todo-item" key={todo._id}>
                <label>
                  <input
                    type="checkbox"
                    checked={todo.completed}
                    onChange={() => toggleTodo(todo)}
                  />
                  <span className={todo.completed ? "completed" : ""}>{todo.title}</span>
                </label>
                <button type="button" onClick={() => deleteTodo(todo._id)}>
                  Delete
                </button>
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
