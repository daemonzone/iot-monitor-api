import express from "express";
import { query } from "../middleware/db.js";
import { authenticateToken } from "../middleware/auth.js";
import { getDashboardData } from "../utils/dashboard-queries.js";

const router = express.Router();

// Example: get aggregated metrics
router.get("/", authenticateToken, async (req, res) => {
  try {
    
    const readingsResult = await query(getDashboardData);

    const rows = readingsResult.rows;
    const devicesMap = new Map();

    rows.forEach(row => {
      const deviceId = row.device_id;
      const bucketTime = row.bucket; // make sure it's a JS Date or ISO string
      const sensors = row.sensors ? (Array.isArray(row.sensors) ? row.sensors : JSON.parse(row.sensors)) : [];

      if (!devicesMap.has(deviceId)) {
        devicesMap.set(deviceId, {
          device_id: deviceId,
          model: row.model,
          ip_addr: row.ip_addr,
          location: row.location,
          buckets: []
        });
      }

      const device = devicesMap.get(deviceId);

      if (bucketTime) {
        device.buckets.push({
          time: new Date(bucketTime).toISOString(), // standard ISO string
          sensors: sensors
        });
      }
    });
    
    const results = Array.from(devicesMap.values());

    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(404).json({ error: "Not found" });
  }
});

export default router;
