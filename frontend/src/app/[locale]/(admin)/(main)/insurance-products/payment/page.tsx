
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { useEffect, useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import type { ProductOffer } from "@/components/insurance/ProductOfferCard";

type PaymentInformation = {
  cardHolderName: string;
  cardBrand: "VISA" | "MASTERCARD";
  last4: string;
  mockTransactionId: string;
};

export default function PaymentPage() {
  const router = useRouter();
  const t = useTranslations("policyFlow.payment");

  const [selectedOffer, setSelectedOffer] =
    useState<ProductOffer | null>(null);

  const [isInitialized, setIsInitialized] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isValidated, setIsValidated] = useState(false);

  useEffect(() => {
    const storedOffer = sessionStorage.getItem(
      "policyflow.selectedOffer",
    );

    if (storedOffer) {
      try {
        setSelectedOffer(JSON.parse(storedOffer) as ProductOffer);
      } catch {
        setSelectedOffer(null);
      }
    }

    setIsInitialized(true);
  }, []);

  const formattedPrice = selectedOffer
    ? new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: selectedOffer.currency || "TRY",
      minimumFractionDigits: 2,
    }).format(Number(selectedOffer.basePrice))
    : "";

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setErrorMessage("");
    setIsValidated(false);

    const formData = new FormData(event.currentTarget);

    const cardHolderName = String(
      formData.get("cardHolderName") ?? "",
    ).trim();

    const cardNumber = String(
      formData.get("cardNumber") ?? "",
    ).replace(/\D/g, "");

    const expiryDate = String(
      formData.get("expiryDate") ?? "",
    ).trim();

    const cvv = String(
      formData.get("cvv") ?? "",
    ).trim();

    if (cardNumber.length < 13 || cardNumber.length > 19) {
      setErrorMessage(t("invalidCardNumber"));
      return;
    }

    const cardBrand = cardNumber.startsWith("4")
      ? "VISA"
      : cardNumber.startsWith("5")
        ? "MASTERCARD"
        : null;

    if (!cardBrand) {
      setErrorMessage(t("unsupportedCard"));
      return;
    }

    if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(expiryDate)) {
      setErrorMessage(t("invalidExpiryDate"));
      return;
    }

    if (!/^\d{3,4}$/.test(cvv)) {
      setErrorMessage(t("invalidCvv"));
      return;
    }

    if (!selectedOffer) {
      setErrorMessage(t("noOfferSelected"));
      return;
    }

    // Store only mock payment metadata.
    // Never store the full card number or CVV.
    const paymentInformation: PaymentInformation = {
      cardHolderName,
      cardBrand,
      last4: cardNumber.slice(-4),
      mockTransactionId: `MOCK-${Date.now()}`,
    };

    sessionStorage.setItem(
      "policyflow.paymentInformation",
      JSON.stringify(paymentInformation),
    );

    router.push("/insurance-products/payment/3d-secure");
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Link
        href="/insurance-products/offers"
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

        {t("backToOffers")}
      </Link>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-800 dark:text-white/90">
          {t("title")}
        </h1>

        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {t("description")}
        </p>
      </div>

      {!isInitialized ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <p className="text-sm text-gray-500">{t("loading")}</p>
        </div>
      ) : !selectedOffer ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <p className="text-sm text-error-600 dark:text-error-400">
            {t("noOfferSelected")}
          </p>

          <Link
            href="/insurance-products/offers"
            className="mt-4 inline-flex h-10 items-center rounded-lg bg-brand-500 px-4 text-sm font-medium text-white hover:bg-brand-600"
          >
            {t("backToOffers")}
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-2">
          {/* Card Information */}
          <form
            onSubmit={handleSubmit}
            className="space-y-5 rounded-2xl border border-gray-200 bg-white p-6 shadow-theme-sm dark:border-gray-800 dark:bg-white/[0.03]"
          >
            <div>
              <h2 className="text-base font-semibold text-gray-800 dark:text-white/90">
                {t("cardDetails")}
              </h2>

              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {t("cardDescription")}
              </p>
            </div>

            {/* Card Holder */}
            <div>
              <label
                htmlFor="cardHolderName"
                className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                {t("cardHolderName")}
              </label>

              <input
                id="cardHolderName"
                name="cardHolderName"
                type="text"
                placeholder={t("cardHolderPlaceholder")}
                autoComplete="cc-name"
                required
                className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-500 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
              />
            </div>

            {/* Card Number */}
            <div>
              <label
                htmlFor="cardNumber"
                className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                {t("cardNumber")}
              </label>

              <input
                id="cardNumber"
                name="cardNumber"
                type="text"
                placeholder="0000 0000 0000 0000"
                autoComplete="cc-number"
                inputMode="numeric"
                maxLength={19}
                minLength={13}
                pattern="[0-9 ]{13,19}"
                required
                className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm tracking-wider text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-500 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
              />
            </div>

            {/* Expiry and CVV */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="expiryDate"
                  className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  {t("expiryDate")}
                </label>

                <input
                  id="expiryDate"
                  name="expiryDate"
                  type="text"
                  placeholder="MM/YY"
                  autoComplete="cc-exp"
                  maxLength={5}
                  pattern="(0[1-9]|1[0-2])/[0-9]{2}"
                  required
                  className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-500 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                />
              </div>

              <div>
                <label
                  htmlFor="cvv"
                  className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  {t("cvv")}
                </label>

                <input
                  id="cvv"
                  name="cvv"
                  type="password"
                  placeholder="***"
                  autoComplete="cc-csc"
                  inputMode="numeric"
                  maxLength={4}
                  minLength={3}
                  pattern="[0-9]{3,4}"
                  required
                  className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-500 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                />
              </div>
            </div>

            <div className="rounded-lg bg-gray-50 p-3 dark:bg-white/[0.03]">
              <p className="text-xs leading-5 text-gray-500 dark:text-gray-400">
                {t("demoPaymentNotice")}
              </p>
            </div>

            {errorMessage && (
              <div
                role="alert"
                className="rounded-lg bg-error-50 px-4 py-3 text-sm text-error-600 dark:bg-error-500/10 dark:text-error-400"
              >
                {errorMessage}
              </div>
            )}

            {isValidated && (
              <div
                role="status"
                className="rounded-lg bg-success-50 px-4 py-3 text-sm text-success-700 dark:bg-success-500/10 dark:text-success-400"
              >
                {t("cardValidationSuccess")}
              </div>
            )}

            <div className="flex justify-end border-t border-gray-200 pt-5 dark:border-gray-800">
              <button
                type="submit"
                className="inline-flex h-11 items-center justify-center rounded-lg bg-brand-500 px-6 text-sm font-medium text-white transition hover:bg-brand-600"
              >
                {t("validateCardDetails")}
              </button>
            </div>
          </form>

          {/* Selected Offer */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-theme-sm dark:border-gray-800 dark:bg-white/[0.03]">
            <h2 className="text-base font-semibold text-gray-800 dark:text-white/90">
              {t("selectedOffer")}
            </h2>

            <div className="mt-5 space-y-4">
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {t("insuranceCompany")}
                </span>

                <span className="text-sm font-semibold text-gray-800 dark:text-white/90">
                  {selectedOffer.insuranceCompanyName}
                </span>
              </div>

              <div className="flex items-center justify-between gap-4">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {t("product")}
                </span>

                <span className="text-right text-sm font-semibold text-gray-800 dark:text-white/90">
                  {selectedOffer.productName}
                </span>
              </div>

              <div className="flex items-center justify-between gap-4">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {t("productCode")}
                </span>

                <span className="text-sm text-gray-800 dark:text-white/90">
                  {selectedOffer.productCode}
                </span>
              </div>

              <div className="border-t border-gray-200 pt-4 dark:border-gray-800">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                    {t("premium")}
                  </span>

                  <span className="text-2xl font-bold text-gray-800 dark:text-white/90">
                    {formattedPrice}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
