import express from 'express';
import controllerRouting from './routes/index';

const app = express();
const serverPort = process.env.PORT || 5000;

app.use(express.json());
controllerRouting(app);

app.listen(serverPort, () => {
  console.log(`Server running on port ${serverPort}`);
});

export default app;
