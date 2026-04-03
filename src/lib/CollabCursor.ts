// Importing Packages
import { Extension } from "@tiptap/core";
import { yCursorPlugin } from "@tiptap/y-tiptap";
import type { Awareness } from "y-protocols/awareness";

export interface CursorOptions {
  provider: { awareness: Awareness } | null;
  user: Record<string, any>;
}

/**
 * Custom CollaborationCursor extension that uses @tiptap/y-tiptap'sw
 * yCursorPlugin (matching the ySyncPlugin used by @tiptap/extension-collaboration v3).
 */

const CollabCursor = Extension.create<CursorOptions>({
  name: "collaborationCursor",

  addOptions() {
    return {
      provider: null,
      user: { name: "Anonymous", color: "#6c63ff" },
    };
  },

  addProseMirrorPlugins() {
    const { provider, user } = this.options;
    if (!provider?.awareness) return [];

    provider.awareness.setLocalStateField("user", user);

    const localUserId = user.userId;

    return [
      yCursorPlugin(provider.awareness, {
        awarenessStateFilter: (
          currentClientId: number,
          otherClientId: number,
          otherState: any,
        ) => {
          if (currentClientId === otherClientId) return false;
          if (localUserId && otherState?.user?.userId === localUserId)
            return false;
          return true;
        },

        cursorBuilder: (awarenessUser: Record<string, any>) => {
          const cursor = document.createElement("span");
          cursor.classList.add("collaboration-cursor__caret");
          cursor.setAttribute(
            "style",
            `border-color: ${awarenessUser.color || "#6c63ff"}`,
          );

          const label = document.createElement("div");
          label.classList.add("collaboration-cursor__label");
          label.setAttribute(
            "style",
            `background-color: ${awarenessUser.color || "#6c63ff"}`,
          );
          label.textContent = awarenessUser.name || "Anonymous";

          cursor.insertBefore(label, null);
          return cursor;
        },
      }),
    ];
  },
});

export default CollabCursor;
