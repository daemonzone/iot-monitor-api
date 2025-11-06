import express from "express";
import { pool } from "../db.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

// Example: get aggregated metrics
router.get("/", authenticateToken, async (req, res) => {
  try {
    
    // Fetch all raw readings from last day
    const readingsResult = await pool.query(`
      SELECT device_id, recorded_at, temperature
      FROM devices_readings
      WHERE recorded_at > NOW() - INTERVAL '1 day'
      ORDER BY device_id, recorded_at
    `);

    // Group readings by device
    const readingsByDevice = {};
    readingsResult.rows.forEach(row => {
      if (!readingsByDevice[row.device_id]) readingsByDevice[row.device_id] = [];
      readingsByDevice[row.device_id].push({
        recorded_at: row.recorded_at,
        temperature: parseFloat(row.temperature)
      });
    });

    // Fetch aggregated data (1h time buckets)
    const aggregatesResult = await pool.query(`
      SELECT 
        device_id,
        time_bucket('1 hour', recorded_at) AS bucket,
        AVG(temperature) AS avg_temperature,
        MIN(temperature) AS min_temperature,
        MAX(temperature) AS max_temperature,
        COUNT(*) AS readings_count
      FROM devices_readings
      WHERE recorded_at > NOW() - INTERVAL '1 day'
      GROUP BY device_id, bucket
      ORDER BY device_id, bucket
    `);

    // Group aggregates by device
    const aggregatesByDevice = {};
    aggregatesResult.rows.forEach(row => {
      if (!aggregatesByDevice[row.device_id]) aggregatesByDevice[row.device_id] = [];
      aggregatesByDevice[row.device_id].push({
        bucket: row.bucket,
        avg_temperature: parseFloat(row.avg_temperature),
        min_temperature: parseFloat(row.min_temperature),
        max_temperature: parseFloat(row.max_temperature),
        readings_count: parseInt(row.readings_count, 10)
      });
    });

    // Combine both into a single JSON
    const devices = {};
    Object.keys(readingsByDevice).forEach(deviceId => {
      devices[deviceId] = {
        readings: readingsByDevice[deviceId],
        aggregates: aggregatesByDevice[deviceId] || []
      };
    });

    res.json(devices);
  } catch (err) {
    console.error(err);
    res.status(404).json({ error: "Not found" });
  }
});

export default router;
