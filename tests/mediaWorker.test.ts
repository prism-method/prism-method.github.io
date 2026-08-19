import { describe, it, expect } from 'vitest';

// Simulating the parseFfprobeStderr logic from mediaWorker for testing
function parseFfprobeStderr(stderr: string): any {
  const result: any = {};
  
  const videoMatch = stderr.match(/Stream #\d+:\d+(.*): Video: (.*)/);
  if (videoMatch) {
    result.hasVideo = true;
    const vStr = videoMatch[2];
    
    const codecMatch = vStr.match(/^([a-zA-Z0-9_]+)/);
    if (codecMatch) result.codec = codecMatch[1];
    
    const pixFmtMatch = vStr.match(/,\s*([a-zA-Z0-9_]+)(?:\([^\)]+\))?,/);
    if (pixFmtMatch) result.pixelFormat = pixFmtMatch[1];
    
    const dimMatch = vStr.match(/(\d{2,})x(\d{2,})/);
    if (dimMatch) {
      result.width = parseInt(dimMatch[1], 10);
      result.height = parseInt(dimMatch[2], 10);
    }
    
    const fpsMatch = vStr.match(/([\d\.]+)\s*fps/);
    if (fpsMatch) {
       result.fps = parseFloat(fpsMatch[1]);
    }
    
    const tbrMatch = vStr.match(/([\d\.]+)\s*tbr/);
    if (tbrMatch && fpsMatch) {
        const tbr = parseFloat(tbrMatch[1]);
        const fps = parseFloat(fpsMatch[1]);
        if (Math.abs(tbr - fps) > 0.1) {
            result.isVFR = true;
        } else {
            result.isVFR = false;
        }
    } else {
        result.isVFR = false;
    }
  } else {
    result.hasVideo = false;
  }
  
  const audioMatch = stderr.match(/Stream #\d+:\d+(.*): Audio: (.*)/);
  if (audioMatch) {
    result.hasAudio = true;
    const aStr = audioMatch[2];
    
    const codecMatch = aStr.match(/^([a-zA-Z0-9_]+)/);
    if (codecMatch) result.audioCodec = codecMatch[1];
    
    const srMatch = aStr.match(/(\d+)\s*Hz/);
    if (srMatch) result.sampleRate = parseInt(srMatch[1], 10);
  } else {
    result.hasAudio = false;
  }
  
  const durMatch = stderr.match(/Duration: (\d{2}):(\d{2}):(\d{2}\.\d{2})/);
  if (durMatch) {
      const h = parseInt(durMatch[1], 10);
      const m = parseInt(durMatch[2], 10);
      const s = parseFloat(durMatch[3]);
      result.durationSeconds = h * 3600 + m * 60 + s;
  }
  
  const brMatch = stderr.match(/bitrate: (\d+) kb\/s/);
  if (brMatch) {
      result.bitrate = parseInt(brMatch[1], 10) * 1000;
  }

  return result;
}

describe('Worker metadata parsing', () => {
    it('correctly parses H.264 CFR 60fps metadata', () => {
        const stderr = `
  Duration: 00:00:15.50, start: 0.000000, bitrate: 2244 kb/s
  Stream #0:0(und): Video: h264 (High) (avc1 / 0x31637661), yuv420p(progressive), 1920x1080 [SAR 1:1 DAR 16:9], 2108 kb/s, 60 fps, 60 tbr, 15360 tbn (default)
  Stream #0:1(und): Audio: aac (LC) (mp4a / 0x6134706D), 48000 Hz, stereo, fltp, 128 kb/s (default)
        `;
        
        const parsed = parseFfprobeStderr(stderr);
        expect(parsed.hasVideo).toBe(true);
        expect(parsed.codec).toBe('h264');
        expect(parsed.pixelFormat).toBe('yuv420p');
        expect(parsed.width).toBe(1920);
        expect(parsed.height).toBe(1080);
        expect(parsed.fps).toBe(60);
        expect(parsed.isVFR).toBe(false);
        expect(parsed.hasAudio).toBe(true);
        expect(parsed.audioCodec).toBe('aac');
        expect(parsed.sampleRate).toBe(48000);
        expect(parsed.bitrate).toBe(2244000);
        expect(parsed.durationSeconds).toBe(15.5);
    });

    it('correctly parses HEVC VFR 120fps metadata', () => {
        const stderr = `
  Duration: 00:01:00.00, start: 0.000000, bitrate: 45000 kb/s
  Stream #0:0(und): Video: hevc (Main) (hvc1 / 0x31637668), yuv420p(tv, bt709), 3840x2160, 44000 kb/s, 119.88 fps, 120 tbr, 90k tbn (default)
        `;
        
        const parsed = parseFfprobeStderr(stderr);
        expect(parsed.codec).toBe('hevc');
        expect(parsed.width).toBe(3840);
        expect(parsed.height).toBe(2160);
        expect(parsed.fps).toBe(119.88);
        expect(parsed.isVFR).toBe(true);
        expect(parsed.hasAudio).toBe(false);
    });
});
