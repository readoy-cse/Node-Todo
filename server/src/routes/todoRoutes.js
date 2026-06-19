import express from "express";
import mongoose from "mongoose";
import Todo from "../models/Todo.js";

const router = express.Router();

router.get("/", async (_req, res, next) => {
  try {
    const todos = await Todo.find().sort({ createdAt: -1 });
    res.json(todos);
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const title = req.body.title?.trim();

    if (!title) {
      return res.status(400).json({ message: "Todo title is required" });
    }

    const todo = await Todo.create({ title });
    res.status(201).json(todo);
  } catch (error) {
    next(error);
  }
});

router.patch("/:id", async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ message: "Todo not found" });
    }

    const todo = await Todo.findById(req.params.id);

    if (!todo) {
      return res.status(404).json({ message: "Todo not found" });
    }

    todo.timeSpentSeconds = todo.timeSpentSeconds || 0;

    if (typeof req.body.title === "string") {
      todo.title = req.body.title.trim();
    }

    if (typeof req.body.completed === "boolean") {
      todo.completed = req.body.completed;

      if (todo.completed && todo.timerStartedAt) {
        todo.timeSpentSeconds += Math.max(
          0,
          Math.floor((Date.now() - todo.timerStartedAt.getTime()) / 1000)
        );
        todo.timerStartedAt = null;
      }
    }

    if (req.body.timerAction === "start") {
      todo.timerStartedAt = todo.timerStartedAt || new Date();
    }

    if (req.body.timerAction === "stop" && todo.timerStartedAt) {
      todo.timeSpentSeconds += Math.max(
        0,
        Math.floor((Date.now() - todo.timerStartedAt.getTime()) / 1000)
      );
      todo.timerStartedAt = null;
    }

    if (req.body.timerAction === "reset") {
      todo.timeSpentSeconds = 0;
      todo.timerStartedAt = null;
    }

    if (typeof req.body.title === "string" && !todo.title) {
      return res.status(400).json({ message: "Todo title cannot be empty" });
    }

    if (
      typeof req.body.title !== "string" &&
      typeof req.body.completed !== "boolean" &&
      !["start", "stop", "reset"].includes(req.body.timerAction)
    ) {
      return res.status(400).json({ message: "No valid fields provided" });
    }

    const updatedTodo = await todo.save();
    res.json(updatedTodo);
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ message: "Todo not found" });
    }

    const todo = await Todo.findByIdAndDelete(req.params.id);

    if (!todo) {
      return res.status(404).json({ message: "Todo not found" });
    }

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
