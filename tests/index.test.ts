import { describe, it, expect } from 'vitest';
import { TravelCompanion } from '../src/index.js';

describe('TravelCompanion', () => {
  it('should create an instance', () => {
    const app = new TravelCompanion();
    expect(app).toBeDefined();
  });

  it('should have correct status when not running', () => {
    const app = new TravelCompanion();
    const status = app.getStatus();
    expect(status.isRunning).toBe(false);
    expect(status.agentsCount).toBe(0);
  });
});