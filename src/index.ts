import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import useRouter from './utils/route/routeHandler';
import setupEmailRoutes from './routes/email';
import withErrorHandling from './utils/route/withErrorHandling';
import { homePage } from './pages/home';
import { testPage } from './pages/test';

const app = express();
app.use((req, res, next) => {
  // Force browser to use HTTP, not HTTPS
  if (req.headers['x-forwarded-proto'] === 'https') {
    return res.redirect('http://' + req.headers.host + req.url);
  }
  next();
});

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'"],
      imgSrc: ["'self'"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
}));
app.use(morgan('combined'));
app.use(express.json());
app.use(express.static('public'));

const router = useRouter(app);

router({
  method: 'get',
  path: '/',
  handler: withErrorHandling(homePage)
});

router({
  method: 'get',
  path: '/test',
  handler: withErrorHandling(testPage)
});

router({
  method: 'get',
  path: '/health',
  handler: withErrorHandling(async (event) => ({ status: 'ok' }))
});

setupEmailRoutes(app);

app.listen(8888);