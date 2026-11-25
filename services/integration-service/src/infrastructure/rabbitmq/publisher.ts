import { randomUUID } from "node:crypto";

import type { Options } from "amqplib";

import { getPublisherChannel } from "./connection.js";

/**
 * Mesajı RabbitMQ'ya yayınlar ve broker onayını bekler.
 */
export const publishConfirmedMessage = async (
  exchange: string,
  routingKey: string,
  content: Buffer,
  options: Options.Publish = {},
): Promise<void> => {
  // Aktif Publisher Confirm Channel'ı al.
  const activePublisherChannel = getPublisherChannel();

  // Her yayınlama için benzersiz kimlik oluştur.
  const publishId = randomUUID();

  let isReturned = false;
  let isSettled = false;

  // Promise'in reject fonksiyonunu sakla.
  let rejectPublish: (error: Error) => void = () => undefined;

  // Yayınlama sırasında kullanılan listener'ları temizle.
  const cleanup = (): void => {
    activePublisherChannel.removeListener(
      "return",
      onReturn,
    );

    activePublisherChannel.removeListener(
      "close",
      onClose,
    );
  };

  /**
   * Mesaj hiçbir Queue'ya yönlendirilemezse çalışır.
   *
   * Her yayınlama işlemi kendi publishId değeriyle takip edilir.
   */
  const onReturn = (returnedMessage: {
    properties: {
      headers?: Record<string, unknown>;
    };
  }): void => {
    if (
      returnedMessage.properties.headers?.[
        "x-publish-confirm-id"
      ] === publishId
    ) {
      isReturned = true;
    }
  };

  /**
   * Onay gelmeden Publisher Channel kapanırsa
   * yayınlama işlemini başarısız say.
   */
  const onClose = (): void => {
    if (isSettled) {
      return;
    }

    isSettled = true;
    cleanup();

    rejectPublish(
      new Error(
        "RabbitMQ Publisher Channel closed before confirmation.",
      ),
    );
  };

  // Yayınlama işlemini Promise olarak yönet.
  const publishPromise = new Promise<void>(
    (resolve, reject) => {
      rejectPublish = reject;

      // RabbitMQ'dan dönen mesajları takip et.
      activePublisherChannel.on("return", onReturn);

      // Channel kapanmasını takip et.
      activePublisherChannel.once("close", onClose);

      try {
        // Mesajı RabbitMQ'ya yayınla.
        activePublisherChannel.publish(
          exchange,
          routingKey,
          content,
          {
            ...options,

            // Mesajın kalıcı tutulmasını iste.
            persistent: true,

            // Yönlendirilemeyen mesajı geri döndür.
            mandatory: true,

            // Yayınlamayı benzersiz kimlikle takip et.
            headers: {
              ...options.headers,
              "x-publish-confirm-id": publishId,
            },
          },
          (error) => {
            if (isSettled) {
              return;
            }

            isSettled = true;
            cleanup();

            // RabbitMQ mesajı reddettiyse hata döndür.
            if (error) {
              reject(error);
              return;
            }

            // Mesaj hiçbir Queue'ya yönlendirilemediyse hata döndür.
            if (isReturned) {
              reject(
                new Error(
                  `RabbitMQ could not route message. Exchange: ${exchange}, Routing key: ${routingKey}`,
                ),
              );

              return;
            }

            // Broker onayladı ve mesaj yönlendirilebildi.
            resolve();
          },
        );
      } catch (error) {
        if (isSettled) {
          return;
        }

        isSettled = true;
        cleanup();

        reject(
          error instanceof Error
            ? error
            : new Error(String(error)),
        );
      }
    },
  );

  // Yayınlama işleminin sonucunu çağıran koda döndür.
  return publishPromise;
};