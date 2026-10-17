import { Router } from "express";
import { handleSeedDemo, handleResetDemo } from "../controllers/demo.controller.js";

export const demoRouter = Router();

demoRouter.post("/seed", handleSeedDemo);
demoRouter.delete("/reset", handleResetDemo);
