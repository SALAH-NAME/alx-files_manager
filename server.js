import express from 'express';
import routes from './routes/index';

const app = express();
const port = process.env.PORT || 5000;

app.use(express.json());

app.use('/', routes);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

// eslint-disable-next-line import/first, eol-last, import/extensions
import './worker.js';