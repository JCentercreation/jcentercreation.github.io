import { describe, expect, it } from 'vitest';
import { chooseTier } from './capabilities';

const GPU = 'ANGLE (Apple, Apple M2, OpenGL 4.1)';

describe('rendering tier selection', () => {
  it('uses the simple version without WebGL2', () => {
    expect(chooseTier({ webgl2: false, minScreen: 900 }).tier).toBe('fallback');
  });

  it('gives desktops and laptops the full tier', () => {
    expect(chooseTier({ webgl2: true, minScreen: 900, deviceMemory: 8, cores: 8, gpu: GPU }).tier).toBe('full');
  });

  it('no longer downgrades a capable tablet just because it is touch', () => {
    // iPad-class tablet: large screen; Safari reports no deviceMemory.
    expect(chooseTier({ webgl2: true, minScreen: 834, cores: 8, gpu: 'Apple GPU' }).tier).toBe('full');
    // Android tablet with 8 GB.
    expect(chooseTier({ webgl2: true, minScreen: 800, deviceMemory: 8, cores: 8, gpu: 'Adreno (TM) 740' }).tier).toBe('full');
  });

  it('keeps phones on the reduced tier', () => {
    expect(chooseTier({ webgl2: true, minScreen: 390, deviceMemory: 8, cores: 8, gpu: 'Apple GPU' })).toEqual({ tier: 'reduced', reason: 'phone-sized screen' });
    expect(chooseTier({ webgl2: true, minScreen: 412, deviceMemory: 8, cores: 8, gpu: 'Mali-G710' }).tier).toBe('reduced');
  });

  it('keeps genuinely constrained devices (memory, cores, software rendering) on the reduced tier', () => {
    expect(chooseTier({ webgl2: true, minScreen: 800, deviceMemory: 4, cores: 8, gpu: 'Mali-G52' }).reason).toBe('4 GB memory');
    expect(chooseTier({ webgl2: true, minScreen: 900, deviceMemory: 8, cores: 4, gpu: GPU }).reason).toBe('4 CPU cores');
    expect(chooseTier({ webgl2: true, minScreen: 900, deviceMemory: 8, cores: 16, gpu: 'Google SwiftShader' }).reason).toBe('software renderer');
    expect(chooseTier({ webgl2: true, minScreen: 900, deviceMemory: 8, cores: 16, gpu: 'llvmpipe (LLVM 15.0.7, 256 bits)' }).tier).toBe('reduced');
  });

  it('treats unknown memory or core counts as not constrained', () => {
    expect(chooseTier({ webgl2: true, minScreen: 900 }).tier).toBe('full');
  });
});
