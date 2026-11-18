
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent, type HTMLInputTypeAttribute } from "react";
import { useTranslations } from "next-intl";

type CustomerInformationFormProps = {
  insuranceType: "traffic" | "comprehensive";
};

type FormFieldProps = {
  id: string;
  label: string;
  placeholder: string;
  type?: HTMLInputTypeAttribute;
  maxLength?: number;
  pattern?: string;
  inputMode?: "numeric" | "tel" | "text";
};

type CreateCustomerResponse = {
  success: boolean;
  error?: {
    code?: string;
    message?: string;
  };
};

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

function FormField({
  id,
  label,
  placeholder,
  type = "text",
  maxLength,
  pattern,
  inputMode,
}: FormFieldProps) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
      >
        {label}
      </label>

      <input
        id={id}
        name={id}
        type={type}
        placeholder={placeholder}
        required
        maxLength={maxLength}
        pattern={pattern}
        inputMode={inputMode}
        className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-500 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
      />
    </div>
  );
}

export default function CustomerInformationForm({
  insuranceType,
}: CustomerInformationFormProps) {
  const t = useTranslations("policyFlow.customerInformation");
  const router = useRouter();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const pageTitle =
    insuranceType === "traffic"
      ? t("trafficTitle")
      : t("comprehensiveTitle");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setIsSubmitting(true);
    setErrorMessage("");

    const formData = new FormData(event.currentTarget);

    const customerData = {
      firstName: String(formData.get("firstName") ?? "").trim(),
      lastName: String(formData.get("lastName") ?? "").trim(),
      nationalId: String(formData.get("nationalId") ?? "").trim(),
      birthDate: String(formData.get("birthDate") ?? ""),
      email: String(formData.get("email") ?? "").trim(),
      phone: String(formData.get("phone") ?? "").trim(),
    };

    try {
      const response = await fetch(`${API_BASE_URL}/api/customers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(customerData),
      });

      const result = (await response.json()) as CreateCustomerResponse;

      if (!response.ok || !result.success) {
        throw new Error(
          result.error?.message || t("requestFailed"),
        );
      }

      // Customer created successfully.
      // Continue to the vehicle information step.
      router.push(
        `/insurance-products/vehicle-insurance/${insuranceType}/vehicle-information`,
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : t("requestFailed"),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <Link
        href="/insurance-products/vehicle-insurance"
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

        {t("backToVehicleInsurance")}
      </Link>

      <div>
        <h1 className="text-2xl font-semibold text-gray-800 dark:text-white/90">
          {pageTitle}
        </h1>

        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {t("description")}
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-theme-sm dark:border-gray-800 dark:bg-white/[0.03] sm:p-6"
      >
        <div>
          <h2 className="text-base font-semibold text-gray-800 dark:text-white/90">
            {t("sectionTitle")}
          </h2>

          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {t("sectionDescription")}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <FormField
            id="firstName"
            label={t("fields.firstName")}
            placeholder={t("placeholders.firstName")}
          />

          <FormField
            id="lastName"
            label={t("fields.lastName")}
            placeholder={t("placeholders.lastName")}
          />

          <FormField
            id="nationalId"
            label={t("fields.nationalId")}
            placeholder={t("placeholders.nationalId")}
            maxLength={11}
            pattern="[0-9]{11}"
            inputMode="numeric"
          />

          <FormField
            id="birthDate"
            label={t("fields.birthDate")}
            placeholder=""
            type="date"
          />

          <FormField
            id="email"
            label={t("fields.email")}
            placeholder={t("placeholders.email")}
            type="email"
          />

          <FormField
            id="phone"
            label={t("fields.phone")}
            placeholder={t("placeholders.phone")}
            type="tel"
            inputMode="tel"
          />
        </div>

        <div className="border-t border-gray-200 pt-5 dark:border-gray-800">
          <h2 className="text-base font-semibold text-gray-800 dark:text-white/90">
            {t("permissionsTitle")}
          </h2>

          <div className="mt-4 space-y-4">
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                name="kvkkAcknowledgement"
                required
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
              />

              <span className="text-sm leading-6 text-gray-600 dark:text-gray-300">
                {t("permissions.kvkk")}
              </span>
            </label>

            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                name="commercialConsent"
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
              />

              <span className="text-sm leading-6 text-gray-600 dark:text-gray-300">
                {t("permissions.commercial")}
              </span>
            </label>
          </div>
        </div>

        {errorMessage && (
          <div
            role="alert"
            className="rounded-lg bg-error-50 px-4 py-3 text-sm text-error-600 dark:bg-error-500/10 dark:text-error-400"
          >
            {errorMessage}
          </div>
        )}

        <div className="flex justify-end border-t border-gray-200 pt-5 dark:border-gray-800">
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex h-11 items-center justify-center rounded-lg bg-brand-500 px-6 text-sm font-medium text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? t("submitting") : t("continue")}
          </button>
        </div>
      </form>
    </div>
  );
}
