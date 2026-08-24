import { create } from "zustand";
import { persist, type PersistStorage, type StorageValue } from "zustand/middleware";

import { nanoid } from "nanoid";
import { localForageStorage } from "@/lib/localforage-storage";

export type GenerationHistoryImage = { storageKey: string; mimeType: string; width: number; height: number; bytes: number };

export type GenerationHistoryRecord = {
    id: string;
    createdAt: number;
    prompt: string;
    model: string;
    images: GenerationHistoryImage[];
    successCount: number;
    failCount: number;
};

type GenerationHistoryStore = {
    records: GenerationHistoryRecord[];
    addRecord: (record: Omit<GenerationHistoryRecord, "id" | "createdAt">) => void;
    removeRecord: (id: string) => void;
    clearRecords: () => void;
};

const HISTORY_STORE_KEY = "infinite-canvas:generation_history";
const HISTORY_LIMIT = 200;

const historyStorage: PersistStorage<Pick<GenerationHistoryStore, "records">> = {
    getItem: async (name) => {
        const value = await localForageStorage.getItem(name);
        return value ? (JSON.parse(value) as StorageValue<Pick<GenerationHistoryStore, "records">>) : null;
    },
    setItem: (name, value) => localForageStorage.setItem(name, JSON.stringify(value)),
    removeItem: (name) => localForageStorage.removeItem(name),
};

export const useGenerationHistoryStore = create<GenerationHistoryStore>()(
    persist(
        (set) => ({
            records: [],
            addRecord: (record) =>
                set((state) => ({ records: [{ ...record, id: nanoid(), createdAt: Date.now() }, ...state.records].slice(0, HISTORY_LIMIT) })),
            removeRecord: (id) => set((state) => ({ records: state.records.filter((record) => record.id !== id) })),
            clearRecords: () => set({ records: [] }),
        }),
        { name: HISTORY_STORE_KEY, storage: historyStorage, partialize: (state) => ({ records: state.records }) },
    ),
);
