// You shouldn't need to modify this file at all.

import { Slot } from "expo-router";

export default function LoginLayout() {
  // A slot layout just overrides the default layout to ensure that our screen background bleeds
  // into the status bar. We use it just for the login screen.
  return <Slot />;
}
