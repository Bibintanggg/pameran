export const currencyMap: Record<string, string> = {
  'indonesian_rupiah': "IDR", // INDONESIAN_RUPIAH
  'baht_thailand': "THB", // BAHT_THAILAND
  'as_dollar': "USD", // AS_DOLLAR
};

export const formatCurrency = (amount: number, currencyCode: string) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currencyCode,
    minimumFractionDigits: 0,
  }).format(amount);
};
