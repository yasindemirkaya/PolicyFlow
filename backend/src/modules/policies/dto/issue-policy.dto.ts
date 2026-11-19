export interface IssuePolicyDto {
  customerId: string;

  productId: string;

  payment: {
    cardHolderName: string;
    cardBrand: "VISA" | "MASTERCARD";
    last4: string;
    mockTransactionId: string;
    threeDSecureStatus: "SUCCESS" | "FAILED";
  };
}