// Importing Packages
import type { Awareness } from "y-protocols/awareness.js";

export interface Document {
  documentId: string;
  title: string;
  role: string;
  updatedAt: string;
  ownerId: string;
}

export interface OnlineUser {
  userId: string;
  name: string;
  email: string;
  profilePicture: string;
}

export interface Invitation {
  invitationId: string;
  documentId: string;
  documentTitle: string;
  inviterName: string;
  inviterEmail: string;
  role: string;
  createdAt: string;
}

export interface CursorOptions {
  provider: { awareness: Awareness } | null;
  user: Record<string, string>;
}