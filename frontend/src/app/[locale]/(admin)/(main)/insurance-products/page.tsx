
import Link from "next/link";
import { getTranslations } from "next-intl/server";

type ProductIconName = "vehicle" | "home" | "health";

function ProductIcon({ name }: { name: ProductIconName }) {
  const commonProps = {
    className: "h-9 w-9",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.7,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    viewBox: "0 0 24 24",
    "aria-hidden": true as const,
  };

  switch (name) {
    case "vehicle":
      return (
        <svg {...commonProps}>
          <path d="m5 11 1.5-4.5A2.2 2.2 0 0 1 8.6 5h6.8a2.2 2.2 0 0 1 2.1 1.5L19 11" />
          <path d="M3 11h18v7H3z" />
          <path d="M3 14H2m20 0h-1M7 18v2m10-2v2" />
          <circle cx="7" cy="14.5" r="1" />
          <circle cx="17" cy="14.5" r="1" />
        </svg>
      );

    case "home":
      return (
        <svg {...commonProps}>
          <path d="m3 10 9-7 9 7" />
          <path d="M5 9v12h14V9" />
          <path d="M9 21v-7h6v7" />
        </svg>
      );

    case "health":
      return (
        <svg {...commonProps}>
          <path d="M20.8 8.7c0 5.5-8.8 11-8.8 11s-8.8-5.5-8.8-11A4.7 4.7 0 0 1 12 6.2a4.7 4.7 0 0 1 8.8 2.5Z" />
          <path d="M7 12h3l2-3 2 6 2-3h2" />
        </svg>
      );
  }
}

export default async function InsuranceProductsPage() {
  const t = await getTranslations("policyFlow.insuranceProducts");

  const products = [
    {
      key: "vehicle" as const,
      icon: "vehicle" as const,
      href: "/insurance-products/vehicle-insurance",
      available: true,
    },
    {
      key: "home" as const,
      icon: "home" as const,
      available: false,
    },
    {
      key: "health" as const,
      icon: "health" as const,
      available: false,
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

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        {products.map((product) => {
          const content = (
            <>
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
                <ProductIcon name={product.icon} />
              </div>

              <div className="mt-5">
                <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                  {t(`${product.key}.title`)}
                </h2>

                <p className="mt-2 min-h-12 text-sm leading-6 text-gray-500 dark:text-gray-400">
                  {t(`${product.key}.description`)}
                </p>
              </div>

              <div className="mt-6 flex items-center justify-between">
                <span
                  className={`text-sm font-medium ${
                    product.available
                      ? "text-brand-600 dark:text-brand-400"
                      : "text-gray-400 dark:text-gray-500"
                  }`}
                >
                  {product.available ? t("getQuote") : t("comingSoon")}
                </span>

                {product.available && (
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
                )}
              </div>
            </>
          );

          return product.available ? (
            <Link
              key={product.key}
              href={product.href!}
              className="group flex min-h-64 flex-col rounded-2xl border border-gray-200 bg-white p-6 shadow-theme-sm transition hover:-translate-y-1 hover:border-brand-500 hover:shadow-theme-md dark:border-gray-800 dark:bg-white/[0.03]"
            >
              {content}
            </Link>
          ) : (
            <div
              key={product.key}
              aria-disabled="true"
              className="flex min-h-64 cursor-not-allowed flex-col rounded-2xl border border-gray-200 bg-gray-50 p-6 opacity-70 dark:border-gray-800 dark:bg-white/[0.02]"
            >
              {content}
            </div>
          );
        })}
      </div>
    </div>
  );
}
