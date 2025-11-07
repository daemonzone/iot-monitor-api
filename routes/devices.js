import express from "express";
import { pool } from "../db.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

// List all devices
router.get("/", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM devices ORDER BY id");
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(404).json({ error: "Not found" });
  }
});

// Single device + last 10 readings
router.get("/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const results = await pool.query(
      `SELECT 
          id,
          device_id,
          model,
          ip_addr,
          uptime,
          status,
          last_status_update,
          first_registration_timestamp,
          deleted,
          location
       FROM devices
       WHERE device_id = $1`,
      [id]
    );
    if (results.rows.length === 0) return res.status(404).json({ message: "Device not found" });

    const device = results.rows[0];

    // Fetch all readings for today for a given device
    const readings = await pool.query(
      `
      SELECT id, recorded_at, temperature, humidity
      FROM devices_readings
      WHERE device_id = $1 
        AND recorded_at >= CURRENT_DATE
        AND (temperature IS NOT NULL or humidity IS NOT NULL)
      ORDER BY recorded_at DESC
      `,
      [device.device_id]
    );

    res.json({ device: device, readings: readings.rows });
  } catch (err) {
    console.error(err);
    res.status(404).json({ error: "Not found" });
  }
});

export default router;
