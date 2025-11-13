export const getDevices = `
SELECT d.*,
       r.id as reading_id,
       r.recorded_at,
       r.sensors_data as last_reading
FROM devices d
LEFT JOIN LATERAL (
    SELECT id, recorded_at, sensors_data
    FROM devices_readings
    WHERE device_id = d.device_id
      AND sensors_data IS NOT NULL
    ORDER BY recorded_at DESC
    LIMIT 1
) r ON TRUE
ORDER by d.model, device_id;
`;

export const getDeviceById = `
SELECT d.*,
       r.id as reading_id,
       r.recorded_at,
       r.sensors_data as last_reading
FROM devices d
LEFT JOIN LATERAL (
    SELECT id, recorded_at, sensors_data
    FROM devices_readings
    WHERE device_id = $1
      AND sensors_data IS NOT NULL
    ORDER BY recorded_at DESC
    LIMIT 1
) r ON TRUE
WHERE d.device_id = $1
LIMIT 1
`;

export const getDeviceByIdWithSensors = `
SELECT 
    d.device_id,
    d.model,
    d.ip_addr,
    jsonb_agg(
        jsonb_build_object(
            'id', s.id,
            'code', s.code,
            'name', s.name,
            'unit', s.unit,
            'value_type', s.value_type
        ) ORDER BY s.id
    ) AS sensors
FROM devices d
LEFT JOIN sensors s ON s.code = ANY (SELECT jsonb_array_elements_text(d.sensors))
WHERE d.device_id = $1
GROUP BY d.device_id, d.model, d.ip_addr
LIMIT 1
`;

export const getBucketedDeviceReadings = `
SELECT
  time_bucket($3::interval, dr.recorded_at) AS time,
  ROUND(AVG(r.value::numeric), 1) AS value
FROM devices_readings dr
JOIN devices d ON d.device_id = dr.device_id
JOIN LATERAL jsonb_each_text(dr.sensors_data) AS r(key, value) ON TRUE
JOIN sensors s ON s.code = r.key
WHERE dr.device_id = $1
  AND s.code = $2
  AND s.value_type = 'numeric'
  AND dr.recorded_at >= $4::timestamptz
  AND dr.recorded_at <= $5::timestamptz
GROUP BY time
ORDER BY time ASC
`;
