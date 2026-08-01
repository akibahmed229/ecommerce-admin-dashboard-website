const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3500/api/v1";

let accessToken: string | null = null;
let refreshPromise: Promise<string | null> | null = null;

export function setAccessToken(token: string | null) { accessToken = token; }
export function getAccessToken() { return accessToken; }

export function getRefreshToken() {
    return typeof window === "undefined" ? null : localStorage.getItem("refreshToken");
}
export function setRefreshToken(token: string | null) {
    if (typeof window === "undefined") return;
    token ? localStorage.setItem("refreshToken", token) : localStorage.removeItem("refreshToken");
}

export class ApiError extends Error {
    constructor(public status: number, public code: string, message: string, public details?: unknown) { super(message); }
}

async function doRefresh(): Promise<string | null> {
    const refreshToken = getRefreshToken();
    if (!refreshToken) return null;
    const res = await fetch(`${API_URL}/auth/refresh`, {
        method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) { setRefreshToken(null); return null; }
    const { data } = await res.json();
    accessToken = data.accessToken;
    setRefreshToken(data.refreshToken);
    return accessToken;
}

// Every 401 that lands while a refresh is already in flight awaits the SAME promise
// instead of firing its own /auth/refresh — this is the "guard against parallel refreshes" requirement.
function refreshOnce(): Promise<string | null> {
    if (!refreshPromise) refreshPromise = doRefresh().finally(() => { refreshPromise = null; });
    return refreshPromise;
}

interface RequestOptions extends RequestInit { auth?: boolean }

async function request(path: string, options: RequestOptions = {}): Promise<any> {
    const { auth = true, headers, ...rest } = options;
    const doFetch = async () => {
        const h = new Headers(headers);
        if (!(rest.body instanceof FormData)) h.set("content-type", "application/json");
        if (auth && accessToken) h.set("authorization", `Bearer ${accessToken}`);
        return fetch(`${API_URL}${path}`, { ...rest, headers: h });
    };

    let res = await doFetch();

    if (res.status === 401 && auth) {
        const newToken = await refreshOnce();
        if (!newToken) {
            setAccessToken(null);
            setRefreshToken(null);
            if (typeof window !== "undefined") window.location.href = "/login";
            throw new ApiError(401, "UNAUTHENTICATED", "Session expired");
        }
        res = await doFetch(); // retry exactly once, never loop
    }

    if (res.status === 204) return { data: undefined, meta: undefined };
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new ApiError(res.status, body?.error?.code ?? "UNKNOWN", body?.error?.message ?? "Request failed", body?.error?.details);
    return body;
}

export async function apiFetch<T = unknown>(path: string, options?: RequestOptions): Promise<T> {
    return (await request(path, options)).data as T;
}
export async function apiFetchPaginated<T>(path: string, options?: RequestOptions): Promise<{ data: T[]; meta: any }> {
    const body = await request(path, options);
    return { data: body.data ?? [], meta: body.meta };
}
