export type GenerationInput = {
  system: string;
  prompt: string;
};

export interface GenerationProvider {
  generate(input: GenerationInput): Promise<string>;
}
