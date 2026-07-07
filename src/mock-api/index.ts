/**
 * Mindline Showcase — mock API client.
 *
 * This package replaces the generated API client used by the full Mindline
 * app. It exposes the exact same hook surface, backed by an in-memory demo
 * data store, so the entire frontend runs with zero backend.
 */
export * from "./types";
export * from "./hooks";
export { setWorkspaceId } from "./store";
