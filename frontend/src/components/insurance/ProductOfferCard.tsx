
type ProductOffer = {
  id: string;
  productCode: string;
  company: string;
  productName: string;
  productType: string;
  productSubType: string;
  basePrice: string | number;
  currency: string;
};

type ProductOfferCardProps = {
  offer: ProductOffer;
  purchaseLabel: string;
  onPurchase: (productId: string) => void;
};

export default function ProductOfferCard({
  offer,
  purchaseLabel,
  onPurchase,
}: ProductOfferCardProps) {
  const formattedPrice = new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: offer.currency,
    minimumFractionDigits: 2,
  }).format(Number(offer.basePrice));

  return (
    <div className="flex min-h-64 flex-col rounded-2xl border border-gray-200 bg-white p-5 shadow-theme-sm transition hover:border-brand-500 hover:shadow-theme-md dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="flex items-center justify-between">
        <span className="rounded-lg bg-brand-50 px-3 py-2 text-sm font-semibold text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
          {offer.company}
        </span>

        <span className="text-xs text-gray-400">
          {offer.productCode}
        </span>
      </div>

      <div className="mt-6">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          {offer.productName}
        </h3>

        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          {offer.productSubType}
        </p>
      </div>

      <div className="mt-auto flex items-end justify-between gap-3 pt-6">
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Premium
          </p>
          <p className="mt-1 text-xl font-bold text-gray-800 dark:text-white/90">
            {formattedPrice}
          </p>
        </div>

        <button
          type="button"
          onClick={() => onPurchase(offer.id)}
          className="inline-flex h-10 items-center justify-center rounded-lg bg-brand-500 px-4 text-sm font-medium text-white transition hover:bg-brand-600"
        >
          {purchaseLabel}
        </button>
      </div>
    </div>
  );
}
