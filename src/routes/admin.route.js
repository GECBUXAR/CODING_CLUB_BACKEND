import express from "express";
import { createAdmin, loginAdmin } from "../controller/admin.controller.js";
const router = express.Router();

router.post("/signup", createAdmin);
router.post("/login", loginAdmin);
router.post("/logout", loginAdmin);

export default router;
