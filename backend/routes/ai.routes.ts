import { Router } from "express";
import rateLimit from "express-rate-limit";
import { AiController } from "../controllers/ai.controller";
import { CopilotController } from "../controllers/copilot.controller";

const router = Router();

const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: { error: "Too many requests" }
});

router.post("/chat", chatLimiter, AiController.chat);
router.post("/copilot", chatLimiter, CopilotController.analyze);

export const aiRoutes = router;
