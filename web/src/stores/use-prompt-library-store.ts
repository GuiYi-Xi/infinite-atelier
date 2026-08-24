import { create } from "zustand";
import { persist, type PersistStorage, type StorageValue } from "zustand/middleware";

import { localForageStorage } from "@/lib/localforage-storage";

type PromptLibraryStore = {
    builtInCovers: Record<string, string>;
    setBuiltInCover: (promptId: string, coverUrl: string) => void;
    removeBuiltInCover: (promptId: string) => void;
};

const PROMPT_LIBRARY_STORE_KEY = "infinite-canvas:prompt_library_store";

const promptLibraryStorage: PersistStorage<PromptLibraryStore> = {
    getItem: async (name) => {
        const value = await localForageStorage.getItem(name);
        return value ? (JSON.parse(value) as StorageValue<PromptLibraryStore>) : null;
    },
    setItem: (name, value) => localForageStorage.setItem(name, JSON.stringify(value)),
    removeItem: (name) => localForageStorage.removeItem(name),
};

export const usePromptLibraryStore = create<PromptLibraryStore>()(
    persist(
        (set) => ({
            builtInCovers: {},
            setBuiltInCover: (promptId, coverUrl) => set((state) => ({ builtInCovers: { ...state.builtInCovers, [promptId]: coverUrl } })),
            removeBuiltInCover: (promptId) =>
                set((state) => {
                    const builtInCovers = { ...state.builtInCovers };
                    delete builtInCovers[promptId];
                    return { builtInCovers };
                }),
        }),
        {
            name: PROMPT_LIBRARY_STORE_KEY,
            storage: promptLibraryStorage,
            partialize: (state) => ({ builtInCovers: state.builtInCovers }) as StorageValue<PromptLibraryStore>["state"],
        },
    ),
);
