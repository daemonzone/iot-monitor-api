import express from "express";
import { pool } from "../db.js";
import { authenticateToken } from "../middleware/auth.js";
import { getSensors } from "../utils/sensor-queries.js";

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

export default router;