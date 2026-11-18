
import { getTranslations } from "next-intl/server";
import Link from "next/link";

type InsuranceIconProps = {
  type: "traffic" | "kasko";
};

function InsuranceIcon({ type }: InsuranceIconProps) {
  if (type === "traffic") {
    return (
      <svg
        className="h-9 w-9"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M3 11h18v7H3z" />
        <path d="m5 11 1.5-4.5A2.2 2.2 0 0 1 8.6 5h6.8a2.2 2.2 0 0 1 2.1 1.5L19 11" />
        <path d="M3 14H2m20 0h-1M7 18v2m10-2v2" />
        <circle cx="7" cy="14.5" r="1" />
        <circle cx="17" cy="14.5" r="1" />
      </svg>
    );
  }

  return (
    <svg
      className="h-9 w-9"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

export default async function VehicleInsurancePage() {
  const t = await getTranslations("policyFlow.vehicleInsurance");

    const products = [
    {
        key: "traffic" as const,
        icon: "traffic" as const,
        href: "/insurance-products/vehicle-insurance/traffic",
    },
    {
        key: "kasko" as const,
        icon: "kasko" as const,
        href: "/insurance-products/vehicle-insurance/comprehensive",
    },
    ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-800 dark:text-white/90">
          {t("title")}
        </h1>

        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {t("description")}
        </p>
      </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {products.map((product) => (
            <Link
            key={product.key}
            href={product.href}
            className="group flex min-h-64 flex-col rounded-2xl border border-gray-200 bg-white p-6 shadow-theme-sm transition hover:-translate-y-1 hover:border-brand-500 hover:shadow-theme-md dark:border-gray-800 dark:bg-white/[0.03]"
            >
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
                <InsuranceIcon type={product.icon} />
            </div>

            <div className="mt-5">
                <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                {t(`${product.key}.title`)}
                </h2>

                <p className="mt-2 text-sm leading-6 text-gray-500 dark:text-gray-400">
                {t(`${product.key}.description`)}
                </p>
            </div>

            <div className="mt-auto flex items-center justify-between pt-6">
                <span className="text-sm font-medium text-brand-600 dark:text-brand-400">
                {t("select")}
                </span>

                <svg
                className="h-5 w-5 text-brand-600 transition-transform group-hover:translate-x-1 dark:text-brand-400"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
                >
                <path d="M5 12h14m-6-6 6 6-6 6" />
                </svg>
            </div>
            </Link>
        ))}
        </div>
    </div>
  );
}
