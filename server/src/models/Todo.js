import mongoose from "mongoose";

const todoSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120
    },
    completed: {
      type: Boolean,
      default: false
    },
    timeSpentSeconds: {
      type: Number,
      default: 0,
      min: 0
    },
    timerStartedAt: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);

export default mongoose.model("Todo", todoSchema);
