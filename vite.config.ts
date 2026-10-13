import { defineConfig } from 'vite';
export default defineConfig({server:{proxy:{'/api':'http://127.0.0.1:3001'}},test:{include:['tests/**/*.test.ts']}} as Parameters<typeof defineConfig>[0]);
