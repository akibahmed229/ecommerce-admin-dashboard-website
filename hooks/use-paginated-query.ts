import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { apiFetchPaginated } from "@/lib/api-client";

export function usePaginatedQuery<T>(key: string, path: string, params: Record<string, string | number | boolean | undefined>) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== "") query.set(k, String(v)); });
    return useQuery({
        queryKey: [key, params],
        queryFn: () => apiFetchPaginated < T > (`${path}?${query.toString()}`),
        placeholderData: keepPreviousData,
    });
}
