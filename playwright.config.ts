import {defineConfig} from '@playwright/test';
export default defineConfig({testDir:'tests/e2e',fullyParallel:false,use:{baseURL:'http://127.0.0.1:5173',headless:true,channel:process.env.PLAYWRIGHT_CHANNEL||undefined,launchOptions:{args:['--use-angle=swiftshader','--enable-webgl']}},webServer:{command:'npm run dev',url:'http://127.0.0.1:5173',reuseExistingServer:true,timeout:60000}});
