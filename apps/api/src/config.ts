import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: Number(process.env.PORT ?? 8080),
  postgres: {
    host: process.env.POSTGRES_HOST ?? 'localhost',
    port: Number(process.env.POSTGRES_PORT ?? 5432),
    database: process.env.POSTGRES_DB ?? 'memory',
    user: process.env.POSTGRES_USER ?? 'memory',
    password: process.env.POSTGRES_PASSWORD ?? 'memory'
  },
  falkor: {
    url: process.env.FALKOR_URL ?? 'redis://default:password@localhost:6379',
    graph: process.env.FALKOR_GRAPH ?? 'memory'
  },
  model: {
    baseUrl: process.env.MODEL_BASE_URL ?? 'http://localhost:11434',
    apiKey: process.env.MODEL_API_KEY ?? '',
    modelName: process.env.MODEL_NAME ?? 'qwen2.5-coder:14b',
    useModel: String(process.env.USE_MODEL ?? 'false').toLowerCase() === 'true',
    providerType: process.env.PROVIDER_TYPE ?? 'ollama'
  }
};
