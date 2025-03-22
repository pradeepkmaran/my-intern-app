import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const connectDB = async () => {
  try {
    const loginDB = await mongoose.createConnection(process.env.MONGO_URI_LOGIN);
    const usersDB = await mongoose.createConnection(process.env.MONGO_URI_USERS);

    console.log("Connected to MongoDB Atlas!");

    return { loginDB, usersDB };
  } catch (err) {
    console.error("MongoDB Connection Error:", err);
    process.exit(1);
  }
};

const { loginDB, usersDB } = await connectDB();
export { loginDB, usersDB };
