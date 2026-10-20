export type AssetType = 'car' | 'truck' | 'motorcycle' | 'van' | 'personal';

export type DeviceStatus = 'moving' | 'stopped' | 'idle' | 'offline';

export interface Telemetry {
  latitude: number;
  longitude: number;
  speed: number; // km/h
  heading: number; // 0-360 deg
  altitude: number; // meters
  satellites: number;
  accuracy: number; // meters
  ignition: boolean; // ACC status
  batteryVoltage: number; // e.g. 12.6V
  backupBatteryPercent: number; // 0-100%
  gsmSignalPercent: number; // 0-100%
  odometer: number; // km
  engineTemp?: number; // C
  fuelLevelPercent?: number; // 0-100%
  lastUpdate: string; // ISO string
}

export interface LicenseInfo {
  licenseKey: string;
  planName: string;
  planDurationMonths: number;
  activatedAt: string;
  expiresAt: string;
  isExpired: boolean;
  status: 'active' | 'expiring_soon' | 'expired' | 'unlicensed';
  features: {
    smsAlerts: boolean;
    geofenceLimit: number;
    historyDays: number;
    remoteImmobilizer: boolean;
  };
}

export interface Device {
  id: string;
  imei: string; // 15-digit IMEI
  name: string; // e.g. "پژو ۲۰۷i سفید"
  plateNumber: string; // e.g. "۱۲ ب ۳۴۵ ایران ۲۲"
  model: string; // e.g. "Teltonika FMB920"
  assetType: AssetType;
  simNumber: string; // e.g. "09121234567"
  ownerName: string;
  status: DeviceStatus;
  engineCutOff: boolean; // relay state (immobilizer)
  telemetry: Telemetry;
  license: LicenseInfo;
  historyTrail: [number, number][]; // recent lat,lng points
  createdAt: string;
}

export interface LicensePackage {
  id: string;
  name: string;
  durationMonths: number;
  priceToman: number;
  originalPriceToman?: number;
  badge?: string;
  description: string;
  features: string[];
  popular?: boolean;
}

export interface Geofence {
  id: string;
  name: string;
  lat: number;
  lng: number;
  radiusMeters: number;
  assignedDeviceImeis: string[];
  alertOnExit: boolean;
  alertOnEnter: boolean;
}

export interface AlertNotification {
  id: string;
  deviceId: string;
  imei: string;
  deviceName: string;
  type: 'overspeed' | 'power_cut' | 'geofence' | 'vibration' | 'engine_cut' | 'sos';
  message: string;
  timestamp: string;
  read: boolean;
  severity: 'low' | 'medium' | 'high';
}

export type MapTileProvider = 'osm' | 'satellite' | 'dark' | 'streets';
