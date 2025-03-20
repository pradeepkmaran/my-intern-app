import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const loginDB = mongoose.createConnection(process.env.MONGO_URI_LOGIN);
const usersDB = mongoose.createConnection(process.env.MONGO_URI_USERS);

loginDB.once("open", () => console.log("Connected to the 'login' database"));
usersDB.once("open", () => console.log("Connected to the 'users' database"));

export { loginDB, usersDB };
