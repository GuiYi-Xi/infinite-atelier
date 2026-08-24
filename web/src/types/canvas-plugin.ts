import type { ReactNode } from "react";

import type { CanvasNodeData, CanvasNodeMetadata } from "@/types/canvas";
import type { CanvasResourceKind } from "@/lib/canvas/canvas-resource-references";

// Resource emitted when a node is consumed as an upstream input.
export type CanvasNodeResource = { kind: CanvasResourceKind; text?: string; url?: string };

// Configuration for reusing the host's built-in generation panel.
export type CanvasBuiltinPanelConfig = {
    mode: "image" | "video" | "text" | "audio";
    promptPrefix?: string;
    writeBackToSelf?: boolean;
};

// Shared node definition used by built-in canvas nodes.
export type CanvasNodeDefinition = {
    type: string;
    title: string;
    icon: ReactNode;
    description?: string;
    defaultSize: { width: number; height: number };
    defaultMetadata?: CanvasNodeMetadata;
    minimapColor?: string;
    showInCreateMenu?: boolean; // Defaults to true.
    hasSourceHandle?: boolean; // Right-side output handle; defaults to true.
    hidePanel?: boolean; // Prevents click/create from opening a lower panel; intended for display-only nodes.
    transparentBackground?: boolean; // Makes the node card transparent so SVG or vector content blends into the canvas.
    autoOpenPanel?: boolean; // Opens the lower panel on click, like image nodes.
    useBuiltinPanel?: CanvasBuiltinPanelConfig; // Reuses the built-in generation panel.
    interactionToggle?: boolean; // Lets the host provide an Interaction/Move toolbar toggle.
    forceInteractive?: (node: CanvasNodeData) => boolean;
    keepAspectRatio?: (node: CanvasNodeData) => boolean;
    resource?: (node: CanvasNodeData) => CanvasNodeResource | null;
};
