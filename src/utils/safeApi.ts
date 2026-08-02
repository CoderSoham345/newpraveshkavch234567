/**
 * Safe API Client Utility
 * Prevents "Unexpected end of JSON input" and HTML fallback parsing errors across the application.
 */

export interface ApiResponse<T = any> {
  ok: boolean;
  status: number;
  data: T;
  message: string;
}

/**
 * Safely parses the body of an HTTP Response as JSON.
 * Handles empty responses, HTML error pages, and malformed JSON gracefully.
 */
export async function parseResponseJson<T = any>(response: Response): Promise<ApiResponse<T>> {
  const status = response.status;
  let text = '';

  try {
    text = await response.text();
  } catch (err: any) {
    console.error('[safeApi] Failed to read response text:', err);
    return {
      ok: false,
      status,
      data: { success: false, message: 'Failed to read response body' } as unknown as T,
      message: 'Failed to read response body',
    };
  }

  // Handle empty response body
  if (!text || text.trim().length === 0) {
    return {
      ok: false,
      status,
      data: { success: false, message: 'Server returned empty response' } as unknown as T,
      message: 'Server returned empty response',
    };
  }

  // Try parsing JSON
  try {
    const data = JSON.parse(text);
    const isSuccess = response.ok && (data?.success !== false);
    return {
      ok: isSuccess,
      status,
      data,
      message: data?.message || data?.error || (isSuccess ? 'Success' : 'Request failed'),
    };
  } catch (parseError) {
    console.error('[safeApi] JSON parse error. Raw text sample:', text.substring(0, 150));
    
    const isHtml = text.trim().toLowerCase().startsWith('<!doctype') || text.includes('<html');
    const errorMessage = isHtml
      ? 'Server returned HTML (404/500 page) instead of JSON. Check API route configuration.'
      : 'Server returned invalid JSON response.';

    return {
      ok: false,
      status,
      data: { success: false, message: errorMessage, rawText: text } as unknown as T,
      message: errorMessage,
    };
  }
}

/**
 * Wrapper around global fetch that guarantees structured, crash-proof JSON responses.
 */
export async function safeFetch<T = any>(
  url: string,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(url, options);
    return await parseResponseJson<T>(response);
  } catch (networkError: any) {
    console.error('[safeFetch] Network or fetch error for', url, ':', networkError);
    return {
      ok: false,
      status: 0,
      data: {
        success: false,
        message: networkError?.message || 'Network error or server unreachable',
      } as unknown as T,
      message: networkError?.message || 'Network error or server unreachable',
    };
  }
}
