import express from "express";
import { body } from "express-validator";
import dotenv from "dotenv";
import LoginController from '../Controllers/LoginController.js'

dotenv.config();
const LoginRoute = express.Router();

LoginRoute.post("/",
  [
    body("email").isEmail().withMessage("Invalid email"),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  LoginController
);

export default LoginRoute;
