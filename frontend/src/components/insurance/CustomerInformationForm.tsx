"use client";

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
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    // Customer API integration will be added in the next step.
    setSubmitted(true);
  }

  const pageTitle =
    insuranceType === "traffic"
      ? t("trafficTitle")
      : t("comprehensiveTitle");

  return (
    <div className="space-y-6">
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

        {submitted && (
          <div
            role="status"
            className="rounded-lg bg-success-50 px-4 py-3 text-sm text-success-700 dark:bg-success-500/10 dark:text-success-400"
          >
            {t("validationSuccess")}
          </div>
        )}

        <div className="flex justify-end border-t border-gray-200 pt-5 dark:border-gray-800">
          <button
            type="submit"
            className="inline-flex h-11 items-center justify-center rounded-lg bg-brand-500 px-6 text-sm font-medium text-white transition hover:bg-brand-600"
          >
            {t("continue")}
          </button>
        </div>
      </form>
    </div>
  );
}