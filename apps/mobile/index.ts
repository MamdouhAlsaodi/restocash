import { registerRootComponent } from "expo";

import App from "./src/App";

// registerRootComponent calls AppRegistry.registerComponent for native,
// and for web, it mounts the App component into the #root div in index.html.
// This is what makes the React app actually render to the DOM in browsers.
registerRootComponent(App);
