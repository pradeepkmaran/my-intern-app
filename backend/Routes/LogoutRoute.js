import express from "express";
import dotenv from "dotenv";
import LogoutController from '../Controllers/AuthControllers/LogoutController.js'

dotenv.config();
const LogoutRoute = express.Router();

LogoutRoute.post("/", LogoutController);

export default LogoutRoute;
