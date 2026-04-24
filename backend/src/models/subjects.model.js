import mongoose from "mongoose";

const subjectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    code: { type: String, unique: true },
    icon: String,
    color: String,
    description: String,
  },
  { timestamps: true },
);

export default mongoose.model("Subject", subjectSchema);
