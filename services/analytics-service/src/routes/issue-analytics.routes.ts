
import { Router } from "express";
import { getIssueAnalytics } from "../controllers/issue-analytics.controller.js";

const router = Router();

// Poliçe analitik kayıtlarını sayfalı olarak listeler.
router.get("/", getIssueAnalytics);

export default router;
