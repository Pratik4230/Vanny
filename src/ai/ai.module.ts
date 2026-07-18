import { Module } from '@nestjs/common';
import { LlmService } from './llm.service';
import { PromptService } from './prompt.service';
import { SarvamSttService } from './sarvam-stt.service';
import { SarvamTtsService } from './sarvam-tts.service';

@Module({
  providers: [LlmService, PromptService, SarvamSttService, SarvamTtsService],
  exports: [LlmService, PromptService, SarvamSttService, SarvamTtsService],
})
export class AiModule {}
