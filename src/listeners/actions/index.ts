import { App } from '@slack/bolt';
import buttonClickCallback from './buttonClick';

const register = (app: App) => {
  app.action('button_click', buttonClickCallback);
};

export default { register };
