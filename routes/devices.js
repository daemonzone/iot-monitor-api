import express from "express";
import { pool } from "../db.js";
import { authenticateToken } from "../middleware/auth.js";
import { getDeviceLastReading } from "../utils/device-readings.js";
import { getDevices, getDeviceById, getDeviceByIdWithSensors, getBucketedDeviceReadings } from '../utils/device-queries.js';

const router = express.Router();

// List all devices
router.get("/", authenticateToken, async (req, res) => {
  try {
    const results = await pool.query(getDevices);

    const devices = [];

    for (const device of results.rows) {
      // device.image = ''; // for debug purpose
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
  const device = (await pool.query(getDeviceByIdWithSensors, [id])).rows[0];
  console.log("Device:", device);
  if (!device) return res.status(404).json({ message: "Device not found" });
  
  const readings = [];
  try {
    for (const sensor of device.sensors) {
      if (!sensor.id) continue;

      if (sensor.value_type == 'numeric') {
        const results = await pool.query(getBucketedDeviceReadings, [id, sensor.code, timebucket, start_date, end_date]);
        const sensor_readings = {
          sensor,
          buckets: results.rows
        }

        readings.push(sensor_readings);
      }
    }

    res.json({ readings });
  } catch (err) {
    console.error(err);
    res.status(404).json({ error: "Not found" });
  }
});


export default router;
