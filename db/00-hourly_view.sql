CREATE OR REPLACE VIEW devices_readings_hourly AS
WITH readings_24h AS (
    SELECT
        r.device_id,
        date_trunc('hour', r.recorded_at) AS bucket,
        kv.key AS sensor,
        (kv.value)::numeric AS value
    FROM devices_readings r
    CROSS JOIN LATERAL jsonb_each_text(r.sensors_data) AS kv(key, value)
    WHERE r.recorded_at >= NOW() - INTERVAL '24 hours'
      AND kv.value ~ '^-?\d+(\.\d+)?$'
),
agg_per_sensor AS (
    SELECT
        device_id,
        bucket,
        sensor,
        AVG(value) AS avg_value,
        MIN(value) AS min_value,
        MAX(value) AS max_value
    FROM readings_24h
    GROUP BY device_id, bucket, sensor
)
SELECT
    d.device_id,
    d.model,
    d.ip_addr,
    d.location,    
    r.bucket,
    COALESCE(
        jsonb_agg(
            jsonb_build_object(
                'sensor', r.sensor,
                'avg', ROUND(r.avg_value, 2),
                'min', ROUND(r.min_value, 2),
                'max', ROUND(r.max_value, 2)
            ) ORDER BY r.sensor
        ) FILTER (WHERE r.sensor IS NOT NULL),
        '[]'::jsonb
    ) AS sensors
FROM devices d
LEFT JOIN agg_per_sensor r ON r.device_id = d.device_id
WHERE d.last_status_update >= NOW() - INTERVAL '24 hours'
GROUP BY d.device_id, d.model, d.ip_addr, d.location, r.bucket
ORDER BY d.model, d.device_id, r.bucket;
