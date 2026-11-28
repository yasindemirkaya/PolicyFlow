
import { Router } from "express";
import {
  getIssueAnalytics,
  getIssueAnalyticsSummary,
} from "../controllers/issue-analytics.controller.js";

const router = Router();

// Poliçe analitik kayıtlarını sayfalı olarak listeler.
router.get("/", getIssueAnalytics);

// Poliçe analitik özetini tarih ve ürün kategorisine göre getirir.
router.get("/summary", getIssueAnalyticsSummary);

export default router;
