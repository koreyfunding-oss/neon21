'use client';

export type VoiceCommand =
  | { type: 'ADD_CARD'; card: string }
  | { type: 'HIT' }
  | { type: 'STAND' }
  | { type: 'DOUBLE' }
  | { type: 'RESET_SHOE' }
  | { type: 'UNKNOWN'; transcript: string };

const CARD_WORDS: Record<string, string> = {
  'ace': 'A', 'one': 'A',
  'two': '2', 'deuce': '2',
  'three': '3',
  'four': '4',
  'five': '5',
  'six': '6',
  'seven': '7',
  'eight': '8',
  'nine': '9',
  'ten': '10', 'face': '10',
  'jack': 'J', 'queen': 'Q', 'king': 'K',
  '2': '2', '3': '3', '4': '4', '5': '5',
  '6': '6', '7': '7', '8': '8', '9': '9',
  '10': '10', 'j': 'J', 'q': 'Q', 'k': 'K', 'a': 'A'
};

const ACTION_WORDS: Record<string, string> = {
  'hit': 'HIT', 'card': 'HIT',
  'stand': 'STAND', 'stay': 'STAND', 'stop': 'STAND',
  'double': 'DOUBLE', 'double down': 'DOUBLE',
  'reset': 'RESET_SHOE', 'shuffle': 'RESET_SHOE', 'new shoe': 'RESET_SHOE'
};

class VoiceEngine {
  private recognition: SpeechRecognition | null = null;
  private isListening = false;
  private onCommand: ((cmd: VoiceCommand) => void) | null = null;
  private onTranscript: ((t: string, final: boolean) => void) | null = null;
  private userProfile: string[] = []; // Trained phrases

  constructor() {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || (window as Window & { webkitSpeechRecognition?: typeof SpeechRecognition }).webkitSpeechRecognition;
      if (SpeechRecognition) {
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = 'en-US';
        this.setupHandlers();
      }
    }
  }

  isSupported(): boolean {
    return this.recognition !== null;
  }

  private setupHandlers() {
    if (!this.recognition) return;

    this.recognition.onresult = (event: SpeechRecognitionEvent) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0].transcript.toLowerCase().trim();

        if (this.onTranscript) {
          this.onTranscript(transcript, result.isFinal);
        }

        if (result.isFinal) {
          const cmd = this.parseCommand(transcript);
          if (this.onCommand) this.onCommand(cmd);
        }
      }
    };

    this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error !== 'no-speech') {
        console.error('[NEON21 Voice]', event.error);
      }
      // Auto-restart on error
      if (this.isListening) {
        setTimeout(() => this.recognition?.start(), 1000);
      }
    };

    this.recognition.onend = () => {
      if (this.isListening) {
        this.recognition?.start(); // Keep alive
      }
    };
  }

  parseCommand(transcript: string): VoiceCommand {
    const text = transcript.toLowerCase().trim();

    // Check for action commands first
    for (const [phrase, action] of Object.entries(ACTION_WORDS)) {
      if (text.includes(phrase)) {
        if (action === 'HIT') return { type: 'HIT' };
        if (action === 'STAND') return { type: 'STAND' };
        if (action === 'DOUBLE') return { type: 'DOUBLE' };
        if (action === 'RESET_SHOE') return { type: 'RESET_SHOE' };
      }
    }

    // Check for card names — "card king", "add five", "jack dealt", etc.
    const words = text.split(/\s+/);
    for (const word of words) {
      const normalized = CARD_WORDS[word];
      if (normalized) {
        return { type: 'ADD_CARD', card: normalized };
      }
    }

    // Multi-word card phrases
    for (const [phrase, card] of Object.entries(CARD_WORDS)) {
      if (phrase.includes(' ') && text.includes(phrase)) {
        return { type: 'ADD_CARD', card };
      }
    }

    return { type: 'UNKNOWN', transcript };
  }

  startListening(
    onCommand: (cmd: VoiceCommand) => void,
    onTranscript?: (t: string, final: boolean) => void
  ) {
    if (!this.recognition || this.isListening) return;
    this.onCommand = onCommand;
    this.onTranscript = onTranscript || null;
    this.isListening = true;
    this.recognition.start();
  }

  stopListening() {
    if (!this.recognition) return;
    this.isListening = false;
    this.recognition.stop();
  }

  // Voice profile training — stores sample phrases for calibration
  async trainSample(phrase: string) {
    this.userProfile.push(phrase);
    // In production: send to server for acoustic model adaptation
    localStorage.setItem('neon21_voice_profile', JSON.stringify(this.userProfile));
  }

  loadProfile() {
    if (typeof window === 'undefined') return;
    const stored = localStorage.getItem('neon21_voice_profile');
    if (stored) this.userProfile = JSON.parse(stored);
  }

  isProfileTrained(): boolean {
    return this.userProfile.length >= 8;
  }

  getTrainingProgress(): number {
    return Math.min(this.userProfile.length / 8, 1);
  }
}

// Singleton
let voiceEngine: VoiceEngine | null = null;
export function getVoiceEngine(): VoiceEngine {
  if (!voiceEngine) voiceEngine = new VoiceEngine();
  return voiceEngine;
}

export { VoiceEngine };
