import express from "express";
import { pool } from "../db.js";
import { authenticateToken } from "../middleware/auth.js";
import { getDeviceLastReading } from "../utils/device-readings.js";

const router = express.Router();

// List all devices
router.get("/", authenticateToken, async (req, res) => {
  try {
    const results = await pool.query(`
      SELECT d.*,
             r.id AS reading_id,
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
      ORDER BY d.id;
    `);

    const devices = [];

    for (const device of results.rows) {
      device.last_reading = getDeviceLastReading(device);      
      devices.push(device); // <-- important!
    }

    res.json(devices);
  } catch (err) {
    console.error(err);
    res.status(404).json({ error: "Not found" });
  }
});

// Single device
router.get("/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const results = await pool.query(`
      SELECT d.*,
             r.id AS reading_id,
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
      WHERE d.device_id = $1
    `, [id]);

    if (results.rows.length === 0) return res.status(404).json({ message: "Device not found" });

    const device = results.rows[0];
    device.last_reading = getDeviceLastReading(device);      

    res.json({ device });
  } catch (err) {
    console.error(err);
    res.status(404).json({ error: "Not found" });
  }
});

// Single device readings
router.get("/:id/readings", authenticateToken, async (req, res) => {
  const { id } = req.params;
  const timebucket = req.query.timebucket || "15 minutes";
  const start_date = req.query.start_date || new Date().toISOString().split("T")[0]; // default: today
  const end_date = req.query.end_data || new Date().toISOString();                     // default: now

  try {
    // Fetch all readings for today for a given device
    const readings = await pool.query(
      `
      WITH bucketed AS (
        SELECT
          time_bucket($2::interval, recorded_at) AS bucket,
          sensors_data
        FROM devices_readings
        WHERE device_id = $1
          AND recorded_at >= $3::timestamptz
          AND recorded_at <= $4::timestamptz
      )
      SELECT
        bucket,
        jsonb_agg(
          jsonb_build_object(
            'code', s.code,
            'name', s.name,
            'unit', s.unit,
            'value_type', s.value_type,
            'value', CASE s.value_type
                WHEN 'numeric' THEN to_jsonb(r.value::numeric)
                WHEN 'boolean' THEN to_jsonb(r.value::boolean)
                ELSE to_jsonb(r.value)
            END
          ) ORDER BY s.code
        ) AS sensors
      FROM bucketed b
      JOIN LATERAL jsonb_each_text(b.sensors_data) AS r(key, value) ON TRUE
      JOIN sensors s ON s.code = r.key
      GROUP BY bucket
      ORDER BY bucket DESC;
      `,
      [id, timebucket, start_date, end_date]
    );

    res.json({ readings: readings.rows });
  } catch (err) {
    console.error(err);
    res.status(404).json({ error: "Not found" });
  }
});


export default router;
