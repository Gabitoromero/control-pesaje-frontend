import { io, Socket } from 'socket.io-client';
import Cookies from 'js-cookie';

const URL = import.meta.env.VITE_SOCKET_URL || '';

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    // Read the token fresh at socket creation time so logout→login uses the correct token
    const token = Cookies.get('token');
    socket = io(URL, {
      auth: { token },
      autoConnect: false, // Connection managed manually by callers
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
    });
  }
  return socket;
};

/**
 * Destroys the current socket singleton: disconnects, removes all listeners,
 * and clears the internal reference. The next call to getSocket() will create
 * a fresh socket and re-read the cookie at that time.
 *
 * Call this on login and logout to prevent cross-user token leaks.
 */
export const resetSocket = (): void => {
  if (socket) {
    socket.disconnect();
    socket.removeAllListeners();
    socket = null;
  }
};
