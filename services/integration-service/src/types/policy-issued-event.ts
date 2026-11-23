// Poliçe tanzim event'inin taşıyabileceği müşteri ve poliçe bilgilerini tanımlar.
export interface PolicyIssuedData {
  policyId?: string | number;
  customerId?: string | number;
  policyNumber?: string;
  phoneNumber?: string;
  email?: string;
  [key: string]: unknown;
}

// RabbitMQ üzerinden gönderilecek event yapısını tanımlar.
export interface PolicyIssuedEvent {
  event: "policy.issued";
  data: PolicyIssuedData;
}

// Gelen mesajın JSON formatını ve event tipini kontrol eder.
export const parsePolicyIssuedEvent = (
  content: Buffer,
): PolicyIssuedEvent => {
  // Buffer içindeki mesajı JSON formatına dönüştürür.
  const parsed: unknown = JSON.parse(content.toString("utf8"));

  // Gelen verinin geçerli bir nesne olduğunu kontrol eder.
  if (
    typeof parsed !== "object" ||
    parsed === null ||
    Array.isArray(parsed)
  ) {
    throw new Error("Invalid event payload");
  }

  const record = parsed as Record<string, unknown>;

  // Gelen event'in beklenen event olduğunu kontrol eder.
  if (record.event !== "policy.issued") {
    throw new Error("Unsupported event type");
  }

  // Event içerisinde data alanının bulunduğunu kontrol eder.
  if (
    typeof record.data !== "object" ||
    record.data === null ||
    Array.isArray(record.data)
  ) {
    throw new Error("Invalid event data");
  }

  // Doğrulanmış event verisini döndürür.
  return {
    event: "policy.issued",
    data: record.data as PolicyIssuedData,
  };
};