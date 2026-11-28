
import { kafka } from "./kafka.client.js";
import { saveIssuedPolicyAnalytics } from "../services/issue-analytics.service.js";

const TOPIC = "policy.issued";

export const analyticsConsumer = kafka.consumer({
    groupId: "analytics-service-group",
});

export const connectKafkaConsumer = async (): Promise<void> => {
    await analyticsConsumer.connect();

    console.log("[Kafka] Analytics Consumer connected.");

    await analyticsConsumer.subscribe({
        topic: TOPIC,
        fromBeginning: false,
    });

    console.log(`[Kafka] Subscribed to topic: ${TOPIC}`);

    await analyticsConsumer.run({
        autoCommit: false,

        eachMessage: async ({ topic, partition, message }) => {
            try {
                if (!message.value) {
                    throw new Error("Kafka message value is empty.");
                }

                const eventIdHeader = message.headers?.eventId;

                const eventId = Array.isArray(eventIdHeader)
                    ? eventIdHeader[0]?.toString()
                    : eventIdHeader?.toString();

                if (!eventId) {
                    throw new Error("Kafka message eventId header is missing.");
                }

                const event = JSON.parse(message.value.toString());

                if (event.event !== "policy.issued") {
                    console.log(`[Kafka] Ignored event: ${event.event}`);
                } else {
                    await saveIssuedPolicyAnalytics(eventId, event);

                    console.log(
                        `[Analytics] Policy analytics saved: ${event.data.policyNumber}`,
                    );
                }

                // Veritabanı işlemi başarılı olduktan sonra offset commit edilir.
                await analyticsConsumer.commitOffsets([
                    {
                        topic,
                        partition,
                        offset: (BigInt(message.offset) + 1n).toString(),
                    },
                ]);
            } catch (error) {
                // Hata durumunda offset commit edilmez.
                console.error("[Kafka] Message processing failed:", error);
                throw error;
            }
        },
    });
};

export const disconnectKafkaConsumer = async (): Promise<void> => {
    await analyticsConsumer.disconnect();

    console.log("[Kafka] Analytics Consumer disconnected.");
};
