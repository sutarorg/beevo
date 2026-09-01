import axios, { AxiosError } from "axios";

/**
 * Central Axios instance for every Beevo API call.
 * Base URL is driven by NEXT_PUBLIC_API_URL; when it is empty the
 * instance falls back to relative URLs (same-origin Next API routes).
 */
export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "/",
  timeout: 20000,
  headers: { "Content-Type": "application/json" },
  // Session cookies must travel even when the API is on another origin.
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    config.headers["x-beevo-client"] = "beevo-web";
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error: AxiosError<{ error?: string; message?: string }>) => {
    const message =
      error.response?.data?.error ||
      error.response?.data?.message ||
      error.message ||
      "Something went wrong";
    return Promise.reject(new Error(message));
  }
);

export function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return "Unexpected error — please try again";
}
