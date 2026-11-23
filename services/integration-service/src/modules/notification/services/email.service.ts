// Poliçe tanzim event tipini içe aktarır.
import type { PolicyIssuedEvent } from "../../../types/policy-issued-event.js";

// Genel Email gönderim metodunu simüle eder.
export const sendEmail = async (
  recipient: string,
  subject: string,
  body: string,
): Promise<void> => {
  console.log("[DUMMY EMAIL] Sending Email...");

  // E-posta alıcısını, başlığını ve içeriğini loglar.
  console.log("Recipient:", recipient);
  console.log("Subject:", subject);
  console.log("Body:", body);

  console.log("[DUMMY EMAIL] Email operation completed");
};

// Poliçe tanzimi başarılı olduğunda gönderilecek Email'i hazırlar.
export const sendPolicyIssuedEmail = async (
  event: PolicyIssuedEvent,
): Promise<void> => {
  // Email alıcısını event içerisindeki e-posta adresinden alır.
  const recipient = String(
    event.data.email ?? "test@example.com",
  );

  // Poliçe numarasını event içerisinden alır.
  const policyNumber = String(
    event.data.policyNumber ?? "UNKNOWN",
  );

  // Poliçe tanzim Email'ini genel gönderim metoduna iletir.
  await sendEmail(
    recipient,
    "Poliçeniz Başarıyla Oluşturuldu",
    `Poliçeniz oluşturulmuştur. Poliçe No: ${policyNumber}`,
  );
};