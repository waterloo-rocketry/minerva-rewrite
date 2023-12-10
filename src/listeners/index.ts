import { App } from '@slack/bolt';
import actions from './actions';
import commands from './commands';
import events from './events';
import messages from './messages';
import shortcuts from './shortcuts';
import views from './views';
import helpCommand from './commands/helpCommand';

const registerListeners = (app: App) => {
  actions.register(app);
  commands.register(app);
  helpCommand.register(app);
  events.register(app);
  messages.register(app);
  shortcuts.register(app);
  views.register(app);
};

export default registerListeners;
