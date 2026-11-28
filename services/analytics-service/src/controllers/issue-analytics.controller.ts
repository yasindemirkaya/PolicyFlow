
import type { Request, Response } from "express";
import { getIssueAnalytics as getIssueAnalyticsService } from "../services/issue-analytics.service.js";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

const ALLOWED_PERIODS = ["1d", "7d", "30d"] as const;

export const getIssueAnalytics = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { period, productType } = req.query;
    const limitParam = req.query.limit;
    const offsetParam = req.query.offset;

    if (
      typeof period !== "string" ||
      !ALLOWED_PERIODS.includes(period as (typeof ALLOWED_PERIODS)[number])
    ) {
      res.status(400).json({
        success: false,
        message: "Period is required and must be 1d, 7d or 30d.",
      });
      return;
    }

    if (
      productType !== undefined &&
      (typeof productType !== "string" || !productType.trim())
    ) {
      res.status(400).json({
        success: false,
        message: "Invalid productType.",
      });
      return;
    }

    const limit =
      limitParam === undefined
        ? DEFAULT_LIMIT
        : typeof limitParam === "string" && /^\d+$/.test(limitParam)
          ? Number(limitParam)
          : NaN;

    const offset =
      offsetParam === undefined
        ? 0
        : typeof offsetParam === "string" && /^\d+$/.test(offsetParam)
          ? Number(offsetParam)
          : NaN;

    if (
      !Number.isSafeInteger(limit) ||
      limit < 1 ||
      limit > MAX_LIMIT ||
      !Number.isSafeInteger(offset) ||
      offset < 0
    ) {
      res.status(400).json({
        success: false,
        message: `Invalid pagination parameters. Limit must be between 1 and ${MAX_LIMIT}, offset must be zero or greater.`,
      });
      return;
    }

    const result = await getIssueAnalyticsService({
      period: period as "1d" | "7d" | "30d",
      productType: productType as string | undefined,
      limit,
      offset,
    });

    res.status(200).json({
      success: true,
      data: result.records,
      meta: result.meta,
    });
  } catch (error) {
    console.error("[Analytics] Failed to fetch issue analytics:", error);

    res.status(500).json({
      success: false,
      message: "Failed to retrieve issue analytics.",
    });
  }
};
