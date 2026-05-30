export type WorkspaceId = string;

export interface ApiEnvelope<T> {
  data: T;
  error?: string;
}