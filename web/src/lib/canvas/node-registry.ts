import i18n from "@/i18n";

import type { CanvasNodeDefinition } from "@/types/canvas-plugin";
import { CanvasNodeType } from "@/types/canvas";

const definitions = new Map<string, CanvasNodeDefinition>();

export function registerNodeDefinitions(defs: CanvasNodeDefinition[]) {
    defs.forEach((def) => {
        definitions.set(def.type, def);
    });
}

export function getNodeDefinition(type: string) {
    return definitions.get(type);
}

export function listNodeDefinitions() {
    return Array.from(definitions.values());
}

export function isRegisteredNodeType(type: string) {
    return definitions.has(type);
}

const FALLBACK_SPEC = { width: 340, height: 240, title: i18n.t("canvas.node.node"), metadata: {} as CanvasNodeDefinition["defaultMetadata"] };

// Provide default size, title, and metadata shared by createCanvasNode and node operations.
export function getNodeSpec(type: string) {
    const def = definitions.get(type);
    if (!def) return FALLBACK_SPEC;
    return { width: def.defaultSize.width, height: def.defaultSize.height, title: def.title, metadata: def.defaultMetadata };
}

export function isBuiltinNodeType(type: string) {
    return (Object.values(CanvasNodeType) as string[]).includes(type);
}
