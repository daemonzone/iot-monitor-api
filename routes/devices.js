import express from "express";
import { pool } from "../db.js";
import { authenticateToken } from "../middleware/auth.js";
import { getDeviceLastReading } from "../utils/device-readings.js";
import { getDevices, getDeviceById, getDeviceReadingsBucketed } from '../utils/device-queries.js';

const router = express.Router();

// List all devices
router.get("/", authenticateToken, async (req, res) => {
  try {
    const results = await pool.query(getDevices);

    const devices = [];

    for (const device of results.rows) {
      device.image = ''; // for debug purpose
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
    const results = await pool.query(getDeviceById, [id]);

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
    const readings = await pool.query(getDeviceReadingsBucketed, [id, timebucket, start_date, end_date]);

    res.json({ readings: readings.rows });
  } catch (err) {
    console.error(err);
    res.status(404).json({ error: "Not found" });
  }
});


export default router;
