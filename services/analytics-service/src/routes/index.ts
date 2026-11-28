
import { Router } from "express";
import issueAnalyticsRoutes from "./issue-analytics.routes.js"

const router = Router();

router.use("/issue", issueAnalyticsRoutes);

export default router;
