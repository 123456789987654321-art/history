import 'dotenv/config';
import {createApp} from './app';
const port=Number(process.env.PORT)||3001;
createApp(process.env.DATA_DIR).listen(port,process.env.HOST||'0.0.0.0',()=>console.log(`时空修复师 http://localhost:${port}`));
