/* global google */
import '@types/google.picker';

declare global {
  interface Window {
    google?: typeof google;
  }
}
