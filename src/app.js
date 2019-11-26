import 'dotenv/config';
import './database/connection';

import express from 'express';
import { resolve } from 'path';
import cors from 'cors';
import Youch from 'youch';
import helmet from 'helmet';
import redis from 'redis';
import RateLimit from 'express-rate-limit';
import RateLimitRedis from 'rate-limit-redis';
import * as Sentry from '@sentry/node';
import 'express-async-errors';
import io from 'socket.io';
import http from 'http';

import routes from './routes';
import sentryConfig from './config/sentry';
import redisConfig from './config/redis';

class App {
  constructor() {
    this.app = express();
    this.server = http.Server(this.app);
    Sentry.init(sentryConfig);
    this.socket();
    this.middlewares();
    this.routes();
    this.exceptionHandler();

    this.connectedUsers = {};
  }

  middlewares() {
    this.app.use(Sentry.Handlers.requestHandler());
    this.app.disable('x-powered-by'); // this line disable x-powered-by for more secury
    this.app.use(helmet());
    this.app.use(cors({ origin: process.env.FRONT_URL || false }));
    this.app.use(express.json());
    this.app.use(
      '/files',
      express.static(resolve(__dirname, '..', 'tmp', 'uploads'))
    );

    this.app.use((req, res, next) => {
      req.io = this.io;
      req.connectedUsers = this.connectedUsers;

      next();
    });

    if (process.env.NODE_ENV !== 'development') {
      this.app.use(
        new RateLimit({
          store: new RateLimitRedis({
            client: redis.createClient(redisConfig),
          }),
          windowMs: 1000 * 60 * 15,
          max: 10,
        })
      );
    }
  }

  socket() {
    this.io = io(this.server);

    this.io.on('connection', socket => {
      const { user_id } = socket.handshake.query;
      this.connectedUsers[user_id] = socket.id;

      socket.on('disconnect', () => {
        delete this.connectedUsers[user_id];
      });
    });
  }

  routes() {
    this.app.use(routes);
    this.app.use(Sentry.Handlers.errorHandler());
  }

  exceptionHandler() {
    this.app.use(async (err, req, res, next) => {
      if (process.env.NODE_ENV === 'development') {
        const errors = await new Youch(err, req).toJSON();

        return res.status(500).json({ errors });
      }
      return res.status(500).json({ error: 'Internal server  Error' });
    });
  }
}

export default new App().app;
