import { saveAs } from "file-saver";
import localforage from "localforage";

import i18n from "@/i18n";
import { createZip, readZip } from "@/lib/zip";
import { setImageBlob } from "@/services/image-storage";
import { setMediaBlob } from "@/services/file-storage";
import { useCanvasStore, type CanvasProject } from "@/stores/canvas/use-canvas-store";
import { useAssetStore, type Asset } from "@/stores/use-asset-store";
import { useConfigStore, type AiConfig } from "@/stores/use-config-store";

const imageStore = localforage.createInstance({ name: "infinite-canvas", storeName: "image_files" });
const mediaStore = localforage.createInstance({ name: "infinite-canvas", storeName: "media_files" });

type BackupItem = { storageKey: string; path: string; mimeType: string };

type AppBackupFile = {
    app: "infinite-canvas";
    version: 1;
    exportedAt: string;
    projects: CanvasProject[];
    assets: Asset[];
    config: AiConfig;
    files: BackupItem[];
};

// Export every canvas project, asset, media file, and configuration as a single zip that can be restored later.
export async function exportAppBackup() {
    const { projects } = useCanvasStore.getState();
    const { assets } = useAssetStore.getState();
    const { config } = useConfigStore.getState();
    const files: BackupItem[] = [];
    const zipFiles: { name: string; data: BlobPart }[] = [];
    await Promise.all([collectStoreFiles(imageStore, files, zipFiles), collectStoreFiles(mediaStore, files, zipFiles)]);
    const data: AppBackupFile = { app: "infinite-canvas", version: 1, exportedAt: new Date().toISOString(), projects, assets, config, files };
    zipFiles.push({ name: "backup.json", data: new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }) });
    const zip = await createZip(zipFiles);
    const stamp = new Date().toISOString().slice(0, 10);
    saveAs(zip, `infinite-canvas-backup-${stamp}.zip`);
}

// Restore projects, assets, media files, and configuration from a backup zip, replacing current data.
export async function importAppBackup(file: File) {
    const zip = await readZip(file);
    const manifest = zip.get("backup.json");
    if (!manifest) throw new Error(i18n.t("backup.invalidFile"));
    let data: AppBackupFile;
    try {
        data = JSON.parse(await manifest.text()) as AppBackupFile;
    } catch {
        throw new Error(i18n.t("backup.invalidFile"));
    }
    if (data.app !== "infinite-canvas" || data.version !== 1 || !Array.isArray(data.projects) || !Array.isArray(data.assets) || !data.config) throw new Error(i18n.t("backup.invalidFile"));
    await Promise.all(
        data.files.map(async (item) => {
            const blob = zip.get(item.path);
            if (!blob) return;
            const typedBlob = blob.type ? blob : blob.slice(0, blob.size, item.mimeType || "application/octet-stream");
            await (item.storageKey.startsWith("image:") ? setImageBlob(item.storageKey, typedBlob) : setMediaBlob(item.storageKey, typedBlob));
        }),
    );
    useConfigStore.setState({ config: data.config });
    useCanvasStore.getState().replaceProjects(data.projects);
    useAssetStore.getState().replaceAssets(data.assets);
}

async function collectStoreFiles(store: LocalForage, files: BackupItem[], zipFiles: { name: string; data: BlobPart }[]) {
    await store.iterate((value, key) => {
        if (!(value instanceof Blob)) return;
        const extension = fileExtension(value.type);
        const path = `files/${safeFileName(key)}.${extension}`;
        files.push({ storageKey: key, path, mimeType: value.type || "application/octet-stream" });
        zipFiles.push({ name: path, data: value });
    });
}

function safeFileName(value: string) {
    return value.replace(/[\\/:*?"<>|]/g, "_");
}

function fileExtension(mimeType: string) {
    if (mimeType.includes("png")) return "png";
    if (mimeType.includes("jpeg")) return "jpg";
    if (mimeType.includes("webp")) return "webp";
    if (mimeType.includes("gif")) return "gif";
    if (mimeType.includes("mp4")) return "mp4";
    if (mimeType.includes("webm")) return "webm";
    if (mimeType.includes("mp3")) return "mp3";
    if (mimeType.includes("wav")) return "wav";
    return "bin";
}
