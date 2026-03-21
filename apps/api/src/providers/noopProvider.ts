import { GenerationInput, GenerationProvider } from './generationProvider';

export class NoopProvider implements GenerationProvider {
  async generate(input: GenerationInput): Promise<string> {
    return [input.system, input.prompt].filter(Boolean).join('\n\n');
  }
}
