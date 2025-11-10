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
ORDER by d.id
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
`;

export const getDeviceReadingsBucketed = `
WITH bucketed AS (
  SELECT
    time_bucket($2::interval, recorded_at) AS bucket,
    id AS reading_id,
    recorded_at,
    sensors_data
  FROM devices_readings
  WHERE device_id = $1
    AND recorded_at >= $3::timestamptz
    AND recorded_at <= $4::timestamptz
),
sensor_values AS (
  SELECT
    b.bucket,
    s.code,
    s.name,
    s.unit,
    s.value_type,
    jsonb_build_object(
      'id', b.reading_id,
      'time', b.recorded_at,
      'value',
      CASE s.value_type
        WHEN 'numeric' THEN to_jsonb(r.value::numeric)
        WHEN 'boolean' THEN to_jsonb(r.value::boolean)
        ELSE to_jsonb(r.value)
      END
    ) AS reading
  FROM bucketed b
  JOIN LATERAL jsonb_each_text(b.sensors_data) AS r(key, value) ON TRUE
  JOIN sensors s ON s.code = r.key
)
SELECT
  bucket,
  jsonb_agg(
    jsonb_build_object(
      'sensor',
      jsonb_build_object(
        'code', code,
        'name', name,
        'unit', unit,
        'value_type', value_type
      ),
      'values',
      readings
    )
  ) AS sensors
FROM (
  SELECT
    bucket,
    code,
    name,
    unit,
    value_type,
    jsonb_agg(reading ORDER BY reading->>'time') AS readings
  FROM sensor_values
  GROUP BY bucket, code, name, unit, value_type
) t
GROUP BY bucket
ORDER BY bucket DESC
`;
