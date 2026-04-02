import * as Y from 'yjs';
import { io, Socket } from 'socket.io-client';
import * as awarenessProtocol from 'y-protocols/awareness';
import { Observable } from 'lib0/observable';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:8080';

const toOwnedArrayBuffer = (uint8: Uint8Array): ArrayBuffer => {
  const copy = new Uint8Array(uint8);
  return copy.buffer as ArrayBuffer;
};

/**
 * Socket.IO-based Yjs provider compatible with TipTap's Collaboration
 * and CollaborationCursor extensions.
 */
export class SocketIOProvider extends Observable<string> {
  public doc: Y.Doc;
  public socket: Socket;
  public documentId: string;
  public awareness: awarenessProtocol.Awareness;
  public synced = false;

  private _connected = false;
  private _updateHandler: (update: Uint8Array, origin: unknown) => void;
  private _awarenessHandler: (changes: { added: number[]; updated: number[]; removed: number[] }) => void;
  private _awarenessHeartbeat: ReturnType<typeof setInterval> | null = null;

  constructor(documentId: string, ydoc: Y.Doc) {
    super();
    this.doc = ydoc;
    this.documentId = documentId;
    this.awareness = new awarenessProtocol.Awareness(ydoc);

    this.socket = io(SOCKET_URL, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
    });

    this.socket.on('connect', () => {
      this._connected = true;
      this.emit('status', [{ status: 'connected' }]);
      this.socket.emit('join-document', this.documentId);
    });

    this.socket.on('sync-init', (stateUpdate: ArrayBuffer) => {
      try {
        if (stateUpdate && stateUpdate.byteLength > 0) {
          Y.applyUpdate(this.doc, new Uint8Array(stateUpdate), this);
        }
      } catch (e) {
        console.warn('[SocketIOProvider] Failed to apply initial state:', e);
      }

      const localState = Y.encodeStateAsUpdate(this.doc);
      this.socket.emit('sync-complete', this.documentId, toOwnedArrayBuffer(localState));

      this.synced = true;
      this.emit('synced', [true]);
      this.emit('sync', [true]);
    });

    this.socket.on('yjs-update', (update: ArrayBuffer) => {
      try {
        Y.applyUpdate(this.doc, new Uint8Array(update), this);
      } catch (e) {
        console.warn('[SocketIOProvider] Failed to apply yjs update:', e);
      }
    });

    this.socket.on('awareness-update', (update: ArrayBuffer) => {
      try {
        awarenessProtocol.applyAwarenessUpdate(
          this.awareness,
          new Uint8Array(update),
          'remote'
        );
      } catch (e) {
        console.warn('[SocketIOProvider] Failed to apply awareness update:', e);
      }
    });

    this.socket.on('disconnect', () => {
      this._connected = false;
      this.synced = false;
      this.emit('status', [{ status: 'disconnected' }]);
      this.emit('synced', [false]);
      this.emit('sync', [false]);
      awarenessProtocol.removeAwarenessStates(
        this.awareness,
        [this.doc.clientID],
        'disconnect'
      );
    });

    this.socket.io.on('reconnect', () => {
      this.socket.emit('join-document', this.documentId);
    });

    this._updateHandler = (update: Uint8Array, origin: unknown) => {
      if (origin === this) return;
      if (this._connected) {
        this.socket.emit('yjs-update', this.documentId, toOwnedArrayBuffer(update));
      }
    };
    this.doc.on('update', this._updateHandler);

    this._awarenessHandler = ({ added, updated, removed }) => {
      if (!this._connected) return;
      const changed = [...added, ...updated, ...removed];
      const encoded = awarenessProtocol.encodeAwarenessUpdate(this.awareness, changed);
      this.socket.emit('awareness-update', this.documentId, toOwnedArrayBuffer(encoded));
    };
    this.awareness.on('update', this._awarenessHandler);

    this._awarenessHeartbeat = setInterval(() => {
      if (!this._connected) return;
      const localState = this.awareness.getLocalState();
      if (localState) {
        this.awareness.setLocalState(localState);
      }
    }, 15_000);

    this.socket.on('user-left', ({ userId }: { userId: string }) => {
      const states = this.awareness.getStates();
      const toRemove: number[] = [];
      states.forEach((state: any, clientId: number) => {
        if (clientId === this.doc.clientID) return;
        if (state?.user?.userId === userId) {
          toRemove.push(clientId);
        }
      });
      if (toRemove.length > 0) {
        awarenessProtocol.removeAwarenessStates(this.awareness, toRemove, 'user-left');
      }
    });
  }

  /** Sets a field on the local awareness state. */
  setAwarenessField(key: string, value: unknown) {
    this.awareness.setLocalStateField(key, value);
  }

  /** Cleans up all listeners, awareness states, and the socket connection. */
  destroy() {
    if (this._awarenessHeartbeat) {
      clearInterval(this._awarenessHeartbeat);
      this._awarenessHeartbeat = null;
    }
    awarenessProtocol.removeAwarenessStates(
      this.awareness,
      [this.doc.clientID],
      'destroy'
    );
    this.doc.off('update', this._updateHandler);
    this.awareness.off('update', this._awarenessHandler);
    this.awareness.destroy();
    this.socket.disconnect();
    super.destroy();
  }
}