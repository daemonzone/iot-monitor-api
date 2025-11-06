# 🌐 IoT Monitor Service

## ⚙️ Overview

This project combines firmware and software for microcontrollers, backend services, and monitoring tools.

### 🌐 IoT Monitor API
A **Node.js service** responsible for:
- Collecting and storing device telemetry into TimescaleDB
- Exposing REST endpoints to query device data and status

### Requirements / Tech Stack
- **Node.js**,
- **TimescaleDB**

---

## 📁 Repositories

The whole project is based on different components, split on several repositories

| Component                                                                            | Description                                                              |
|--------------------------------------------------------------------------------------|--------------------------------------------------------------------------|
| [iot-monitor-service](https://github.com/daemonzone/iot-monitor-service)             | Node.js **monitoring and control service**, interacting with the backend |  
| [iot-clients-esp8266-esp32](https://github.com/daemonzone/iot-clients-esp8266-esp32) | esp8266 / esp32 **C++ client sketches**                          |
| [iot-clients-node](https://github.com/daemonzone/iot-clients-node)                   | **Node.js clients** for newer Raspberry/OrangePi devices                 | 
| [iot-clients-node-legacy](https://github.com/daemonzone/iot-clients-node-legacy)     | Node.js clients for **older devices** (Armbian v3, mqtt4)                | 
| [iot-monitor-api](https://github.com/daemonzone/iot-monitor-api)                     | **API interface** to retrieve devices and telemetry from TimescaleDB     |
| [iot-monitor-dashboard](https://github.com/daemonzone/iot-monitor-dashboard)         | React **Web Dashboard** for device charts                                |

### 🛰️ IoT Monitor Service

A **Node.js service** responsible for:
- Identifying devices connected and allowed to send telemetry data
- Receiving telemetry from devices
- Persisting data into TimescaleDB
- Initializing database tables and hypertables
- _Sending commands to devices (wip)_

### 🧠 Wemos / ESP32 Clients
 - For IoT nodes based on **esp8266 / esp32** microcontrollers (i.e Wemos D1 mini)
 - Each device has its own unique identifier
 - Each device announces itself on a MQTT queue, being identified by the monitoring service.
 - Each device periodically publishes telemetry and status (e.g. temperature, humidity, status) to a per-device MQTT queue

### 💻 NodeJs Clients
Node.js based client code available for micro-computers (like Raspberry or Orange Pi)

### 🕹️ NodeJs Clients (legacy)
Node.js v10 based client code available for older micro-computers (running Armbian v3.4.113)

### 🖥️ IoT Monitor Dashboard
**React Web Interface** to:
  - Visualize real-time device status and historical telemetry  
  - Display charts for temperature, humidity, uptime, and other metrics  
  - Filter, sort, and explore devices and their readings  

---

## 🧰 Tech Stack

| Component | Technology             | Provider (with free plan) |
|------------|------------------------|---------------------------|
| Firmware | C++ (Arduino, ESP-IDF) | -                         |
| Backend / Monitor | Node.js                | -                         |
| Database | PostgreSQL + TimescaleDB | [Neon](https://neon.com/) | 
| Messaging | MQTT / Mosquitto      | [HiveMQ](https://www.hivemq.com/) |
| Dashboard | Node.js client or web app | -                         |

---

## 🚀 Getting Started

1. Clone the repository
   ```bash
   git clone https://github.com/daemonzone/iot-monitor-api.git
   cd iot-monitor-api

2. Install **iot-monitor-api** dependencies

   _**Requires node >= 20_
   ```
   cd iot-monitor-api
   npm install
   ```

3. Configure the environment
   Copy .env.example to .env and fill in with Database and MQTT parameters:

   ```
   PORT=3000
   DATABASE_URL=postgresql://user:password@localhost:5432/mydb
   JWT_SECRET=supersecretkey
   REFRESH_TOKEN_SECRET=anothersupersecretkey
   ACCESS_TOKEN_EXPIRY=1h    # 1 hour
   REFRESH_TOKEN_EXPIRY=30d  # 30 days
   ```
   
   You could generate the JWT and REFRESH tokens by issuing the following command
   
   ```
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```
   
 4. Create an admin password by executing the following command to get an hashed password
   ```
   node -e "console.log(require('bcrypt').hashSync('admin123', 10))"
   ```
   
   then copy / paste the generate hash to **routes/auth.js** 
   
   ```
   const users = [
     { id: 1, username: "admin", password: "$2b$10$I.77nggiLwBnmX2RZeXYiOnIBKXkR/QAG1v83WehFQNRQAqYMXf2G" }
   ];
   ```

   If you don't mind generating your own admin password, leave routes/auth.js untouched
   
   ```   
   Default credentials are: admin / admin123
   ```
5. Run the iot-monitor-service
   ```
   npm start
   ```

   ### 🚀 Console output

   ```
   > iot-monitor-api@1.0.0 start
   > node index.js
   
   [dotenv@17.2.3] injecting env (6) from .env -- tip: 🔐 prevent building .env in docker: https://dotenvx.com/prebuild
   [dotenv@17.2.3] injecting env (0) from .env -- tip: 🔐 prevent committing .env to code: https://dotenvx.com/precommit
   [dotenv@17.2.3] injecting env (0) from .env -- tip: 🔐 prevent committing .env to code: https://dotenvx.com/precommit
   [dotenv@17.2.3] injecting env (0) from .env -- tip: 🛠️  run anywhere with `dotenvx run -- yourcommand`
   Server running on port 3001   ...
   ```
---

## 🧑‍💻 Author

**Davide V.**  

IoT enthusiast and full-stack developer

📍 Italy  
📫 **GitHub:** [@daemonzone](https://github.com/daemonzone)  
📧 **Email:** daemonzone@users.noreply.github.com
