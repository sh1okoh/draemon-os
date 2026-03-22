import { GenerationInput, GenerationProvider } from './generationProvider';

type ProviderOptions = {
  baseUrl: string;
  modelName: string;
};

export class OllamaProvider implements GenerationProvider {
  constructor(private readonly options: ProviderOptions) {}

  async generate(input: GenerationInput): Promise<string> {
    const response = await fetch(`${this.options.baseUrl.replace(/\/$/, '')}/api/chat`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        model: this.options.modelName,
        stream: false,
        messages: [
          { role: 'system', content: input.system },
          { role: 'user', content: input.prompt }
        ]
      })
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`ollama request failed: ${response.status} ${text}`);
    }

    const data = (await response.json()) as {
      message?: { content?: string };
    };

    return data.message?.content?.trim() ?? '';
  }
}
