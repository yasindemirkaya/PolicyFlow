// Poliçe tanzim event tipini içe aktarır.
import type { PolicyIssuedEvent } from "../../../types/policy-issued-event.js";

// Genel SMS gönderim metodunu simüle eder.
export const sendSms = async (
  recipient: string,
  message: string,
): Promise<void> => {
  console.log("[DUMMY SMS] Sending SMS...");

  // SMS alıcısını ve gönderilecek mesajı loglar.
  console.log("Recipient:", recipient);
  console.log("Message:", message);

  console.log("[DUMMY SMS] SMS operation completed");
};

// Poliçe tanzimi başarılı olduğunda gönderilecek SMS'i hazırlar.
export const sendPolicyIssuedSms = async (
  event: PolicyIssuedEvent,
): Promise<void> => {
  // SMS alıcısını event içerisindeki telefon numarasından alır.
  const recipient = String(
    event.data.phoneNumber ?? "TEST_PHONE",
  );

  // Poliçe numarasını event içerisinden alır.
  const policyNumber = String(
    event.data.policyNumber ?? "UNKNOWN",
  );

  // Poliçe tanzim SMS'ini genel gönderim metoduna iletir.
  await sendSms(
    recipient,
    `Poliçeniz başarıyla oluşturulmuştur. Poliçe No: ${policyNumber}`,
  );
};