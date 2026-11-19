
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import ProductOfferCard, {
  type ProductOffer,
} from "@/components/insurance/ProductOfferCard";

type InsuranceType = "traffic" | "comprehensive" | "travel";

type VehicleInformation = {
  isNewVehicle: boolean;
  plate?: string;
  registrationSerial?: string;
  registrationNumber?: string;
  brand: string;
  model: string;
};

type ProposalResponse = {
  success: boolean;
  data?: {
    customerId: string;
    products: ProductOffer[];
  };
  error?: {
    code?: string;
    message?: string;
  };
};

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

const insuranceConfig = {
  traffic: {
    productSubType: "TRAFFIC",
    group: "vehicle",
    type: "traffic",
    backUrl:
      "/insurance-products/vehicle-insurance/traffic/vehicle-information",
  },
  comprehensive: {
    productSubType: "INSURANCE",
    group: "vehicle",
    type: "comprehensive",
    backUrl:
      "/insurance-products/vehicle-insurance/comprehensive/vehicle-information",
  },
  travel: {
    productSubType: "TRAVEL",
    group: "health",
    type: "travel",
    backUrl: "/insurance-products/health-insurance/travel",
  },
} as const;

const delay = (milliseconds: number) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

export default function OffersPage() {
  const t = useTranslations("policyFlow.offers");
  const router = useRouter();

  const [insuranceType, setInsuranceType] =
    useState<InsuranceType | null>(null);
  const [offers, setOffers] = useState<ProductOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(5);
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedProductId, setSelectedProductId] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    let isActive = true;
    let progressTimer: ReturnType<typeof setInterval> | undefined;

    async function loadOffers() {
      try {
        const customerId = sessionStorage.getItem(
          "policyflow.customerId",
        );

        const storedInsuranceType = sessionStorage.getItem(
          "policyflow.insuranceType",
        );

        const storedVehicleInformation = sessionStorage.getItem(
          "policyflow.vehicleInformation",
        );

        if (
          !customerId ||
          !storedInsuranceType ||
          !storedVehicleInformation
        ) {
          throw new Error(t("missingInformation"));
        }

        if (
          !Object.prototype.hasOwnProperty.call(
            insuranceConfig,
            storedInsuranceType,
          )
        ) {
          throw new Error(t("invalidInsuranceType"));
        }

        const currentType = storedInsuranceType as InsuranceType;
        const config = insuranceConfig[currentType];

        const vehicleInformation = JSON.parse(
          storedVehicleInformation,
        ) as VehicleInformation;

        if (isActive) {
          setInsuranceType(currentType);
        }

        progressTimer = setInterval(() => {
          if (!isActive) return;

          setProgress((current) =>
            Math.min(current + 3, 90),
          );
        }, 120);

        const startedAt = Date.now();

        const response = await fetch(
          `${API_BASE_URL}/api/proposals/vehicle`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              customerId,
              productSubType: config.productSubType,
              vehicleInformation,
            }),
            signal: controller.signal,
          },
        );

        const result =
          (await response.json()) as ProposalResponse;

        // Keep the loading screen visible for at least 1.8 seconds.
        const remainingTime = Math.max(
          0,
          1800 - (Date.now() - startedAt),
        );

        if (remainingTime > 0) {
          await delay(remainingTime);
        }

        if (!response.ok || !result.success || !result.data) {
          throw new Error(
            result.error?.message || t("requestFailed"),
          );
        }

        if (!isActive) return;

        setProgress(100);
        await delay(250);

        if (!isActive) return;

        setOffers(result.data.products || []);
      } catch (error) {
        if (!isActive || controller.signal.aborted) return;

        setErrorMessage(
          error instanceof Error
            ? error.message
            : t("requestFailed"),
        );
      } finally {
        if (progressTimer) {
          clearInterval(progressTimer);
        }

        if (isActive) {
          setLoading(false);
        }
      }
    }

    loadOffers();

    return () => {
      isActive = false;
      controller.abort();

      if (progressTimer) {
        clearInterval(progressTimer);
      }
    };
  }, [t]);

  const handlePurchase = (productId: string) => {
    const selectedOffer = offers.find(
      (offer) => offer.id === productId,
    );

    if (!selectedOffer) {
      setErrorMessage(t("selectionFailed"));
      return;
    }

    sessionStorage.setItem(
      "policyflow.selectedProductId",
      selectedOffer.id,
    );

    sessionStorage.setItem(
      "policyflow.selectedOffer",
      JSON.stringify(selectedOffer),
    );

    setSelectedProductId(selectedOffer.id);

    router.push("/insurance-products/payment");
  };

  const currentConfig = insuranceType
    ? insuranceConfig[insuranceType]
    : null;

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Link
        href={currentConfig?.backUrl || "/insurance-products"}
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

        {t("back")}
      </Link>

      {/* Page Header */}
      <div>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold text-gray-800 dark:text-white/90">
            {currentConfig
              ? `${t(`groups.${currentConfig.group}`)} - ${t(
                `types.${currentConfig.type}`,
              )}`
              : t("title")}
          </h1>

          {!loading && !errorMessage && (
            <span className="rounded-full bg-brand-50 px-3 py-1 text-sm font-medium text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
              {t("offerCount", { count: offers.length })}
            </span>
          )}
        </div>

        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {loading ? t("loadingDescription") : t("description")}
        </p>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex min-h-80 flex-col items-center justify-center rounded-2xl border border-gray-200 bg-white p-8 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="relative flex h-28 w-28 items-center justify-center">
            <svg
              className="absolute h-28 w-28 -rotate-90"
              viewBox="0 0 100 100"
              aria-hidden="true"
            >
              <circle
                cx="50"
                cy="50"
                r="42"
                fill="none"
                stroke="currentColor"
                strokeWidth="7"
                className="text-gray-100 dark:text-gray-800"
              />

              <circle
                cx="50"
                cy="50"
                r="42"
                fill="none"
                stroke="currentColor"
                strokeWidth="7"
                strokeLinecap="round"
                strokeDasharray={String(2 * Math.PI * 42)}
                strokeDashoffset={String(
                  2 * Math.PI * 42 * (1 - progress / 100),
                )}
                className="text-brand-500 transition-all duration-300"
              />
            </svg>

            <span className="text-xl font-semibold text-gray-800 dark:text-white/90">
              {progress}%
            </span>
          </div>

          <h2 className="mt-6 text-lg font-semibold text-gray-800 dark:text-white/90">
            {t("loadingTitle")}
          </h2>

          <p className="mt-2 text-center text-sm text-gray-500 dark:text-gray-400">
            {t("loadingDescription")}
          </p>
        </div>
      )}

      {/* Error */}
      {!loading && errorMessage && (
        <div
          role="alert"
          className="rounded-2xl border border-error-200 bg-error-50 p-6 dark:border-error-500/30 dark:bg-error-500/10"
        >
          <p className="text-sm text-error-600 dark:text-error-400">
            {errorMessage}
          </p>

          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-4 inline-flex h-10 items-center justify-center rounded-lg bg-brand-500 px-4 text-sm font-medium text-white hover:bg-brand-600"
          >
            {t("retry")}
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !errorMessage && offers.length === 0 && (
        <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center dark:border-gray-800 dark:bg-white/[0.03]">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            {t("emptyTitle")}
          </h2>

          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            {t("emptyDescription")}
          </p>
        </div>
      )}

      {/* Offers */}
      {!loading && !errorMessage && offers.length > 0 && (
        <>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {offers.map((offer) => (
              <ProductOfferCard
                key={offer.id}
                offer={offer}
                purchaseLabel={t("purchase")}
                selectedLabel={t("selected")}
                priceLabel={t("price")}
                isSelected={selectedProductId === offer.id}
                onPurchase={handlePurchase}
              />
            ))}
          </div>

          {selectedProductId && (
            <p className="text-sm text-success-600 dark:text-success-400">
              {t("selectionSaved")}
            </p>
          )}
        </>
      )}
    </div>
  );
}
