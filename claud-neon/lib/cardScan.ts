'use client';

import { createWorker } from 'tesseract.js';

export type ScanResult = {
  cards: string[];
  raw: string;
  confidence: number;
  timestamp: number;
};

const CARD_PATTERNS = [
  /\b([2-9]|10|[AKQJ])\s*([♠♣♥♦SCHD]?)\b/gi,
];

const NORMALIZE_MAP: Record<string, string> = {
  'A': 'A', 'K': 'K', 'Q': 'Q', 'J': 'J',
  '10': '10', '9': '9', '8': '8', '7': '7',
  '6': '6', '5': '5', '4': '4', '3': '3', '2': '2',
  'I': 'J', // OCR often confuses I and J
  'O': '0', '0': '10',
};

export class CardScanEngine {
  private worker: Awaited<ReturnType<typeof createWorker>> | null = null;
  private stream: MediaStream | null = null;
  private videoEl: HTMLVideoElement | null = null;
  private canvasEl: HTMLCanvasElement | null = null;
  private scanning = false;
  private pollInterval: ReturnType<typeof setInterval> | null = null;
  private lastDetectedCards: Set<string> = new Set();
  private onNewCard: ((card: string) => void) | null = null;
  private onScanResult: ((result: ScanResult) => void) | null = null;

  async initialize() {
    this.worker = await createWorker('eng', 1, {
      logger: () => {}, // silent
    });
    await this.worker.setParameters({
      tessedit_char_whitelist: 'A23456789TJQK10',
      tessedit_pageseg_mode: '7' as never,
    });
  }

  async startCamera(videoEl: HTMLVideoElement, canvasEl: HTMLCanvasElement) {
    this.videoEl = videoEl;
    this.canvasEl = canvasEl;

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // rear camera on mobile
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      videoEl.srcObject = this.stream;
      await videoEl.play();
      return true;
    } catch (err) {
      console.error('[NEON21 Scan] Camera error:', err);
      return false;
    }
  }

  startContinuousScan(
    onNewCard: (card: string) => void,
    onScanResult?: (result: ScanResult) => void,
    intervalMs = 2000
  ) {
    if (this.scanning) return;
    this.scanning = true;
    this.onNewCard = onNewCard;
    this.onScanResult = onScanResult || null;

    this.pollInterval = setInterval(async () => {
      if (!this.scanning) return;
      const result = await this.scanFrame();
      if (!result) return;

      if (this.onScanResult) this.onScanResult(result);

      // Detect NEW cards not seen before
      for (const card of result.cards) {
        if (!this.lastDetectedCards.has(card)) {
          this.lastDetectedCards.add(card);
          if (this.onNewCard) this.onNewCard(card);
          // Remove from "seen" after 5 seconds so same card can be added again
          setTimeout(() => this.lastDetectedCards.delete(card), 5000);
        }
      }
    }, intervalMs);
  }

  stopScan() {
    this.scanning = false;
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
  }

  async scanFrame(): Promise<ScanResult | null> {
    if (!this.worker || !this.videoEl || !this.canvasEl) return null;

    const ctx = this.canvasEl.getContext('2d');
    if (!ctx) return null;

    // Capture frame
    this.canvasEl.width = this.videoEl.videoWidth;
    this.canvasEl.height = this.videoEl.videoHeight;
    ctx.drawImage(this.videoEl, 0, 0);

    // Enhance contrast for card detection
    const imageData = ctx.getImageData(0, 0, this.canvasEl.width, this.canvasEl.height);
    this.enhanceContrast(imageData);
    ctx.putImageData(imageData, 0, 0);

    const dataUrl = this.canvasEl.toDataURL('image/png');

    try {
      const { data } = await this.worker.recognize(dataUrl);
      const cards = this.extractCards(data.text);

      return {
        cards,
        raw: data.text,
        confidence: data.confidence,
        timestamp: Date.now()
      };
    } catch {
      return null;
    }
  }

  private enhanceContrast(imageData: ImageData) {
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      // Convert to grayscale and boost contrast
      const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
      const enhanced = avg > 128 ? Math.min(avg * 1.3, 255) : Math.max(avg * 0.7, 0);
      data[i] = enhanced;
      data[i + 1] = enhanced;
      data[i + 2] = enhanced;
    }
  }

  private extractCards(text: string): string[] {
    const found: string[] = [];
    const upper = text.toUpperCase().replace(/\s+/g, ' ');

    // Match card values
    const matches = upper.match(/\b(10|[2-9AKQJ])\b/g) || [];
    for (const match of matches) {
      const normalized = NORMALIZE_MAP[match] || match;
      if (normalized && !found.includes(normalized)) {
        found.push(normalized);
      }
    }

    return found;
  }

  async stopCamera() {
    this.stopScan();
    if (this.stream) {
      this.stream.getTracks().forEach(t => t.stop());
      this.stream = null;
    }
    if (this.worker) {
      await this.worker.terminate();
      this.worker = null;
    }
  }

  // Manual scan from uploaded image
  async scanImage(imageUrl: string): Promise<ScanResult | null> {
    if (!this.worker) await this.initialize();
    try {
      const { data } = await this.worker!.recognize(imageUrl);
      return {
        cards: this.extractCards(data.text),
        raw: data.text,
        confidence: data.confidence,
        timestamp: Date.now()
      };
    } catch {
      return null;
    }
  }
}

let scanEngine: CardScanEngine | null = null;
export function getScanEngine(): CardScanEngine {
  if (!scanEngine) scanEngine = new CardScanEngine();
  return scanEngine;
}
