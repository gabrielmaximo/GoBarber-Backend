import { Router } from 'express';
import User from './app/models/User';

const routes = new Router();

routes.get('/', async (req, res) => {
  const user = await User.create({
    name: 'Gabriel Maximo',
    email: 'maximo@ufu.br',
    password_hash: '513a998n',
  });

  return res.json(user);
});

export default routes;
