import { registerRootComponent } from 'expo';

// Defines the background location task at global scope — required so the
// task exists when the OS relaunches the app headless for a location update.
import './src/backgroundLocation';

import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
