import { useEffect, useState } from 'react';
import { getSocket } from '../../../services/websocket';

export function useAdminSocket() {
  const [unassignedDevices, setUnassignedDevices] = useState<string[]>([]);

  useEffect(() => {
    const socket = getSocket();

    socket.connect();

    const onUnknownDeviceConnected = ({ hardwareId }: { hardwareId: string }) => {
      setUnassignedDevices((current) =>
        current.includes(hardwareId) ? current : [...current, hardwareId]
      );
    };

    socket.on('unknown-device-connected', onUnknownDeviceConnected);

    return () => {
      socket.off('unknown-device-connected', onUnknownDeviceConnected);
      socket.disconnect();
    };
  }, []);

  const resolveDevice = (hardwareId: string) => {
    setUnassignedDevices((current) => current.filter((id) => id !== hardwareId));
  };

  return { unassignedDevices, resolveDevice };
}
