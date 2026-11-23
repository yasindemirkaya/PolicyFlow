// Poliçe tanzim event tipini içe aktarır.
import type { PolicyIssuedEvent } from "../../../types/policy-issued-event.js";

// Genel CRM güncelleme işlemini simüle eder.
export const updateCrm = async (
  data: Record<string, unknown>,
): Promise<void> => {
  console.log("[DUMMY CRM] Updating CRM...");

  // CRM sistemine aktarılacak verileri loglar.
  console.log("Data:", data);

  console.log("[DUMMY CRM] CRM update completed");
};

// Poliçe tanzimi sonrasında CRM güncellemesini gerçekleştirir.
export const updateCrmForPolicyIssued = async (
  event: PolicyIssuedEvent,
): Promise<void> => {
  // Poliçe event verisini genel CRM güncelleme metoduna gönderir.
  await updateCrm(event.data);
};