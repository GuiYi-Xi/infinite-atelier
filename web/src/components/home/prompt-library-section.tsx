import { useMemo, useRef, useState } from "react";
import { App, Button, Input, Modal, Select } from "antd";
import { BookmarkPlus, Check, Copy, Edit3, ImagePlus, Plus, RotateCcw, Search, Sparkles, UploadCloud, X } from "lucide-react";
import { useTranslation } from "react-i18next";

import { brandPrompts, getPromptLocale, promptCategories, type PromptCategoryId } from "@/constant/prompt-library";
import { useCopyText } from "@/hooks/use-copy-text";
import { readFileAsDataUrl } from "@/lib/image-utils";
import { cn } from "@/lib/utils";
import { usePromptLibraryStore } from "@/stores/use-prompt-library-store";
import { useAssetStore, type TextAsset } from "@/stores/use-asset-store";

type PromptDraft = {
    title: string;
    summary: string;
    prompt: string;
    category: Exclude<PromptCategoryId, "all">;
    coverUrl: string;
};

type DisplayPrompt = {
    id: string;
    title: string;
    summary: string;
    prompt: string;
    category: Exclude<PromptCategoryId, "all">;
    coverUrl?: string;
    assetId?: string;
    custom?: boolean;
};

const emptyDraft: PromptDraft = { title: "", summary: "", prompt: "", category: "product", coverUrl: "" };

