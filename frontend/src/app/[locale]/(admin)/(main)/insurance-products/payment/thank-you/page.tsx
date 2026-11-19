"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

interface IssuedPolicy {
  id: string;
  policyNumber: string;
  policyType: string;
  premiumAmount: string | number;
  startDate: string;
  endDate: string;
  insuranceCompanyName: string;
  productName: string;
}

function formatDate(value: string): string {
  const [year, month, day] = value.slice(0, 10).split("-").map(Number);

  if (!year || !month || !day) return value;

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(year, month - 1, day));
}

function formatAmount(value: string | number): string {
  const amount = Number(value);

  if (!Number.isFinite(amount)) return String(value);

  return `₺${amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export default function ThankYouPage() {
  const router = useRouter();
  const t = useTranslations("policyFlow.paymentThankYou");

  const [policy, setPolicy] = useState<IssuedPolicy | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const issueStatus = sessionStorage.getItem("policyflow.issueStatus");
      const storedPolicy = sessionStorage.getItem("policyflow.issuedPolicy");

      if (issueStatus !== "completed" || !storedPolicy) {
        setPolicy(null);
        return;
      }

      const parsedPolicy = JSON.parse(storedPolicy) as IssuedPolicy;

      if (!parsedPolicy.policyNumber) {
        setPolicy(null);
        return;
      }

      setPolicy(parsedPolicy);
    } catch {
      setPolicy(null);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  const handleBackToProducts = () => {
    [
      "customerId",
      "insuranceType",
      "vehicleInformation",
      "selectedProductId",
      "selectedOffer",
      "paymentInformation",
      "threeDSecureStatus",
      "issueStatus",
      "issueError",
      "issuedPolicy",
    ].forEach((key) => sessionStorage.removeItem(`policyflow.${key}`));

    router.push("/insurance-products");
  };

  if (!isLoaded) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-9 w-9 animate-spin rounded-full border-4 border-gray-200 border-t-brand-500" />
      </div>
    );
  }

  if (!policy) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="w-full max-w-xl rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
            {t("detailsUnavailableTitle")}
          </h1>

          <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
            {t("detailsUnavailableDescription")}
          </p>

          <button
            type="button"
            onClick={handleBackToProducts}
            className="mt-6 inline-flex items-center justify-center rounded-lg bg-brand-500 px-5 py-3 text-sm font-medium text-white transition hover:bg-brand-600"
          >
            {t("backToProducts")}
          </button>
        </div>
      </div>
    );
  }

  const details = [
    { label: t("policyNumber"), value: policy.policyNumber },
    { label: t("product"), value: policy.productName },
    { label: t("insuranceCompany"), value: policy.insuranceCompanyName },
    { label: t("premium"), value: formatAmount(policy.premiumAmount) },
    { label: t("startDate"), value: formatDate(policy.startDate) },
    { label: t("endDate"), value: formatDate(policy.endDate) },
  ];

  return (
    <div className="mx-auto flex min-h-[65vh] w-full max-w-3xl items-center justify-center px-4 py-8">
      <div className="w-full rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:p-8">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-500/10 dark:text-green-400">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="h-9 w-9"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m5 12 4 4L19 6"
              />
            </svg>
          </div>

          <h1 className="mt-5 text-2xl font-semibold text-gray-900 dark:text-white">
            {t("title")}
          </h1>

          <p className="mt-2 max-w-lg text-sm text-gray-500 dark:text-gray-400">
            {t("description")}
          </p>
        </div>

        <div className="mt-8 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between gap-4 border-b border-gray-200 px-5 py-4 dark:border-gray-700">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {t("policyStatus")}
            </span>

            <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700 dark:bg-green-500/10 dark:text-green-400">
              {t("active")}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-5 p-5 sm:grid-cols-2">
            {details.map((detail) => (
              <div key={detail.label} className="min-w-0">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {detail.label}
                </p>
                <p className="mt-1 break-words text-sm font-medium text-gray-900 dark:text-white">
                  {detail.value}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 rounded-lg bg-gray-50 p-4 text-center dark:bg-gray-800/60">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {t("demoNotice")}
          </p>
        </div>

        <div className="mt-7 flex justify-center">
          <button
            type="button"
            onClick={handleBackToProducts}
            className="inline-flex items-center justify-center rounded-lg bg-brand-500 px-6 py-3 text-sm font-medium text-white transition hover:bg-brand-600"
          >
            {t("backToProducts")}
          </button>
        </div>
      </div>
    </div>
  );
}