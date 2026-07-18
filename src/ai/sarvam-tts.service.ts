import { BadGatewayException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SarvamAIClient } from 'sarvamai';
import {
  SARVAM_TTS_CODEC,
  SARVAM_TTS_MODEL,
  type InterviewSpeaker,
} from './sarvam.constants';

export interface TtsStreamInput {
  text: string;
  language: 'en-IN' | 'hi-IN';
  speaker: InterviewSpeaker;
}

@Injectable()
export class SarvamTtsService {
  private readonly client: SarvamAIClient;
  private readonly apiKey: string;

  constructor(config: ConfigService) {
    this.apiKey = config.getOrThrow<string>('SARVAM_API_KEY');
    this.client = new SarvamAIClient({
      apiSubscriptionKey: this.apiKey,
    });
  }

  async streamSpeech(
    input: TtsStreamInput,
    onAudio: (chunk: Buffer) => void,
  ): Promise<void> {
    type ConnectArgs = Parameters<
      SarvamAIClient['textToSpeechStreaming']['connect']
    >[0];

    // The current SDK's connect type still lists Bulbul v2, while Sarvam's
    // official streaming documentation and runtime support Bulbul v3.
    const connectArgs = {
      model: SARVAM_TTS_MODEL,
      send_completion_event: true,
      'Api-Subscription-Key': this.apiKey,
    } as unknown as ConnectArgs;

    const socket = await this.client.textToSpeechStreaming.connect(connectArgs);

    return new Promise<void>((resolve, reject) => {
      let settled = false;

      const finish = () => {
        if (settled) return;
        settled = true;
        socket.close();
        resolve();
      };

      const fail = (message: string) => {
        if (settled) return;
        settled = true;
        socket.close();
        reject(new BadGatewayException(message));
      };

      socket.on('message', (message) => {
        try {
          if (message.type === 'audio') {
            onAudio(Buffer.from(message.data.audio, 'base64'));
            return;
          }

          if (message.type === 'event' && message.data.event_type === 'final') {
            finish();
            return;
          }

          if (message.type === 'error') {
            fail(message.data.message);
          }
        } catch {
          fail('Failed to process Sarvam audio');
        }
      });

      socket.on('error', () => {
        fail('Sarvam TTS streaming request failed');
      });

      socket.on('close', (event) => {
        if (!settled && event.code !== 1000) {
          fail(`Sarvam TTS connection closed with code ${event.code}`);
        }
      });

      socket
        .waitForOpen()
        .then(() => {
          socket.configureConnection({
            target_language_code: input.language,
            speaker: input.speaker,
            output_audio_codec: SARVAM_TTS_CODEC,
            speech_sample_rate: 24000,
            pace: 1,
            min_buffer_size: 30,
            max_chunk_length: 200,
          });
          socket.convert(input.text);
          socket.flush();
        })
        .catch(() => {
          fail('Failed to open Sarvam TTS connection');
        });
    });
  }
}
