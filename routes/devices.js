import express from "express";
import { pool } from "../db.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

// List all devices
router.get("/", authenticateToken, async (req, res) => {
  try {
    const results = await pool.query(`
      SELECT d.*,
             r.id as reading_id,
             r.recorded_at,
             r.temperature,
             r.humidity
      FROM devices d
      LEFT JOIN LATERAL (
          SELECT id, recorded_at, temperature, humidity
          FROM devices_readings
          WHERE device_id = d.device_id
            AND (temperature IS NOT NULL OR humidity IS NOT NULL)
          ORDER BY recorded_at DESC
          LIMIT 1
      ) r ON true
      ORDER BY d.id
    `);

    const devices = [];

    for (const device of results.rows) {
      device.last_reading = {
        id: parseInt(device.reading_id),
        recorded_at: device.recorded_at.toISOString(),
        temperature: parseFloat(device.temperature),
        humidity: parseFloat(device.humidity)
      };
      
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
    const results = await pool.query(
      `SELECT d.*,
             r.id as reading_id,
             r.recorded_at,
             r.temperature,
             r.humidity
      FROM devices d
      LEFT JOIN LATERAL (
          SELECT id, recorded_at, temperature, humidity
          FROM devices_readings
          WHERE device_id = d.device_id
            AND (temperature IS NOT NULL OR humidity IS NOT NULL)
          ORDER BY recorded_at DESC
          LIMIT 1
      ) r ON true
      WHERE d.device_id = $1`,
      [id]
    );
    if (results.rows.length === 0) return res.status(404).json({ message: "Device not found" });

    const device = results.rows[0];

    device.last_reading = {
      id: parseInt(device.reading_id),
      time: device.recorded_at.toISOString(),
      temperature: parseFloat(device.temperature),
      humidity: parseFloat(device.humidity)
    };
    
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
      SELECT
          time_bucket($2::interval, recorded_at) AS time,
          ROUND(AVG(temperature)::numeric, 1) AS temperature,
          ROUND(AVG(humidity)::numeric, 1) AS humidity
      FROM devices_readings
      WHERE device_id = $1
        AND recorded_at >= $3::timestamptz
        AND recorded_at <= $4::timestamptz
        AND (temperature IS NOT NULL OR humidity IS NOT NULL)
      GROUP BY time
      ORDER BY time DESC;
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
