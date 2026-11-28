
import { validate as isValidUUID } from "uuid";
import AnalyticsDataSource from "../infrastructure/data-source.js";
import { IssueAnalytics } from "../entities/issue-analytics.entity.js";

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

// Poliçe analitik kayıtlarını pagination ile listeler.
export const getIssueAnalytics = async ({
  limit,
  offset,
}: GetIssueAnalyticsOptions) => {
  const repository = AnalyticsDataSource.getRepository(IssueAnalytics);

  const [records, total] = await repository.findAndCount({
    order: {
      createdAt: "DESC",
    },
    take: limit,
    skip: offset,
  });

  return {
    records,
    meta: {
      total,
      limit,
      offset,
      totalPages: Math.ceil(total / limit),
      currentPage: Math.floor(offset / limit) + 1,
    },
  };
};
