import { describe, it, expect, vi, beforeEach } from 'vitest';

const { io } = vi.hoisted(() => {
  const fakeSocket = { on: vi.fn(), removeAllListeners: vi.fn(), disconnect: vi.fn() };
  return { io: vi.fn(() => fakeSocket) };
});

vi.mock('socket.io-client', () => ({ io }));

import { connectRealtime } from '../src/features/whatsapp/lib/realtime';

describe('connectRealtime authentication', () => {
  beforeEach(() => {
    io.mockClear();
    localStorage.clear();
  });

  it('sends the current session token when the socket connects (and on every reconnect)', () => {
    localStorage.setItem('shalom_access_token', 'token-1');
    connectRealtime({});

    const options = (io.mock.calls[0] as any[])[1];
    const callback = vi.fn();
    options.auth(callback);
    expect(callback).toHaveBeenCalledWith({ token: 'token-1' });

    // A renewed token is picked up on the next (re)connection.
    localStorage.setItem('shalom_access_token', 'token-2');
    options.auth(callback);
    expect(callback).toHaveBeenLastCalledWith({ token: 'token-2' });
  });
});
