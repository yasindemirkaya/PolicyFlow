"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

type ErrorReason = "payment" | "issue" | "unknown";

interface IssueError {
  code?: string;
  message?: string;
}

export default function PaymentErrorPage() {
  const router = useRouter();
  const t = useTranslations("policyFlow.paymentError");

  const [reason, setReason] = useState<ErrorReason>("unknown");
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const threeDSecureStatus = sessionStorage.getItem(
        "policyflow.threeDSecureStatus"
      );

      const issueStatus = sessionStorage.getItem("policyflow.issueStatus");
      const storedError = sessionStorage.getItem("policyflow.issueError");

      let parsedError: IssueError | null = null;

      if (storedError) {
        try {
          parsedError = JSON.parse(storedError) as IssueError;
        } catch {
          parsedError = null;
        }
      }

      if (threeDSecureStatus === "FAILED") {
        setReason("payment");
      } else if (issueStatus === "failed" || parsedError) {
        setReason("issue");
        setErrorCode(parsedError?.code ?? null);
      } else {
        setReason("unknown");
      }
    } finally {
      setIsLoaded(true);
    }
  }, []);

  const handlePrimaryAction = () => {
    if (reason === "payment") {
      router.push("/insurance-products/payment");
      return;
    }

    if (reason === "issue") {
      router.push("/insurance-products/offers");
      return;
    }

    router.push("/insurance-products");
  };

  const handleBackToProducts = () => {
    router.push("/insurance-products");
  };

  if (!isLoaded) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-9 w-9 animate-spin rounded-full border-4 border-gray-200 border-t-brand-500" />
      </div>
    );
  }

  const title =
    reason === "payment"
      ? t("paymentFailedTitle")
      : reason === "issue"
        ? t("issueFailedTitle")
        : t("unknownErrorTitle");

  const description =
    reason === "payment"
      ? t("paymentFailedDescription")
      : reason === "issue"
        ? t("issueFailedDescription")
        : t("unknownErrorDescription");

  const primaryButtonLabel =
    reason === "payment"
      ? t("tryPaymentAgain")
      : reason === "issue"
        ? t("backToOffers")
        : t("backToProducts");

  return (
    <div className="mx-auto flex min-h-[65vh] w-full max-w-2xl items-center justify-center px-4 py-8">
      <div className="w-full rounded-2xl border border-gray-200 bg-white p-6 text-center shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:p-8">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-500/10 dark:text-red-400">
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
              d="M12 9v4m0 4h.01M10.3 3.9 2.8 17a2 2 0 0 0 1.7 3h15a2 2 0 0 0 1.7-3l-7.5-13.1a2 2 0 0 0-3.4 0Z"
            />
          </svg>
        </div>

        <h1 className="mt-5 text-2xl font-semibold text-gray-900 dark:text-white">
          {title}
        </h1>

        <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-gray-500 dark:text-gray-400">
          {description}
        </p>

        {errorCode && (
          <div className="mt-5 rounded-lg bg-gray-50 px-4 py-3 dark:bg-gray-800/60">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {t("referenceCode")}
            </p>
            <p className="mt-1 text-sm font-medium text-gray-800 dark:text-gray-200">
              {errorCode}
            </p>
          </div>
        )}

        <div className="mt-6 rounded-lg bg-gray-50 p-4 text-xs text-gray-500 dark:bg-gray-800/60 dark:text-gray-400">
          {t("demoNotice")}
        </div>

        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <button
            type="button"
            onClick={handlePrimaryAction}
            className="inline-flex items-center justify-center rounded-lg bg-brand-500 px-6 py-3 text-sm font-medium text-white transition hover:bg-brand-600"
          >
            {primaryButtonLabel}
          </button>

          <button
            type="button"
            onClick={handleBackToProducts}
            className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-6 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            {t("backToProducts")}
          </button>
        </div>
      </div>
    </div>
  );
}