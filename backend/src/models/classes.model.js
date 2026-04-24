import mongoose from "mongoose";

const classSchema = new mongoose.Schema(
  {
    name: String,
    teacherId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    studentIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true },
);

export default mongoose.model("Class", classSchema);
