import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

const API_URL = "http://todo-svc-backend:5000/api" ;
// const API_URL = import.meta.env.VITE_API_URL ;

  console.log(import.meta.env.API_URL)

function App() {
  const [todos, setTodos] = useState([]);
  const [title, setTitle] = useState("");
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [now, setNow] = useState(Date.now());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [frontendRuntime, setFrontendRuntime] = useState(null);
  const [backendRuntime, setBackendRuntime] = useState(null);

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
  const runningCount = todos.filter((todo) => todo.timerStartedAt).length;
  const progress = todos.length ? Math.round((completedCount / todos.length) * 100) : 0;
  const totalTrackedSeconds = todos.reduce((total, todo) => total + getTrackedSeconds(todo), 0);

  useEffect(() => {
    fetchTodos();
    fetchRuntime();
  }, []);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, []);

  function getTrackedSeconds(todo) {
    const savedSeconds = todo.timeSpentSeconds || 0;

    if (!todo.timerStartedAt) {
      return savedSeconds;
    }

    return savedSeconds + Math.max(0, Math.floor((now - new Date(todo.timerStartedAt).getTime()) / 1000));
  }

  function formatTime(totalSeconds) {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours) {
      return `${hours}h ${minutes.toString().padStart(2, "0")}m`;
    }

    return `${minutes}m ${seconds.toString().padStart(2, "0")}s`;
  }

  async function request(path, options = {}) {
    const response = await fetch(`${API_URL}${path}`, {
      headers: {
        "Content-Type": "application/json",
      },
      ...options,
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

  async function fetchRuntime() {
    const [frontendResult, backendResult] = await Promise.allSettled([
      fetch("/runtime.json").then((response) => {
        if (!response.ok) throw new Error("Frontend runtime unavailable");
        return response.json();
      }),
      request("/runtime"),
    ]);

    if (frontendResult.status === "fulfilled") {
      setFrontendRuntime(frontendResult.value);
    }

    if (backendResult.status === "fulfilled") {
      setBackendRuntime(backendResult.value);
    }
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
        body: JSON.stringify({ title: trimmedTitle }),
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
        body: JSON.stringify({ completed: !todo.completed }),
      });
      setTodos((currentTodos) =>
        currentTodos.map((item) => (item._id === updatedTodo._id ? updatedTodo : item))
      );
    } catch (err) {
      setError(err.message);
    }
  }

  async function updateTimer(todo, timerAction) {
    try {
      setError("");
      const updatedTodo = await request(`/todos/${todo._id}`, {
        method: "PATCH",
        body: JSON.stringify({ timerAction }),
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
        body: JSON.stringify({ title: trimmedTitle }),
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
        method: "DELETE",
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
            method: "DELETE",
          })
        )
      );
      setTodos((currentTodos) => currentTodos.filter((todo) => !todo.completed));
    } catch (err) {
      setError(err.message);
    }
  }

  function RuntimePanel({ title: panelTitle, data }) {
    return (
      <section className="runtime-panel">
        <div className="panel-heading">
          <span>{panelTitle}</span>
          <strong className={data ? "status-dot online" : "status-dot"}>{data?.status || "unknown"}</strong>
        </div>
        <dl className="runtime-grid">
          <div>
            <dt>Pod</dt>
            <dd>{data?.podName || "Not available"}</dd>
          </div>
          <div>
            <dt>Node</dt>
            <dd>{data?.nodeName || "Not available"}</dd>
          </div>
          <div>
            <dt>Namespace</dt>
            <dd>{data?.namespace || "Not available"}</dd>
          </div>
          {data?.database && (
            <div>
              <dt>Database</dt>
              <dd>{data.database}</dd>
            </div>
          )}
        </dl>
      </section>
    );
  }

  return (
    <main className="dashboard-shell">
      <header className="dashboard-header">
        <div>
          <p className="eyebrow">Task Dashboard</p>
          <h1>Node Todo</h1>
        </div>
        <button className="refresh-button" type="button" onClick={() => Promise.all([fetchTodos(), fetchRuntime()])}>
          Refresh
        </button>
      </header>

      <section className="metrics-grid" aria-label="Todo metrics">
        <div>
          <span>Total Tasks</span>
          <strong>{todos.length}</strong>
        </div>
        <div>
          <span>Active</span>
          <strong>{remainingCount}</strong>
        </div>
        <div>
          <span>Completed</span>
          <strong>{completedCount}</strong>
        </div>
        <div>
          <span>Timers Running</span>
          <strong>{runningCount}</strong>
        </div>
        <div>
          <span>Total Tracked</span>
          <strong>{formatTime(totalTrackedSeconds)}</strong>
        </div>
      </section>

      <section className="workspace-grid">
        <aside className="control-panel">
          <div className="panel-heading">
            <span>Task Controls</span>
            <strong>{progress}% complete</strong>
          </div>

          <div className="progress-track" aria-label="Todo progress">
            <span style={{ width: `${progress}%` }} />
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

          <input
            className="search-input"
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search tasks"
            aria-label="Search todos"
          />

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
            Clear completed
          </button>
        </aside>

        <section className="task-panel">
          <div className="panel-heading">
            <span>Task Queue</span>
            <strong>{filteredTodos.length} visible</strong>
          </div>

          {error && <p className="error">{error}</p>}

          <div className="task-list">
            <div className="task-row task-head">
              <span>Task</span>
              <span>Status</span>
              <span>Tracked</span>
              <span>Actions</span>
            </div>

            {isLoading ? (
              <p className="empty-state">Loading todos...</p>
            ) : filteredTodos.length ? (
              filteredTodos.map((todo) => (
                <article
                  className={`task-row ${todo.completed ? "is-done" : ""} ${
                    todo.timerStartedAt ? "is-running" : ""
                  }`}
                  key={todo._id}
                >
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
                      <span>Editing</span>
                      <span>{formatTime(getTrackedSeconds(todo))}</span>
                      <div className="row-actions">
                        <button type="submit">Save</button>
                        <button className="secondary-button" type="button" onClick={cancelEditing}>
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <>
                      <div className="task-title">
                        <span className={todo.completed ? "completed" : ""}>{todo.title}</span>
                      </div>
                      <span
                        className={
                          todo.completed
                            ? "state-badge done"
                            : todo.timerStartedAt
                              ? "state-badge running"
                              : "state-badge"
                        }
                      >
                        {todo.completed ? "Done" : todo.timerStartedAt ? "Running" : "Pending"}
                      </span>
                      <span className={todo.timerStartedAt ? "time-badge running" : "time-badge"}>
                        {formatTime(getTrackedSeconds(todo))}
                      </span>
                      <div className="row-actions">
                        <button
                          className={todo.completed ? "status-action done" : "status-action"}
                          type="button"
                          onClick={() => toggleTodo(todo)}
                          aria-label={todo.completed ? "Mark task as pending" : "Mark task as done"}
                          title={todo.completed ? "Mark pending" : "Mark done"}
                        >
                          {todo.completed ? "↺" : "✓"}
                        </button>
                        <button
                          className={todo.timerStartedAt ? "warning-button" : "success-button"}
                          type="button"
                          onClick={() => updateTimer(todo, todo.timerStartedAt ? "stop" : "start")}
                          disabled={todo.completed && !todo.timerStartedAt}
                          aria-label={todo.timerStartedAt ? "Stop timer" : "Start timer"}
                          title={todo.timerStartedAt ? "Stop" : "Start"}
                        >
                          {todo.timerStartedAt ? "■" : "▶"}
                        </button>
                        <button
                          className="secondary-button"
                          type="button"
                          onClick={() => updateTimer(todo, "reset")}
                          disabled={!getTrackedSeconds(todo)}
                          aria-label="Reset timer"
                          title="Reset"
                        >
                          ↻
                        </button>
                        <button
                          className="secondary-button"
                          type="button"
                          onClick={() => startEditing(todo)}
                          aria-label="Edit task"
                          title="Edit"
                        >
                          ✎
                        </button>
                        <button
                          className="danger-button"
                          type="button"
                          onClick={() => deleteTodo(todo._id)}
                          aria-label="Delete task"
                          title="Delete"
                        >
                          ×
                        </button>
                      </div>
                    </>
                  )}
                </article>
              ))
            ) : (
              <p className="empty-state">No todos match this view.</p>
            )}
          </div>
        </section>
      </section>

      <footer className="dashboard-footer" aria-label="Operator diagnostics">
        <div className="footer-heading">
          <span>Operator diagnostics</span>
          <strong>Pod and node metadata</strong>
        </div>
        <section className="status-strip">
          <RuntimePanel title="Frontend Runtime" data={frontendRuntime} />
          <RuntimePanel title="Backend Runtime" data={backendRuntime} />
        </section>
      </footer>
    </main>
  );
}

createRoot(document.getElementById("root")).render(<App />);
