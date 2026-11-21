import { ServiceClientError } from "./service-client.error.js";

interface ServiceApiResponse<T> {
  success: boolean;
  data: T;
  error?: {
    code: string;
    message: string;
  };
}

interface ServiceRequestOptions {
  method?: string;
  body?: string;
  headers?: Record<string, string>;
}

export async function requestService<T>(
  serviceName: string,
  url: string,
  options: ServiceRequestOptions = {},
): Promise<T> {
  let response: Response;

  try {
    response = await fetch(url, {
      method: options.method ?? "GET",
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      body: options.body,
    });
  } catch {
    throw new ServiceClientError(
      503,
      "DEPENDENCY_SERVICE_UNAVAILABLE",
      `${serviceName} service is unavailable`,
      serviceName,
    );
  }

  const result = await response.json().catch(() => null) as
    | ServiceApiResponse<T>
    | null;

  if (!response.ok || !result?.success) {
    throw new ServiceClientError(
      response.ok ? 502 : response.status,
      result?.error?.code ?? "DEPENDENCY_REQUEST_FAILED",
      result?.error?.message ?? `${serviceName} service request failed`,
      serviceName,
    );
  }

  return result.data;
}