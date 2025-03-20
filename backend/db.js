// db.js
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const loginDB = mongoose.createConnection(process.env.MONGO_URI_LOGIN);
const internDB = mongoose.createConnection(process.env.MONGO_URI_INTERN);

loginDB.once("open", () => console.log("Connected to the 'login' database"));
internDB.once("open", () => console.log("Connected to the 'intern-app' database"));

export { loginDB, internDB };
