import { GenerationInput, GenerationProvider } from './generationProvider';

type ProviderOptions = {
  baseUrl: string;
  apiKey?: string;
  modelName: string;
};

export class AnthropicCompatibleProvider implements GenerationProvider {
  constructor(private readonly options: ProviderOptions) {}

  async generate(input: GenerationInput): Promise<string> {
    const response = await fetch(`${this.options.baseUrl.replace(/\/$/, '')}/v1/messages`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': this.options.apiKey ?? '',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: this.options.modelName,
        max_tokens: 900,
        system: input.system,
        messages: [
          {
            role: 'user',
            content: input.prompt
          }
        ]
      })
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`provider request failed: ${response.status} ${text}`);
    }

    const data = (await response.json()) as {
      content?: Array<{ type: string; text?: string }>;
    };

    return (data.content ?? [])
      .filter((item) => item.type === 'text' && item.text)
      .map((item) => item.text)
      .join('\n')
      .trim();
  }
}
