import mongoose from "mongoose";

const loginUserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  pw: { type: String, required: true },
  user_type: { type: String, required: true },
});

export default (connection) => connection.model("LoginUser", loginUserSchema, "users");
