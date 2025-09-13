export const currencyMap: Record<number, string> = {
  1: "IDR", // INDONESIAN_RUPIAH
  2: "THB", // BAHT_THAILAND
  3: "USD", // AS_DOLLAR
};

export const formatCurrency = (amount: number, currencyCode: string) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currencyCode,
    minimumFractionDigits: 0,
  }).format(amount);
};
