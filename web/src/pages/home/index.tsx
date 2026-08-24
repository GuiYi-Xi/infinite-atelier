import { useState, type CSSProperties } from "react";
import { ArrowRight, ArrowUpRight, Clock3, Palette, Plus, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { PromptLibrarySection } from "@/components/home/prompt-library-section";
import { cn } from "@/lib/utils";
import { useCanvasStore } from "@/stores/canvas/use-canvas-store";

const HOME_PALETTE_KEY = "infinite-canvas:home_palette";
const homePalettes = [
    { id: "garnet", label: "Garnet", accent: "#e5543f", secondary: "#d8b56d", deep: "#120b0a", surface: "#1b100e", wash: "#f8f0ed", ink: "#351713", onAccent: "#ffffff" },
    { id: "jade", label: "Jade", accent: "#0f9278", secondary: "#d7b66f", deep: "#07110f", surface: "#0d1a16", wash: "#edf6f2", ink: "#123b31", onAccent: "#ffffff" },
    { id: "sapphire", label: "Sapphire", accent: "#346bd8", secondary: "#e4ae52", deep: "#080d17", surface: "#0d1627", wash: "#eef2f8", ink: "#142c52", onAccent: "#ffffff" },
    { id: "amethyst", label: "Amethyst", accent: "#7659b6", secondary: "#d77a5b", deep: "#100c17", surface: "#191225", wash: "#f3eff8", ink: "#32204c", onAccent: "#ffffff" },
    { id: "pearl", label: "Pearl", accent: "#d9d4c8", secondary: "#e5543f", deep: "#11110f", surface: "#1b1a17", wash: "#f4f2ed", ink: "#302e29", onAccent: "#191815" },
] as const;

export default function IndexPage() {
    const { i18n, t } = useTranslation();
    const navigate = useNavigate();
    const projects = useCanvasStore((state) => state.projects);
    const createProject = useCanvasStore((state) => state.createProject);
    const [paletteId, setPaletteId] = useState<(typeof homePalettes)[number]["id"]>(() => {
        const saved = window.localStorage.getItem(HOME_PALETTE_KEY);
        return homePalettes.some((palette) => palette.id === saved) ? (saved as (typeof homePalettes)[number]["id"]) : "garnet";
    });

    const palette = homePalettes.find((item) => item.id === paletteId) || homePalettes[0];
    const recentProjects = [...projects].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).slice(0, 3);
    const homeStyle = {
        "--home-accent": palette.accent,
        "--home-secondary": palette.secondary,
        "--home-deep": palette.deep,
        "--home-surface": palette.surface,
        "--home-wash": palette.wash,
        "--home-ink": palette.ink,
        "--home-on-accent": palette.onAccent,
    } as CSSProperties;
    const projectAccents = [palette.accent, palette.secondary, `color-mix(in srgb, ${palette.accent} 45%, ${palette.secondary})`];
    const createAndEnter = () => {
        const id = createProject(t("canvas.defaultTitle", { count: projects.length + 1 }));
        navigate(`/canvas/${id}`);
    };
    const changePalette = (id: (typeof homePalettes)[number]["id"]) => {
        setPaletteId(id);
        window.localStorage.setItem(HOME_PALETTE_KEY, id);
    };

    return (
        <main className="home-shell relative h-full overflow-y-auto bg-background text-stone-950 dark:text-stone-100" style={homeStyle}>
            <section className="home-editorial-hero relative overflow-hidden border-b border-white/10 text-[#f5f3ee]">
                <div className="home-film-grain pointer-events-none absolute inset-0" aria-hidden="true" />
                <div className="home-silk-light pointer-events-none absolute inset-0" aria-hidden="true" />
                <div className="home-running-line home-running-line-top" aria-hidden="true">
                    <div>INFINITE CANVAS / IMAGE / TEXT / MOTION / DIRECTION / INFINITE CANVAS / IMAGE / TEXT / MOTION / DIRECTION /</div>
                </div>

                <div className="home-art-stage home-art-stage-background absolute inset-x-0 bottom-0 top-[29px] overflow-hidden" aria-hidden="true">
                    <div className="home-stage-grid absolute inset-0" />
                    <div className="home-stage-sheen absolute inset-0" />
                    <div className="home-stage-logo home-stage-logo-back" />
                    <div className="home-stage-logo home-stage-logo-mid" />
                    <div className="home-stage-logo home-stage-logo-front" />
                    <div className="home-stage-orbit" />
                    <div className="home-stage-cross home-stage-cross-one" />
                    <div className="home-stage-cross home-stage-cross-two" />
                    <div className="home-stage-topline absolute inset-x-10 top-7 flex items-center justify-between text-[9px] font-semibold uppercase text-white/55">
                        <span>IC / VISUAL SYSTEM</span>
                        <span>∞ / 24</span>
                    </div>
                    <div className="home-stage-caption absolute bottom-8 right-10 max-w-56 text-right text-white">
                        <p className="text-[10px] font-semibold uppercase text-white/45">CREATE WITHOUT EDGES</p>
                        <p className="mt-2 text-3xl font-medium leading-none">Ideas in motion.</p>
                    </div>
                    <div className="home-stage-meter-wrap absolute bottom-8 right-7 h-24 w-px bg-white/25">
                        <span className="home-stage-meter absolute bottom-0 left-0 w-px bg-white" />
                    </div>
                </div>

                <div className="home-hero-palette absolute right-10 top-16 z-20 flex items-center gap-4">
                    <span className="hidden text-[10px] font-semibold uppercase text-white/45 sm:block">KINETIC IDENTITY / 01</span>
                    <div className="flex items-center gap-2" aria-label={t("home.palette")}>
                        <Palette className="mr-1 size-3.5 text-white/45" />
                        {homePalettes.map((item) => (
                            <button
                                key={item.id}
                                type="button"
                                onClick={() => changePalette(item.id)}
                                className={cn(
                                    "relative size-5 rounded-full border border-white/25 transition hover:scale-125 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70",
                                    paletteId === item.id && "after:absolute after:inset-1 after:rounded-full after:border after:border-white/90",
                                )}
                                style={{ background: item.accent }}
                                aria-label={item.label}
                                aria-pressed={paletteId === item.id}
                                title={item.label}
                            />
                        ))}
                    </div>
                </div>

                <div className="home-hero-grid relative mx-auto flex min-h-[760px] max-w-[1480px] items-center px-6 pb-16 pt-20 lg:px-10 lg:pb-20 lg:pt-24">
                    <div className="home-hero-copy relative z-10 max-w-4xl">
                        <div className="mb-8 flex items-center gap-3 text-[11px] font-semibold uppercase text-stone-400">
                            <span className="home-status-pulse size-1.5 rounded-full" />
                            <span>{t("home.eyebrow")}</span>
                            <span className="h-px w-16 bg-current opacity-30" />
                            <span>EST. 2026</span>
                        </div>
                        <h1 className="home-display-title max-w-[900px] text-balance text-6xl font-semibold leading-[0.92] sm:text-8xl lg:text-[7.4rem]">
                            {t("meta.title")}
                            <span className="home-title-outline mt-5 block text-[0.29em] font-medium leading-[1.1]">{t("home.headline")}</span>
                        </h1>
                        <div className="mt-9 max-w-3xl border-t border-white/15 pt-6">
                            <p className="max-w-2xl text-pretty text-base leading-7 text-stone-300">{t("home.descriptionPlain")}</p>
                            <div className="mt-6 flex flex-wrap items-center gap-2">
                                <button
                                    type="button"
                                    onClick={createAndEnter}
                                    className="home-primary-action inline-flex h-11 items-center gap-2 rounded-md px-5 text-sm font-semibold text-white transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                                >
                                    <Plus className="size-4" />
                                    {t("home.newCanvas")}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => navigate("/canvas")}
                                    className="inline-flex h-11 items-center gap-2 rounded-md border border-white/30 px-5 text-sm font-semibold transition hover:bg-white hover:text-black focus-visible:outline-none focus-visible:ring-2"
                                >
                                    {t("home.openCanvas")}
                                    <ArrowRight className="size-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="home-hero-edge pointer-events-none absolute inset-x-0 bottom-0 z-20" aria-hidden="true" />
            </section>

            <section className="home-workspace-section relative border-b border-stone-200 dark:border-white/10">
                <div className="mx-auto max-w-[1480px] px-6 py-12 lg:px-10">
                    <div className="home-workspace-header mb-7 flex flex-wrap items-end justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase text-stone-400">
                                <Clock3 className="size-3.5" />
                                {t("home.workspace")}
                            </div>
                            <h2 className="mt-2 text-3xl font-semibold">{t("home.recentProjects")}</h2>
                        </div>
                        <button
                            type="button"
                            onClick={() => navigate("/canvas")}
                            className="inline-flex h-9 items-center gap-2 rounded-md px-2 text-sm font-medium text-stone-600 transition hover:bg-stone-100 hover:text-stone-950 focus-visible:outline-none focus-visible:ring-2 dark:text-stone-300 dark:hover:bg-stone-900 dark:hover:text-white"
                        >
                            {t("home.viewAll")}
                            <ArrowRight className="size-4" />
                        </button>
                    </div>
                    {recentProjects.length ? (
                        <div className="home-project-grid grid gap-px overflow-hidden border border-stone-200 bg-stone-200 md:grid-cols-3 dark:border-stone-800 dark:bg-stone-800">
                            {recentProjects.map((project, index) => (
                                <button
                                    key={project.id}
                                    type="button"
                                    onClick={() => navigate(`/canvas/${project.id}`)}
                                    className="home-project-card group relative min-h-36 p-5 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
                                >
                                    <span className="absolute inset-x-0 top-0 h-0.5 origin-left scale-x-0 transition group-hover:scale-x-100" style={{ background: projectAccents[index % projectAccents.length] }} />
                                    <span className="flex h-full flex-col justify-between gap-8">
                                        <span className="flex items-start justify-between gap-4">
                                            <span className="min-w-0 truncate text-base font-semibold">{project.title}</span>
                                            <ArrowUpRight className="size-4 shrink-0 text-stone-300 transition group-hover:text-stone-700 dark:text-stone-700 dark:group-hover:text-stone-200" />
                                        </span>
                                        <span>
                                            <span className="block text-xs text-stone-500 dark:text-stone-400">{t("canvas.project.stats", { nodes: project.nodes.length, connections: project.connections.length })}</span>
                                            <span className="mt-1 block text-xs text-stone-400">
                                                {t("canvas.project.updated", { date: new Date(project.updatedAt).toLocaleString(i18n.resolvedLanguage, { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }) })}
                                            </span>
                                        </span>
                                    </span>
                                </button>
                            ))}
                        </div>
                    ) : (
                        <button
                            type="button"
                            onClick={createAndEnter}
                            className="home-empty-project flex min-h-32 w-full items-center justify-between gap-5 border border-dashed border-stone-300 px-5 text-left transition focus-visible:outline-none focus-visible:ring-2 dark:border-stone-700"
                        >
                            <span>
                                <span className="block text-base font-semibold">{t("home.noProjects")}</span>
                                <span className="mt-1 block text-sm text-stone-500 dark:text-stone-400">{t("home.noProjectsDescription")}</span>
                            </span>
                            <span className="grid size-10 shrink-0 place-items-center rounded-full text-white" style={{ background: "var(--home-accent)" }}>
                                <Plus className="size-4" />
                            </span>
                        </button>
                    )}
                </div>
            </section>

            <PromptLibrarySection />
        </main>
    );
}
