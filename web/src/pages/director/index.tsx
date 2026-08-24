// Director page embeds the MONOFORM previs studio (white-model storyboarding tool) built assets.
export default function DirectorPage() {
    return (
        <main className="h-full bg-black" data-canvas-no-zoom>
            <iframe src={`${import.meta.env.BASE_URL}monoform/index.html`} title="MONOFORM" className="h-full w-full border-0" allow="camera; microphone; clipboard-write; download; fullscreen" />
        </main>
    );
}
