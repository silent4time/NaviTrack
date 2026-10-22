import React, { useState } from 'react';
import { Geofence, Device } from '../types/tracker';
import { StorageService } from '../services/storage';
import { X, Shield, Plus, Trash2, MapPin } from 'lucide-react';

interface GeofenceManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  geofences: Geofence[];
  devices: Device[];
  onGeofencesUpdated: () => void;
}

export const GeofenceManagerModal: React.FC<GeofenceManagerModalProps> = ({
  isOpen,
  onClose,
  geofences,
  devices,
  onGeofencesUpdated,
}) => {
  const [name, setName] = useState('');
  const [lat, setLat] = useState('35.7350');
  const [lng, setLng] = useState('51.4000');
  const [radiusMeters, setRadiusMeters] = useState(1500);
  const [selectedImeis, setSelectedImeis] = useState<string[]>([]);
  const [alertOnExit, setAlertOnExit] = useState(true);
  const [alertOnEnter, setAlertOnEnter] = useState(true);

  if (!isOpen) return null;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || selectedImeis.length === 0) return;

    const geo: Geofence = {
      id: `geo_${Date.now()}`,
      name: name.trim(),
      lat: parseFloat(lat) || 35.735,
      lng: parseFloat(lng) || 51.4,
      radiusMeters,
      assignedDeviceImeis: selectedImeis,
      alertOnExit,
      alertOnEnter,
    };

    StorageService.addGeofence(geo);
    onGeofencesUpdated();
    setName('');
    setSelectedImeis([]);
  };

  const handleDelete = (id: string) => {
    StorageService.deleteGeofence(id);
    onGeofencesUpdated();
  };

  const toggleImei = (imei: string) => {
    setSelectedImeis((prev) =>
      prev.includes(imei) ? prev.filter((i) => i !== imei) : [...prev, imei]
    );
  };

  return (
    <div className="fixed inset-0 z-[650] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-[#0f172a] border border-slate-700 rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-cyan-400" />
            <div>
              <h2 className="text-base font-semibold text-white">حصارهای جغرافیایی</h2>
              <p className="text-xs text-slate-400">تعریف محدوده و هشدار ورود/خروج</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded hover:bg-slate-800 text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-5 space-y-5">
          {/* Existing Geofences */}
          <div>
            <h3 className="text-sm font-medium text-slate-300 mb-2">حصارهای تعریف‌شده</h3>
            {geofences.length === 0 ? (
              <div className="text-xs text-slate-500 py-4 text-center">هنوز حصاری تعریف نشده است.</div>
            ) : (
              <div className="space-y-2">
                {geofences.map((g) => (
                  <div key={g.id} className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-lg px-3 py-2">
                    <div>
                      <div className="text-sm text-white font-medium">{g.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        شعاع {g.radiusMeters}m • {g.assignedDeviceImeis.length} دستگاه
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(g.id)}
                      className="p-1.5 text-red-400 hover:bg-red-500/10 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add Form */}
          <form onSubmit={handleAdd} className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
            <h3 className="text-sm font-medium text-white flex items-center gap-1.5">
              <Plus className="w-4 h-4" /> افزودن حصار جدید
            </h3>

            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="نام حصار (مثلاً محدوده شرکت)"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
              required
            />

            <div className="grid grid-cols-3 gap-2">
              <input
                value={lat}
                onChange={(e) => setLat(e.target.value)}
                placeholder="عرض جغرافیایی"
                className="bg-slate-950 border border-slate-700 rounded-lg px-2 py-2 text-xs font-mono"
              />
              <input
                value={lng}
                onChange={(e) => setLng(e.target.value)}
                placeholder="طول جغرافیایی"
                className="bg-slate-950 border border-slate-700 rounded-lg px-2 py-2 text-xs font-mono"
              />
              <input
                type="number"
                value={radiusMeters}
                onChange={(e) => setRadiusMeters(Number(e.target.value))}
                placeholder="شعاع (متر)"
                className="bg-slate-950 border border-slate-700 rounded-lg px-2 py-2 text-xs"
              />
            </div>

            <div>
              <div className="text-xs text-slate-400 mb-1.5">دستگاه‌های مرتبط:</div>
              <div className="flex flex-wrap gap-1.5">
                {devices.map((d) => (
                  <button
                    key={d.imei}
                    type="button"
                    onClick={() => toggleImei(d.imei)}
                    className={`px-2 py-1 rounded text-[10px] border ${
                      selectedImeis.includes(d.imei)
                        ? 'bg-cyan-600/20 border-cyan-500 text-cyan-300'
                        : 'bg-slate-800 border-slate-700 text-slate-400'
                    }`}
                  >
                    {d.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-4 text-xs">
              <label className="flex items-center gap-1.5 text-slate-300">
                <input type="checkbox" checked={alertOnEnter} onChange={(e) => setAlertOnEnter(e.target.checked)} />
                هشدار ورود
              </label>
              <label className="flex items-center gap-1.5 text-slate-300">
                <input type="checkbox" checked={alertOnExit} onChange={(e) => setAlertOnExit(e.target.checked)} />
                هشدار خروج
              </label>
            </div>

            <button
              type="submit"
              className="w-full py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-medium rounded-lg"
            >
              ذخیره حصار
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
