
import { validate as isValidUUID } from "uuid";
import AnalyticsDataSource from "../infrastructure/data-source.js";
import { IssueAnalytics } from "../entities/issue-analytics.entity.js";

type AnalyticsPeriod = "1d" | "7d" | "30d";

interface PolicyIssuedEvent {
  event: "policy.issued";
  data: {
    policyId: string;
    policyNumber: string;
    customerId: string;
    policyType: string;
    premiumAmount: number | string;
    startDate: string;
    endDate: string;
    insuranceCompanyName: string;
    productName: string;
  };
}

interface GetIssueAnalyticsOptions {
  period: AnalyticsPeriod;
  productType?: string;
  limit: number;
  offset: number;
}

// Kafka üzerinden gelen poliçe kesim event'ini analitik tablosuna kaydeder.
export const saveIssuedPolicyAnalytics = async (
  eventId: string,
  event: PolicyIssuedEvent
): Promise<void> => {
  if (!isValidUUID(eventId)) {
    throw new Error("Invalid eventId UUID");
  }

  if (event?.event !== "policy.issued" || !event.data) {
    throw new Error("Invalid policy.issued event");
  }

  const data = event.data;

  if (!isValidUUID(data.policyId) || !isValidUUID(data.customerId)) {
    throw new Error("Invalid policyId or customerId UUID");
  }

  const requiredFields = [
    data.policyNumber,
    data.policyType,
    data.startDate,
    data.endDate,
    data.insuranceCompanyName,
    data.productName,
  ];

  if (
    requiredFields.some(
      (value) => typeof value !== "string" || !value.trim()
    )
  ) {
    throw new Error("Policy issued event contains missing required fields");
  }

  if (
    Number.isNaN(Date.parse(data.startDate)) ||
    Number.isNaN(Date.parse(data.endDate))
  ) {
    throw new Error("Invalid policy dates");
  }

  const premiumAmount = Number(data.premiumAmount);

  if (!Number.isFinite(premiumAmount) || premiumAmount < 0) {
    throw new Error("Invalid premiumAmount");
  }

  const repository = AnalyticsDataSource.getRepository(IssueAnalytics);

  const analyticsRecord = repository.create({
    eventId,
    policyId: data.policyId,
    policyNumber: data.policyNumber,
    customerId: data.customerId,
    policyType: data.policyType,
    premiumAmount: premiumAmount.toFixed(2),
    startDate: data.startDate,
    endDate: data.endDate,
    insuranceCompanyName: data.insuranceCompanyName,
    productName: data.productName,
  });

  await repository
    .createQueryBuilder()
    .insert()
    .into(IssueAnalytics)
    .values(analyticsRecord)
    .orIgnore()
    .execute();
};

// Poliçe analitik kayıtlarını tarih ve ürün kategorisine göre sayfalı listeler.
export const getIssueAnalytics = async ({
  period,
  productType,
  limit,
  offset,
}: GetIssueAnalyticsOptions) => {
  const periodInHours: Record<AnalyticsPeriod, number> = {
    "1d": 24,
    "7d": 24 * 7,
    "30d": 24 * 30,
  };

  const hours = periodInHours[period];

  const repository = AnalyticsDataSource.getRepository(IssueAnalytics);

  const query = repository
    .createQueryBuilder("analytics")
    .where(
      "analytics.created_at >= NOW() - (:hours * INTERVAL '1 hour')",
      { hours }
    );

  if (productType) {
    query.andWhere("analytics.policy_type = :productType", {
      productType,
    });
  }

  const [records, total] = await query
    .orderBy("analytics.created_at", "DESC")
    .take(limit)
    .skip(offset)
    .getManyAndCount();

  return {
    records,
    meta: {
      total,
      limit,
      offset,
      totalPages: Math.ceil(total / limit),
      currentPage: Math.floor(offset / limit) + 1,
      period,
      productType: productType ?? null,
    },
  };
};
