import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import WebSocket, { RawData } from 'ws';

export type SttLanguage = 'en-IN' | 'hi-IN';

export interface SttSessionHandlers {
  onTranscript: (text: string) => void;
  onSpeechStart: () => void;
  onSpeechEnd: () => void;
  onError: (error: Error) => void;
}

export interface SttSession {
  sendAudio(chunk: Buffer): void;
  flush(): void;
  close(): void;
}

type SttMessage =
  | { type: 'data'; data: { transcript: string } }
  | {
      type: 'events';
      data: { signal_type?: 'START_SPEECH' | 'END_SPEECH' };
    }
  | { type: 'error'; data: { message: string } };

@Injectable()
export class SarvamSttService {
  private readonly apiKey: string;

  constructor(config: ConfigService) {
    this.apiKey = config.getOrThrow<string>('SARVAM_API_KEY');
  }

  createSession(
    language: SttLanguage,
    handlers: SttSessionHandlers,
  ): Promise<SttSession> {
    const query = new URLSearchParams({
      'language-code': language,
      model: 'saaras:v3',
      mode: 'codemix',
      input_audio_codec: 'pcm_s16le',
      sample_rate: '16000',
      high_vad_sensitivity: 'true',
      vad_signals: 'true',
      flush_signal: 'true',
    });

    const socket = new WebSocket(
      `wss://api.sarvam.ai/speech-to-text/ws?${query.toString()}`,
      [`api-subscription-key.${this.apiKey}`],
    );

    let manuallyClosed = false;

    socket.on('message', (data) => {
      this.handleMessage(data, handlers);
    });

    socket.on('error', () => {
      handlers.onError(new Error('Sarvam STT streaming request failed'));
    });

    socket.on('close', (code) => {
      if (!manuallyClosed && code !== 1000) {
        handlers.onError(
          new Error(`Sarvam STT connection closed with code ${code}`),
        );
      }
    });

    return new Promise<SttSession>((resolve, reject) => {
      socket.once('open', () => {
        resolve({
          sendAudio: (chunk) => {
            if (socket.readyState !== WebSocket.OPEN) {
              throw new Error('Sarvam STT connection is not open');
            }

            socket.send(
              JSON.stringify({
                audio: {
                  data: chunk.toString('base64'),
                  sample_rate: 16000,
                  encoding: 'audio/wav',
                },
              }),
            );
          },
          flush: () => {
            if (socket.readyState === WebSocket.OPEN) {
              socket.send(JSON.stringify({ type: 'flush' }));
            }
          },
          close: () => {
            manuallyClosed = true;
            socket.close(1000);
          },
        });
      });

      socket.once('error', () => {
        reject(new Error('Failed to open Sarvam STT connection'));
      });
    });
  }

  private handleMessage(data: RawData, handlers: SttSessionHandlers) {
    try {
      const text = Array.isArray(data)
        ? Buffer.concat(data).toString('utf8')
        : Buffer.isBuffer(data)
          ? data.toString('utf8')
          : Buffer.from(data).toString('utf8');
      const message = JSON.parse(text) as SttMessage;

      if (message.type === 'data') {
        handlers.onTranscript(message.data.transcript);
        return;
      }

      if (message.type === 'events') {
        if (message.data.signal_type === 'START_SPEECH') {
          handlers.onSpeechStart();
        } else if (message.data.signal_type === 'END_SPEECH') {
          handlers.onSpeechEnd();
        }
        return;
      }

      if (message.type === 'error') {
        handlers.onError(new Error(message.data.message));
      }
    } catch {
      handlers.onError(new Error('Failed to process Sarvam STT response'));
    }
  }
}
