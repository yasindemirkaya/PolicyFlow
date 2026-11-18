
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";

type VehicleInformationFormProps = {
  insuranceType: "traffic" | "comprehensive";
};

export default function VehicleInformationForm({
  insuranceType,
}: VehicleInformationFormProps) {
  const t = useTranslations("policyFlow.vehicleInformation");
  const router = useRouter();

  const [isNewVehicle, setIsNewVehicle] = useState(false);

  const backUrl =
    insuranceType === "traffic"
      ? "/insurance-products/vehicle-insurance/traffic"
      : "/insurance-products/vehicle-insurance/comprehensive";

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);

    const vehicleInformation = {
      isNewVehicle,
      plate: String(formData.get("plate") ?? "").trim(),
      registrationSerial: String(
        formData.get("registrationSerial") ?? "",
      ).trim(),
      registrationNumber: String(
        formData.get("registrationNumber") ?? "",
      ).trim(),
      brand: String(formData.get("brand") ?? "").trim(),
      model: String(formData.get("model") ?? "").trim(),
    };

    sessionStorage.setItem(
      "policyflow.vehicleInformation",
      JSON.stringify(vehicleInformation),
    );

    sessionStorage.setItem("policyflow.insuranceType", insuranceType);

    router.push("/insurance-products/offers");
  }

  return (
    <div className="space-y-6">
      <Link
        href={backUrl}
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

        {t("backToCustomerInformation")}
      </Link>

      <div>
        <h1 className="text-2xl font-semibold text-gray-800 dark:text-white/90">
          {insuranceType === "traffic"
            ? t("trafficTitle")
            : t("comprehensiveTitle")}
        </h1>

        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {t("description")}
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-theme-sm dark:border-gray-800 dark:bg-white/[0.03] sm:p-6"
      >
        {/* New Vehicle Selection */}
        <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={isNewVehicle}
              onChange={(event) => setIsNewVehicle(event.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
            />

            <div>
              <span className="text-sm font-semibold text-gray-800 dark:text-white/90">
                {t("newVehicleLabel")}
              </span>

              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {t("newVehicleDescription")}
              </p>
            </div>
          </label>
        </div>

        {/* Vehicle Information */}
        <div>
          <h2 className="mb-5 text-base font-semibold text-gray-800 dark:text-white/90">
            {t("sectionTitle")}
          </h2>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {/* Plate */}
            <div className="md:col-span-2">
              <label
                htmlFor="plate"
                className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                {t("fields.plate")}
              </label>

              <input
                id="plate"
                name="plate"
                type="text"
                placeholder={t("placeholders.plate")}
                disabled={isNewVehicle}
                required={!isNewVehicle}
                maxLength={10}
                className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-500 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:disabled:bg-gray-800"
              />

              {isNewVehicle && (
                <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                  {t("plateDisabledDescription")}
                </p>
              )}
            </div>

            {/* Registration fields */}
            {!isNewVehicle && (
              <>
                <div>
                  <label
                    htmlFor="registrationSerial"
                    className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    {t("fields.registrationSerial")}
                  </label>

                  <input
                    id="registrationSerial"
                    name="registrationSerial"
                    type="text"
                    placeholder={t("placeholders.registrationSerial")}
                    required
                    maxLength={2}
                    minLength={2}
                    pattern="[A-Za-z]{2}"
                    onChange={(event) => {
                      event.currentTarget.value =
                        event.currentTarget.value.toUpperCase();
                    }}
                    className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm uppercase text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-500 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                  />
                </div>

                <div>
                  <label
                    htmlFor="registrationNumber"
                    className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    {t("fields.registrationNumber")}
                  </label>

                  <input
                    id="registrationNumber"
                    name="registrationNumber"
                    type="text"
                    placeholder={t("placeholders.registrationNumber")}
                    required
                    maxLength={6}
                    minLength={6}
                    pattern="[0-9]{6}"
                    inputMode="numeric"
                    className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-500 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                  />
                </div>
              </>
            )}

            {/* Brand */}
            <div>
              <label
                htmlFor="brand"
                className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                {t("fields.brand")}
              </label>

              <input
                id="brand"
                name="brand"
                type="text"
                placeholder={t("placeholders.brand")}
                required
                className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-500 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
              />
            </div>

            {/* Model */}
            <div>
              <label
                htmlFor="model"
                className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                {t("fields.model")}
              </label>

              <input
                id="model"
                name="model"
                type="text"
                placeholder={t("placeholders.model")}
                required
                className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-500 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
              />
            </div>
          </div>
        </div>

        {/* Continue */}
        <div className="flex justify-end border-t border-gray-200 pt-5 dark:border-gray-800">
          <button
            type="submit"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-brand-500 px-6 text-sm font-medium text-white transition hover:bg-brand-600"
          >
            {t("continue")}

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
              <path d="M5 12h14m-6-6 6 6-6 6" />
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
}
