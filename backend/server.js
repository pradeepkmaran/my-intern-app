import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import LoginRoute from "./Routes/LoginRoute.js";
import LogoutRoute from "./Routes/LogoutRoute.js";
import StudentRoute from "./Routes/StudentRoute.js";
import AuthVerifyRoute from "./Routes/AuthVerifyRoute.js";
import authVerify from "./Middlewares/AuthVerify.js";
import verifyRole from "./Middlewares/VerifyToken.js";
import { loginDB, usersDB } from "./db.js";

dotenv.config();

const app = express();
app.use(cookieParser());
app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(express.json());

const PORT = process.env.PORT || 5000;

loginDB.once("open", () => {
  console.log("Connected to 'login' database");
  loginDB.db.listCollections().toArray((err, collections) => {
    if (err) console.error("Error listing collections:", err);
    else collections.forEach((col) => console.log("Collection:", col.name));
  });
});

usersDB.once("open", () => {
  console.log("Connected to 'users' database");
  usersDB.db.listCollections().toArray((err, collections) => {
    if (err) console.error("Error listing collections:", err);
    else collections.forEach((col) => console.log("Collection:", col.name));
  });
});

app.get("/", (req, res) => res.send("<h1>Hi</h1>"));
app.use("/api/user/login", LoginRoute);
app.use("/api/user/logout", authVerify, LogoutRoute);
app.use("/api/user/me", AuthVerifyRoute);
app.use("/api/user/student", authVerify, verifyRole(['student']), StudentRoute);
// app.use("/api/user/faculty", verifyRole(['faculty']), FacultyRoute);
// app.use("/api/user/admin", verifyRole(['admin']), AdminRoute);

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
