const API_BASE = "/api";

async function parseJson(response) {
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return response.json();
  }
  return null;
}

export async function apiFetch(path, options = {}, auth = null, allowRefresh = true) {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (auth?.accessToken) {
    headers.Authorization = `Bearer ${auth.accessToken}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (response.status === 401 && allowRefresh && auth?.refreshToken) {
    const refreshResponse = await fetch(`${API_BASE}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: auth.refreshToken }),
    });

    if (refreshResponse.ok) {
      const refreshData = await refreshResponse.json();
      auth.setTokens(refreshData.accessToken, refreshData.refreshToken);
      return apiFetch(path, options, { ...auth, accessToken: refreshData.accessToken }, false);
    }

    auth.logout();
    throw new Error("Session expired. Please login again.");
  }

  const data = await parseJson(response);

  if (!response.ok) {
    const message = data?.message || `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return data;
}
