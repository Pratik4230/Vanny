import { BadGatewayException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

export interface StreamTextInput {
  instructions: string;
  input: string;
}

@Injectable()
export class LlmService {
  private readonly client: OpenAI;
  private readonly model: string;

  constructor(private readonly config: ConfigService) {
    this.client = new OpenAI({
      apiKey: this.config.getOrThrow<string>('OPENAI_API_KEY'),
    });
    this.model = this.config.getOrThrow<string>('OPENAI_MODEL');
  }

  async *streamText({
    instructions,
    input,
  }: StreamTextInput): AsyncGenerator<string> {
    try {
      const stream = await this.client.responses.create({
        model: this.model,
        instructions,
        input,
        reasoning: { effort: 'none' },
        stream: true,
      });

      for await (const event of stream) {
        if (event.type === 'response.output_text.delta') {
          yield event.delta;
        }
      }
    } catch {
      throw new BadGatewayException('OpenAI streaming request failed');
    }
  }
}
