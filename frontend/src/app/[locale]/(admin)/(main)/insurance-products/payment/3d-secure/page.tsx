
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

type PaymentInformation = {
  cardHolderName: string;
  cardBrand: "VISA" | "MASTERCARD";
  last4: string;
  mockTransactionId: string;
};

export default function ThreeDSecurePage() {
  const t = useTranslations("policyFlow.threeDSecure");
  const router = useRouter();

  const [paymentInformation, setPaymentInformation] =
    useState<PaymentInformation | null>(null);

  const [isProcessing, setIsProcessing] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const storedPayment = sessionStorage.getItem(
      "policyflow.paymentInformation",
    );

    const customerId = sessionStorage.getItem(
      "policyflow.customerId",
    );

    const productId = sessionStorage.getItem(
      "policyflow.selectedProductId",
    );

    if (storedPayment && customerId && productId) {
      try {
        setPaymentInformation(
          JSON.parse(storedPayment) as PaymentInformation,
        );
      } catch {
        setPaymentInformation(null);
      }
    }

    setIsInitialized(true);
  }, []);

  function completeThreeDSecure(status: "SUCCESS" | "FAILED") {
    if (!paymentInformation || isProcessing) return;

    setIsProcessing(true);

    sessionStorage.setItem(
      "policyflow.threeDSecureStatus",
      status,
    );

    // Simulate bank verification delay.
    setTimeout(() => {
      router.push(
        `/insurance-products/payment/return?status=${status.toLowerCase()}`,
      );
    }, 1500);
  }

  if (!isInitialized) {
    return null;
  }

  if (!paymentInformation) {
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-gray-200 bg-white p-8 text-center dark:border-gray-800 dark:bg-white/[0.03]">
        <h1 className="text-xl font-semibold text-gray-800 dark:text-white/90">
          {t("sessionError")}
        </h1>

        <Link
          href="/insurance-products/payment"
          className="mt-5 inline-flex h-10 items-center rounded-lg bg-brand-500 px-5 text-sm font-medium text-white hover:bg-brand-600"
        >
          {t("backToPayment")}
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <Link
        href="/insurance-products/payment"
        className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition hover:text-brand-600 dark:text-gray-400 dark:hover:text-brand-400"
      >
        <svg
          className="h-4 w-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="m15 18-6-6 6-6" />
          <path d="M20 12H9" />
        </svg>

        {t("backToPayment")}
      </Link>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-theme-sm dark:border-gray-800 dark:bg-white/[0.03] sm:p-8">
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
            <svg
              className="h-8 w-8"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z" />
              <path d="M12 8v4m0 4h.01" />
            </svg>
          </div>

          <h1 className="mt-5 text-xl font-semibold text-gray-800 dark:text-white/90">
            {t("title")}
          </h1>

          <p className="mt-2 text-sm leading-6 text-gray-500 dark:text-gray-400">
            {t("description")}
          </p>
        </div>

        <div className="mt-7 rounded-xl bg-gray-50 p-4 dark:bg-white/[0.03]">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {t("cardHolder")}
            </span>

            <span className="text-sm font-medium text-gray-800 dark:text-white/90">
              {paymentInformation.cardHolderName}
            </span>
          </div>

          <div className="mt-3 flex items-center justify-between gap-3">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {t("card")}
            </span>

            <span className="text-sm font-medium text-gray-800 dark:text-white/90">
              {paymentInformation.cardBrand} •••• {paymentInformation.last4}
            </span>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          <button
            type="button"
            disabled={isProcessing}
            onClick={() => completeThreeDSecure("SUCCESS")}
            className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-brand-500 px-5 text-sm font-medium text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isProcessing ? t("processing") : t("approve")}
          </button>

          <button
            type="button"
            disabled={isProcessing}
            onClick={() => completeThreeDSecure("FAILED")}
            className="inline-flex h-11 w-full items-center justify-center rounded-lg border border-gray-300 bg-white px-5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-transparent dark:text-gray-300 dark:hover:bg-white/[0.03]"
          >
            {t("decline")}
          </button>
        </div>

        <p className="mt-5 text-center text-xs text-gray-400">
          {t("demoNotice")}
        </p>
      </div>
    </div>
  );
}
