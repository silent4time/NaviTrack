import { Device, AlertNotification } from '../types/tracker';

// Real-world waypoints in Tehran highway corridors for smooth driving simulation
const TEHRAN_ROUTES: Record<string, [number, number][]> = {
  // Hemmat Eastbound corridor
  dev_1: [
    [35.7485, 51.3789],
    [35.7500, 51.3910],
    [35.7512, 51.4050],
    [35.7525, 51.4200],
    [35.7538, 51.4350],
    [35.7540, 51.4500],
    [35.7520, 51.4350],
    [35.7505, 51.4150],
    [35.7490, 51.3950],
    [35.7485, 51.3789],
  ],
  // Karaj Special Road Westbound
  dev_2: [
    [35.7010, 51.3340],
    [35.7025, 51.3180],
    [35.7040, 51.3000],
    [35.7060, 51.2800],
    [35.7080, 51.2600],
    [35.7060, 51.2800],
    [35.7035, 51.3100],
    [35.7010, 51.3340],
  ],
  // Valiasr / Motahari urban corridor
  dev_3: [
    [35.7192, 51.4080],
    [35.7220, 51.4082],
    [35.7260, 51.4085],
    [35.7310, 51.4090],
    [35.7360, 51.4095],
    [35.7310, 51.4090],
    [35.7240, 51.4083],
    [35.7192, 51.4080],
  ],
};

// Calculate heading angle (0-360) from point A to point B
export function calculateBearing(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const toDeg = (rad: number) => (rad * 180) / Math.PI;

  const y = Math.sin(toRad(lng2 - lng1)) * Math.cos(toRad(lat2));
  const x =
    Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
    Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(toRad(lng2 - lng1));
  const brng = toDeg(Math.atan2(y, x));
  return (brng + 360) % 360;
}

// Distance in kilometers
export function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Keep track of route step indexes
const routeProgress: Record<string, { currentIdx: number; t: number }> = {};

export function stepSimulation(
  devices: Device[],
  onNewAlert?: (alert: AlertNotification) => void
): Device[] {
  return devices.map((dev) => {
    // If device is offline or engine cut-off, don't move
    if (dev.status === 'offline' || dev.engineCutOff || dev.license.status === 'expired') {
      return {
        ...dev,
        telemetry: {
          ...dev.telemetry,
          speed: 0,
          ignition: dev.engineCutOff ? false : dev.telemetry.ignition,
          lastUpdate: new Date().toISOString(),
        },
      };
    }

    // If device is stopped, keep it stationary with slight GPS jitter or random restart
    if (dev.status === 'stopped') {
      return {
        ...dev,
        telemetry: {
          ...dev.telemetry,
          speed: 0,
          lastUpdate: new Date().toISOString(),
        },
      };
    }

    // Moving device: Interpolate along corridor
    const route = TEHRAN_ROUTES[dev.id] || [
      [dev.telemetry.latitude, dev.telemetry.longitude],
      [dev.telemetry.latitude + 0.005, dev.telemetry.longitude + 0.005],
      [dev.telemetry.latitude - 0.003, dev.telemetry.longitude + 0.008],
      [dev.telemetry.latitude, dev.telemetry.longitude],
    ];

    if (!routeProgress[dev.id]) {
      routeProgress[dev.id] = { currentIdx: 0, t: 0 };
    }

    const prog = routeProgress[dev.id];
    prog.t += 0.08; // movement step size

    if (prog.t >= 1) {
      prog.t = 0;
      prog.currentIdx = (prog.currentIdx + 1) % (route.length - 1);
    }

    const p1 = route[prog.currentIdx];
    const p2 = route[prog.currentIdx + 1] || route[0];

    const newLat = p1[0] + (p2[0] - p1[0]) * prog.t;
    const newLng = p1[1] + (p2[1] - p1[1]) * prog.t;
    const newHeading = Math.round(calculateBearing(p1[0], p1[1], p2[0], p2[1]));

    // Speed variation between 45 and 95 km/h
    const baseSpeed = dev.assetType === 'truck' ? 58 : dev.assetType === 'motorcycle' ? 52 : 75;
    const speedVariation = Math.sin(Date.now() / 3000) * 14;
    const currentSpeed = Math.max(25, Math.round(baseSpeed + speedVariation));

    // Check for random overspeed alert
    if (currentSpeed > 88 && Math.random() < 0.05 && onNewAlert) {
      onNewAlert({
        id: `alert_${Date.now()}`,
        deviceId: dev.id,
        imei: dev.imei,
        deviceName: dev.name,
        type: 'overspeed',
        message: `سرعت غیرمجاز: خودرو ${dev.name} با سرعت ${currentSpeed} km/h در حال حرکت است.`,
        timestamp: new Date().toISOString(),
        read: false,
        severity: 'medium',
      });
    }

    // Update trail
    const updatedTrail = [...dev.historyTrail];
    if (
      updatedTrail.length === 0 ||
      calculateDistanceKm(
        updatedTrail[updatedTrail.length - 1][0],
        updatedTrail[updatedTrail.length - 1][1],
        newLat,
        newLng
      ) > 0.02
    ) {
      updatedTrail.push([newLat, newLng]);
      if (updatedTrail.length > 50) {
        updatedTrail.shift();
      }
    }

    return {
      ...dev,
      status: 'moving',
      historyTrail: updatedTrail,
      telemetry: {
        ...dev.telemetry,
        latitude: Number(newLat.toFixed(6)),
        longitude: Number(newLng.toFixed(6)),
        speed: currentSpeed,
        heading: newHeading,
        ignition: true,
        odometer: Number((dev.telemetry.odometer + 0.03).toFixed(2)),
        lastUpdate: new Date().toISOString(),
      },
    };
  });
}
