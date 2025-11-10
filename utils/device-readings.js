export function getDeviceLastReading(device) {
  const raw = device.last_reading;

  if (!raw) return {};

  const sensors = Object.fromEntries(
    Object.entries(raw).map(([key, value]) => {
      if (typeof value === "string" && !isNaN(value)) {
        return [key, parseFloat(value)];
      }
      return [key, value];
    })
  );

  return {
    id: parseInt(device.reading_id),
    time: device.recorded_at ? device.recorded_at.toISOString() : null,
    ...sensors
  };
}