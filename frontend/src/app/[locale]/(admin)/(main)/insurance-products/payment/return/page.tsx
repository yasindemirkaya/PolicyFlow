
"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

type PaymentInformation = {
  cardHolderName: string;
  cardBrand: "VISA" | "MASTERCARD";
  last4: string;
  mockTransactionId: string;
};

type IssuePolicyResponse = {
  success: boolean;
  data?: {
    id?: string;
    policyNumber?: string;
    policyType?: string;
    premiumAmount?: string | number;
    startDate?: string;
    endDate?: string;
    insuranceCompanyName?: string;
    productName?: string;
  };
  error?: {
    code?: string;
    message?: string;
  };
};

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export default function PaymentReturnPage() {
  const t = useTranslations("policyFlow.paymentReturn");
  const router = useRouter();

  const hasStarted = useRef(false);

  const [processingMessage, setProcessingMessage] = useState(
    t("processing"),
  );

  useEffect(() => {
    if (hasStarted.current) return;

    hasStarted.current = true;

    function redirectToError(code: string, message: string) {
      sessionStorage.setItem(
        "policyflow.issueStatus",
        "failed",
      );

      sessionStorage.setItem(
        "policyflow.issueError",
        JSON.stringify({ code, message }),
      );

      sessionStorage.removeItem(
        "policyflow.paymentInformation",
      );

      sessionStorage.removeItem(
        "policyflow.threeDSecureStatus",
      );

      router.replace("/insurance-products/payment/error");
    }

    async function completePurchase() {
      const queryStatus = new URLSearchParams(
        window.location.search,
      ).get("status");

      const threeDSecureStatus = sessionStorage.getItem(
        "policyflow.threeDSecureStatus",
      );

      // Validate the simulated 3D Secure result.
      if (
        queryStatus !== "success" ||
        threeDSecureStatus !== "SUCCESS"
      ) {
        redirectToError(
          "PAYMENT_FAILED",
          t("paymentVerificationFailed"),
        );
        return;
      }

      const customerId = sessionStorage.getItem(
        "policyflow.customerId",
      );

      const productId = sessionStorage.getItem(
        "policyflow.selectedProductId",
      );

      const storedPayment = sessionStorage.getItem(
        "policyflow.paymentInformation",
      );

      if (!customerId || !productId || !storedPayment) {
        redirectToError(
          "MISSING_PAYMENT_INFORMATION",
          t("missingInformation"),
        );
        return;
      }

      let paymentInformation: PaymentInformation;

      try {
        paymentInformation = JSON.parse(storedPayment);
      } catch {
        redirectToError(
          "INVALID_PAYMENT_INFORMATION",
          t("missingInformation"),
        );
        return;
      }

      if (
        !paymentInformation.cardHolderName ||
        !["VISA", "MASTERCARD"].includes(paymentInformation.cardBrand) ||
        !/^\d{4}$/.test(paymentInformation.last4) ||
        !paymentInformation.mockTransactionId
      ) {
        redirectToError(
          "INVALID_PAYMENT_INFORMATION",
          t("missingInformation"),
        );
        return;
      }

      // If this purchase has already completed, do not issue it again.
      const issueStatus = sessionStorage.getItem(
        "policyflow.issueStatus",
      );

      if (issueStatus === "completed") {
        router.replace("/insurance-products/payment/thank-you");
        return;
      }

      // Prevent duplicate requests during the same browser session.
      if (issueStatus === "processing") {
        setProcessingMessage(t("alreadyProcessing"));
        return;
      }

      sessionStorage.setItem(
        "policyflow.issueStatus",
        "processing",
      );

      try {
        const response = await fetch(
          `${API_BASE_URL}/api/policies/issue`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              customerId,
              productId,
              payment: {
                cardHolderName: paymentInformation.cardHolderName,
                cardBrand: paymentInformation.cardBrand,
                last4: paymentInformation.last4,
                mockTransactionId: paymentInformation.mockTransactionId,
                threeDSecureStatus: "SUCCESS",
              },
            }),
          },
        );

        const result =
          (await response.json()) as IssuePolicyResponse;

        if (!response.ok || !result.success || !result.data) {
          redirectToError(
            result.error?.code || "POLICY_ISSUE_FAILED",
            result.error?.message || t("issueFailed"),
          );
          return;
        }

        // Keep only the policy details needed by the Thank You page.
        const issuedPolicy = {
          id: result.data.id,
          policyNumber: result.data.policyNumber,
          policyType: result.data.policyType,
          premiumAmount: result.data.premiumAmount,
          startDate: result.data.startDate,
          endDate: result.data.endDate,
          insuranceCompanyName: result.data.insuranceCompanyName,
          productName: result.data.productName,
        };

        sessionStorage.setItem(
          "policyflow.issuedPolicy",
          JSON.stringify(issuedPolicy),
        );

        sessionStorage.setItem(
          "policyflow.issueStatus",
          "completed",
        );

        sessionStorage.removeItem(
          "policyflow.paymentInformation",
        );

        sessionStorage.removeItem(
          "policyflow.threeDSecureStatus",
        );

        router.replace("/insurance-products/payment/thank-you");
      } catch {
        redirectToError(
          "ISSUE_REQUEST_FAILED",
          t("issueRequestFailed"),
        );
      }
    }

    completePurchase();
  }, [router, t]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-theme-sm dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="relative mx-auto flex h-20 w-20 items-center justify-center">
          <svg
            className="absolute h-20 w-20 animate-spin text-brand-500"
            viewBox="0 0 80 80"
            fill="none"
            aria-hidden="true"
          >
            <circle
              cx="40"
              cy="40"
              r="34"
              stroke="currentColor"
              strokeWidth="5"
              strokeOpacity="0.15"
            />
            <path
              d="M40 6a34 34 0 0 1 34 34"
              stroke="currentColor"
              strokeWidth="5"
              strokeLinecap="round"
            />
          </svg>

          <svg
            className="h-8 w-8 text-brand-500"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M12 8v4l3 2" />
            <circle cx="12" cy="12" r="9" />
          </svg>
        </div>

        <h1 className="mt-6 text-xl font-semibold text-gray-800 dark:text-white/90">
          {t("title")}
        </h1>

        <p className="mt-2 text-sm leading-6 text-gray-500 dark:text-gray-400">
          {processingMessage}
        </p>

        <p className="mt-5 text-xs text-gray-400">
          {t("doNotClose")}
        </p>
      </div>
    </div>
  );
}