export function PromptLibrarySection() {
    const { i18n, t } = useTranslation();
    const { message } = App.useApp();
    const copyText = useCopyText();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const builtInCoverInputRef = useRef<HTMLInputElement>(null);
    const assets = useAssetStore((state) => state.assets);
    const addAsset = useAssetStore((state) => state.addAsset);
    const updateAsset = useAssetStore((state) => state.updateAsset);
    const builtInCovers = usePromptLibraryStore((state) => state.builtInCovers);
    const setBuiltInCover = usePromptLibraryStore((state) => state.setBuiltInCover);
    const removeBuiltInCover = usePromptLibraryStore((state) => state.removeBuiltInCover);
    const [category, setCategory] = useState<PromptCategoryId>("all");
    const [query, setQuery] = useState("");
    const [editorOpen, setEditorOpen] = useState(false);
    const [editingAssetId, setEditingAssetId] = useState<string | null>(null);
    const [coverPromptId, setCoverPromptId] = useState<string | null>(null);
    const [draft, setDraft] = useState<PromptDraft>(emptyDraft);
    const locale = getPromptLocale(i18n.resolvedLanguage);

    const customPromptAssets = useMemo(() => assets.filter((asset): asset is TextAsset => asset.kind === "text" && asset.metadata?.promptLibraryCustom === true), [assets]);
    const displayPrompts = useMemo<DisplayPrompt[]>(() => {
        const builtIn = brandPrompts.map((prompt) => ({
            id: prompt.id,
            title: prompt.title[locale],
            summary: prompt.summary[locale],
            prompt: prompt.prompt[locale],
            category: prompt.category,
            coverUrl: builtInCovers[prompt.id] || prompt.coverUrl,
        }));
        const custom = customPromptAssets.map((asset) => ({
            id: `custom-${asset.id}`,
            title: asset.title,
            summary: typeof asset.metadata?.promptSummary === "string" ? asset.metadata.promptSummary : "",
            prompt: asset.data.content,
            category: isPromptCategory(asset.metadata?.promptCategory) ? asset.metadata.promptCategory : "product",
            coverUrl: asset.coverUrl,
            assetId: asset.id,
            custom: true,
        }));
        return [...custom, ...builtIn];
    }, [builtInCovers, customPromptAssets, locale]);
    const filteredPrompts = useMemo(() => {
        const normalizedQuery = query.trim().toLocaleLowerCase();
        return displayPrompts.filter((prompt) => {
            if (category !== "all" && prompt.category !== category) return false;
            if (!normalizedQuery) return true;
            return `${prompt.title} ${prompt.summary} ${prompt.prompt}`.toLocaleLowerCase().includes(normalizedQuery);
        });
    }, [category, displayPrompts, query]);
    const savedPromptIds = useMemo(() => new Set(assets.map((asset) => asset.metadata?.libraryPromptId).filter((id): id is string => typeof id === "string")), [assets]);

    const openCreate = () => {
        setEditingAssetId(null);
        setDraft(emptyDraft);
        setEditorOpen(true);
    };
    const openEdit = (prompt: DisplayPrompt) => {
        if (!prompt.assetId) return;
        setEditingAssetId(prompt.assetId);
        setDraft({ title: prompt.title, summary: prompt.summary, prompt: prompt.prompt, category: prompt.category, coverUrl: prompt.coverUrl || "" });
        setEditorOpen(true);
    };
    const readCoverFile = async (file?: File) => {
        if (!file) return null;
        if (!file.type.startsWith("image/")) {
            message.error(t("home.promptLibrary.imageTypeError"));
            return null;
        }
        if (file.size > 8 * 1024 * 1024) {
            message.error(t("home.promptLibrary.imageSizeError"));
            return null;
        }
        return readFileAsDataUrl(file);
    };
    const readCover = async (file?: File) => {
        const coverUrl = await readCoverFile(file);
        if (!coverUrl) return;
        setDraft((current) => ({ ...current, coverUrl }));
        if (fileInputRef.current) fileInputRef.current.value = "";
    };
    const chooseBuiltInCover = (promptId: string) => {
        setCoverPromptId(promptId);
        builtInCoverInputRef.current?.click();
    };
    const replaceBuiltInCover = async (file?: File) => {
        const promptId = coverPromptId;
        const coverUrl = await readCoverFile(file);
        if (!promptId || !coverUrl) return;
        setBuiltInCover(promptId, coverUrl);
        message.success(t("home.promptLibrary.coverUpdated"));
        setCoverPromptId(null);
        if (builtInCoverInputRef.current) builtInCoverInputRef.current.value = "";
    };
    const resetBuiltInCover = (promptId: string) => {
        removeBuiltInCover(promptId);
        message.success(t("home.promptLibrary.coverReset"));
    };
    const saveCustomPrompt = () => {
        if (!draft.title.trim() || !draft.prompt.trim()) {
            message.warning(t("home.promptLibrary.required"));
            return;
        }
        const payload = {
            kind: "text" as const,
            title: draft.title.trim(),
            coverUrl: draft.coverUrl,
            tags: [promptCategories.find((item) => item.id === draft.category)?.label[locale] || draft.category, t("home.promptLibrary.brandTag")],
            source: t("home.promptLibrary.source"),
            data: { content: draft.prompt.trim() },
            metadata: { promptLibraryCustom: true, promptCategory: draft.category, promptSummary: draft.summary.trim() },
        };
        if (editingAssetId) updateAsset(editingAssetId, payload);
        else addAsset(payload);
        message.success(t(editingAssetId ? "home.promptLibrary.updated" : "home.promptLibrary.created"));
        setEditorOpen(false);
    };
    const saveBuiltInPrompt = (prompt: DisplayPrompt) => {
        if (prompt.custom || savedPromptIds.has(prompt.id)) {
            message.info(t("home.promptLibrary.alreadySaved"));
            return;
        }
        addAsset({
            kind: "text",
            title: prompt.title,
            coverUrl: prompt.coverUrl || "",
            tags: [promptCategories.find((item) => item.id === prompt.category)?.label[locale] || prompt.category, t("home.promptLibrary.brandTag")],
            source: t("home.promptLibrary.source"),
            data: { content: prompt.prompt },
            metadata: { libraryPromptId: prompt.id },
        });
        message.success(t("home.promptLibrary.saved"));
    };

    return (
        <section className="home-prompt-section relative overflow-hidden border-t border-stone-200 dark:border-white/10">
            <div className="home-prompt-marquee" aria-hidden="true">
                <div>VISUAL PROMPTS / IMAGE DIRECTION / CREATIVE SYSTEM / VISUAL PROMPTS / IMAGE DIRECTION / CREATIVE SYSTEM /</div>
            </div>
            <div className="relative mx-auto max-w-[1480px] px-6 py-14 sm:py-20">
                <div className="grid gap-8 lg:grid-cols-[300px_minmax(0,1fr)] lg:gap-12">
                    <div className="lg:sticky lg:top-20 lg:self-start">
                        <div className="flex items-center gap-2 text-xs font-semibold text-stone-500 dark:text-stone-400">
                            <Sparkles className="size-3.5" style={{ color: "var(--home-accent)" }} />
                            {t("home.promptLibrary.eyebrow")}
                        </div>
                        <h2 className="mt-4 max-w-64 text-4xl font-semibold leading-[1.05] sm:text-5xl">{t("home.promptLibrary.title")}</h2>
                        <p className="mt-5 max-w-72 text-sm leading-6 text-stone-500 dark:text-stone-400">{t("home.promptLibrary.description")}</p>
                        <button
                            type="button"
                            onClick={openCreate}
                            className="mt-6 inline-flex h-11 items-center gap-2 rounded-md px-4 text-sm font-semibold text-white transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                            style={{ background: "var(--home-accent)" }}
                        >
                            <Plus className="size-4" />
                            {t("home.promptLibrary.add")}
                        </button>
                        <label className="mt-8 flex h-10 items-center gap-2 border-b border-stone-300 bg-transparent px-0 transition focus-within:border-stone-700 dark:border-stone-700 dark:focus-within:border-stone-300">
                            <Search className="size-4 shrink-0 text-stone-400" />
                            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t("home.promptLibrary.search")} className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-stone-400" />
                        </label>
                        <div className="mt-5 flex flex-wrap gap-x-4 gap-y-2 lg:flex-col lg:items-start">
                            {promptCategories.map((item) => (
                                <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => setCategory(item.id)}
                                    className={cn(
                                        "relative py-1 text-sm transition after:absolute after:bottom-0 after:left-0 after:h-px after:bg-current after:transition-all focus-visible:outline-none",
                                        category === item.id ? "font-semibold text-stone-950 after:w-full dark:text-white" : "text-stone-400 after:w-0 hover:text-stone-800 hover:after:w-full dark:hover:text-stone-200",
                                    )}
                                >
                                    {item.label[locale]}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        {filteredPrompts.length ? (
                            <div className="grid gap-x-4 gap-y-8 sm:grid-cols-2 xl:grid-cols-3">
                                <button
                                    type="button"
                                    onClick={openCreate}
                                    className="prompt-add-tile group flex min-h-[420px] flex-col items-center justify-center border border-dashed border-stone-300 p-6 text-center transition hover:border-stone-700 hover:bg-white/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-400 dark:border-stone-700 dark:hover:border-stone-300 dark:hover:bg-white/5"
                                >
                                    <span className="grid size-14 place-items-center rounded-full border border-stone-300 transition group-hover:rotate-90 group-hover:border-stone-700 dark:border-stone-700 dark:group-hover:border-stone-300">
                                        <ImagePlus className="size-5" />
                                    </span>
                                    <span className="mt-5 text-base font-semibold">{t("home.promptLibrary.addImagePrompt")}</span>
                                    <span className="mt-2 max-w-48 text-xs leading-5 text-stone-400">{t("home.promptLibrary.addImagePromptHint")}</span>
                                </button>
                                {filteredPrompts.map((prompt, index) => {
                                    const saved = prompt.custom || savedPromptIds.has(prompt.id);
                                    return (
                                        <article key={prompt.id} className="prompt-visual-card group min-w-0">
                                            <div className="prompt-cover-panel relative aspect-[4/3] overflow-hidden">
                                                {prompt.coverUrl ? (
                                                    <img src={prompt.coverUrl} alt={prompt.title} loading="lazy" decoding="async" draggable={false} className="prompt-cover-image size-full" />
                                                ) : (
                                                    <PromptArtwork category={prompt.category} index={index} />
                                                )}
                                                <span className="absolute left-3 top-3 bg-black px-2 py-1 text-[10px] font-semibold text-white">{String(index + 1).padStart(2, "0")}</span>
                                                {prompt.custom ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => openEdit(prompt)}
                                                        className="absolute right-3 top-3 grid size-8 place-items-center rounded-full bg-white/90 text-black shadow-sm backdrop-blur transition hover:scale-105"
                                                        aria-label={t("home.promptLibrary.edit")}
                                                        title={t("home.promptLibrary.edit")}
                                                    >
                                                        <Edit3 className="size-3.5" />
                                                    </button>
                                                ) : (
                                                    <div className="absolute right-3 top-3 flex items-center gap-2">
                                                        {builtInCovers[prompt.id] ? (
                                                            <button
                                                                type="button"
                                                                onClick={() => resetBuiltInCover(prompt.id)}
                                                                className="grid size-8 place-items-center rounded-full border border-white/15 bg-black/70 text-white shadow-sm transition hover:scale-105 hover:bg-black/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                                                                aria-label={t("home.promptLibrary.resetCover")}
                                                                title={t("home.promptLibrary.resetCover")}
                                                            >
                                                                <RotateCcw className="size-3.5" />
                                                            </button>
                                                        ) : null}
                                                        <button
                                                            type="button"
                                                            onClick={() => chooseBuiltInCover(prompt.id)}
                                                            className="grid size-8 place-items-center rounded-full border border-white/15 bg-black/70 text-white shadow-sm transition hover:scale-105 hover:bg-black/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                                                            aria-label={t("home.promptLibrary.replaceCover")}
                                                            title={t("home.promptLibrary.replaceCover")}
                                                        >
                                                            <ImagePlus className="size-3.5" />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="prompt-card-body border-x border-b border-stone-200 p-4 dark:border-stone-800">
                                                <p className="text-[10px] font-semibold uppercase text-stone-400">{promptCategories.find((item) => item.id === prompt.category)?.label[locale]}</p>
                                                <h3 className="mt-2 truncate text-lg font-semibold">{prompt.title}</h3>
                                                <p className="mt-1 truncate text-xs text-stone-500 dark:text-stone-400">{prompt.summary || t("home.promptLibrary.customSummaryFallback")}</p>
                                                <p className="mt-4 line-clamp-3 min-h-[66px] text-sm leading-6 text-stone-600 dark:text-stone-300">{prompt.prompt}</p>
                                                <div className="mt-4 flex items-center gap-2 border-t border-stone-200 pt-3 dark:border-stone-800">
                                                    <button
                                                        type="button"
                                                        onClick={() => copyText(prompt.prompt, t("home.promptLibrary.copied"))}
                                                        className="inline-flex h-8 flex-1 items-center justify-center gap-2 rounded-md bg-stone-100 px-3 text-xs font-semibold transition hover:bg-stone-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-400 dark:bg-stone-800 dark:hover:bg-stone-700"
                                                    >
                                                        <Copy className="size-3.5" />
                                                        {t("home.promptLibrary.copy")}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => saveBuiltInPrompt(prompt)}
                                                        className="inline-flex h-8 flex-1 items-center justify-center gap-2 rounded-md border border-stone-300 px-3 text-xs font-semibold transition hover:border-stone-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-400 dark:border-stone-700 dark:hover:border-stone-500"
                                                    >
                                                        {saved ? <Check className="size-3.5" /> : <BookmarkPlus className="size-3.5" />}
                                                        {t(saved ? "home.promptLibrary.savedLabel" : "home.promptLibrary.save")}
                                                    </button>
                                                </div>
                                            </div>
                                        </article>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="flex min-h-80 items-center justify-center border-y border-stone-200 text-sm text-stone-500 dark:border-stone-800">{t("home.promptLibrary.empty")}</div>
                        )}
                    </div>
                </div>
            </div>

            <Modal title={t(editingAssetId ? "home.promptLibrary.editTitle" : "home.promptLibrary.createTitle")} open={editorOpen} onCancel={() => setEditorOpen(false)} width={680} footer={null} destroyOnHidden>
                <div className="mt-5 grid gap-5 sm:grid-cols-[220px_minmax(0,1fr)]">
                    <div>
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="group relative flex aspect-[4/3] w-full items-center justify-center overflow-hidden rounded-lg border border-dashed border-stone-300 bg-stone-50 text-center transition hover:border-stone-600 dark:border-stone-700 dark:bg-stone-900 dark:hover:border-stone-400"
                        >
                            {draft.coverUrl ? (
                                <img src={draft.coverUrl} alt="" className="size-full object-contain" />
                            ) : (
                                <span className="px-5">
                                    <UploadCloud className="mx-auto size-6 text-stone-400 transition group-hover:-translate-y-1" />
                                    <span className="mt-3 block text-sm font-semibold">{t("home.promptLibrary.uploadCover")}</span>
                                    <span className="mt-1 block text-xs leading-5 text-stone-400">{t("home.promptLibrary.uploadCoverHint")}</span>
                                </span>
                            )}
                        </button>
                        {draft.coverUrl ? (
                            <button type="button" onClick={() => setDraft((current) => ({ ...current, coverUrl: "" }))} className="mt-2 inline-flex items-center gap-1 text-xs text-stone-400 transition hover:text-stone-800 dark:hover:text-stone-200">
                                <X className="size-3" />
                                {t("home.promptLibrary.removeCover")}
                            </button>
                        ) : null}
                        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(event) => void readCover(event.target.files?.[0])} />
                    </div>
                    <div className="grid gap-4">
                        <label className="grid gap-1.5 text-sm font-medium">
                            {t("home.promptLibrary.fields.title")}
                            <Input value={draft.title} onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))} maxLength={80} placeholder={t("home.promptLibrary.fields.titlePlaceholder")} />
                        </label>
                        <label className="grid gap-1.5 text-sm font-medium">
                            {t("home.promptLibrary.fields.category")}
                            <Select
                                value={draft.category}
                                onChange={(value) => setDraft((current) => ({ ...current, category: value }))}
                                options={promptCategories.filter((item) => item.id !== "all").map((item) => ({ value: item.id, label: item.label[locale] }))}
                            />
                        </label>
                        <label className="grid gap-1.5 text-sm font-medium">
                            {t("home.promptLibrary.fields.summary")}
                            <Input value={draft.summary} onChange={(event) => setDraft((current) => ({ ...current, summary: event.target.value }))} maxLength={120} placeholder={t("home.promptLibrary.fields.summaryPlaceholder")} />
                        </label>
                    </div>
                </div>
                <label className="mt-5 grid gap-1.5 text-sm font-medium">
                    {t("home.promptLibrary.fields.prompt")}
                    <Input.TextArea value={draft.prompt} onChange={(event) => setDraft((current) => ({ ...current, prompt: event.target.value }))} rows={7} maxLength={4000} showCount placeholder={t("home.promptLibrary.fields.promptPlaceholder")} />
                </label>
                <div className="mt-6 flex justify-end gap-2">
                    <Button onClick={() => setEditorOpen(false)}>{t("common.cancel")}</Button>
                    <Button type="primary" onClick={saveCustomPrompt}>
                        {t(editingAssetId ? "common.save" : "home.promptLibrary.create")}
                    </Button>
                </div>
            </Modal>
            <input ref={builtInCoverInputRef} type="file" accept="image/*" className="hidden" onChange={(event) => void replaceBuiltInCover(event.target.files?.[0])} />
        </section>
    );
}

function PromptArtwork({ category, index }: { category: DisplayPrompt["category"]; index: number }) {
    return (
        <div className={`prompt-artwork prompt-artwork-${category}`} aria-hidden="true">
            <div className="prompt-artwork-grid" />
            <div className="prompt-artwork-mark" />
            <div className="prompt-artwork-disc" />
            <div className="prompt-artwork-rule" />
            <span className="prompt-artwork-index">A/{String(index + 1).padStart(2, "0")}</span>
            <span className="prompt-artwork-word">{category.toUpperCase()}</span>
        </div>
    );
}

function isPromptCategory(value: unknown): value is Exclude<PromptCategoryId, "all"> {
    return typeof value === "string" && ["product", "portrait", "cinema", "space", "graphic", "commerce"].includes(value);
}
