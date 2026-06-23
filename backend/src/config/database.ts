import mongoose from 'mongoose';
import type { MongoMemoryServer } from 'mongodb-memory-server';
import { config } from './index';

let memoryServer: MongoMemoryServer | null = null;

export async function connectDatabase(): Promise<void> {
  let uri = config.mongodbUri;

  if (config.useMemoryDb) {
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    memoryServer = await MongoMemoryServer.create();
    uri = memoryServer.getUri('ai_interview');
    console.log('Using in-memory MongoDB (no Docker required)');
  }

  try {
    await mongoose.connect(uri);
    console.log('MongoDB connected successfully');
  } catch (error) {
    if (!config.useMemoryDb && config.env === 'development') {
      console.warn('Local MongoDB unavailable. Retrying with in-memory database...');
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      memoryServer = await MongoMemoryServer.create();
      uri = memoryServer.getUri('ai_interview');
      await mongoose.connect(uri);
      console.log('In-memory MongoDB connected (install Docker for persistent data)');
      return;
    }
    console.error('MongoDB connection error:', error);
    console.error('Tip: Start Docker and run docker-compose up -d, or set USE_MEMORY_DB=true in backend/.env');
    process.exit(1);
  }
}

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected');
});

process.on('SIGINT', async () => {
  await mongoose.disconnect();
  if (memoryServer) await memoryServer.stop();
  process.exit(0);
});
