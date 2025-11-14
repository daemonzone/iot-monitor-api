import express from "express";
import { pool } from "../db.js";
import { authenticateToken } from "../middleware/auth.js";
import { getSensors, getSensorsOffsets } from "../utils/sensor-queries.js";

const router = express.Router();

// List all sensors
router.get("/", authenticateToken, async (req, res) => {
  try {
    const results = await pool.query(getSensors);

    const sensors = [];

    for (const sensor of results.rows) {
      sensors.push(sensor); // <-- important!
    }

    res.json(sensors);
  } catch (err) {
    console.error(err);
    res.status(404).json({ error: "Not found" });
  }
});

// List all sensors offsets
router.get("/offsets", authenticateToken, async (req, res) => {
  try {
    const results = await pool.query(getSensorsOffsets);
    console.log(results);
    const sensors_offsets = {};

    for (const row of results.rows) {
      const { device_id, code, offset } = row;

      if (!sensors_offsets[device_id]) {
        sensors_offsets[device_id] = {};
      }

      sensors_offsets[device_id][code] = offset;
    }

    console.log("sensors_offsets", sensors_offsets);
    res.json(sensors_offsets);
  } catch (err) {
    console.error(err);
    res.status(404).json({ error: "Not found" });
  }
});

export default router;