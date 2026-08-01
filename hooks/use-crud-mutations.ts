import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch, ApiError } from "@/lib/api-client";
import { toast } from "sonner";

export function useCrudMutations(key: string, basePath: string) {
    const qc = useQueryClient();
    const invalidate = () => qc.invalidateQueries({ queryKey: [key] });
    const onError = (err: unknown) => toast.error(err instanceof ApiError ? err.message : "Something went wrong");

    const create = useMutation({ mutationFn: (body: unknown) => apiFetch(basePath, { method: "POST", body: JSON.stringify(body) }), onSuccess: () => { invalidate(); toast.success("Created"); }, onError });
    const update = useMutation({ mutationFn: ({ id, body }: { id: string; body: unknown }) => apiFetch(`${basePath}/${id}`, { method: "PATCH", body: JSON.stringify(body) }), onSuccess: () => { invalidate(); toast.success("Saved"); }, onError });
    const remove = useMutation({ mutationFn: (id: string) => apiFetch(`${basePath}/${id}`, { method: "DELETE" }), onSuccess: () => { invalidate(); toast.success("Deleted"); }, onError });

    return { create, update, remove };
}
