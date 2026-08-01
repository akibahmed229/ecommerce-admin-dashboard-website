export function uploadFiles(accessToken: string, files: File[], onProgress: (pct: number) => void): Promise<void> {
    return new Promise((resolve, reject) => {
        const formData = new FormData();
        files.forEach((f) => formData.append("files", f));
        const xhr = new XMLHttpRequest();
        xhr.open("POST", `${process.env.NEXT_PUBLIC_API_URL}/media`);
        xhr.setRequestHeader("authorization", `Bearer ${accessToken}`);
        xhr.upload.onprogress = (e) => { if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100)); };
        xhr.onload = () => (xhr.status >= 200 && xhr.status < 300) ? resolve() : reject(new Error(JSON.parse(xhr.responseText || "{}")?.error?.message ?? "Upload failed"));
        xhr.onerror = () => reject(new Error("Upload failed"));
        xhr.send(formData);
    });
}
