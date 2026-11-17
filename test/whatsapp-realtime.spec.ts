import { describe, it, expect } from 'vitest';
import { realtimeUrl } from '../src/features/whatsapp/lib/realtime';

describe('realtimeUrl', () => {
  it('points at the /realtime namespace on the API origin, outside /api/v1', () => {
    expect(realtimeUrl('http://localhost:3001/api/v1')).toBe('http://localhost:3001/realtime');
    expect(realtimeUrl('https://api.shalom.co/api/v1')).toBe('https://api.shalom.co/realtime');
  });
});
