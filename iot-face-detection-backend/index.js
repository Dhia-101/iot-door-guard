require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const mqtt = require('mqtt');

const logger = require('./logger');

class FaceRecognitionServer {
    constructor() {
        this.app = express();
        this.server = http.createServer(this.app);
        this.io = new Server(this.server, {
            cors: {
                origin: "*",
                methods: ["GET", "POST"]
            }
        });

        this.mqttClient = null;
        this.detectionHistory = [];

        this.initializeMiddleware();
        this.setupRoutes();
        this.setupSocketIO();
        this.connectMQTT();
    }

    initializeMiddleware() {
        this.app.use(cors());
        this.app.use(express.json());
    }

    setupRoutes() {
        this.app.get('/api/detection-history', (req, res) => {
            res.json(this.detectionHistory);
        });
    }

    setupSocketIO() {
        this.io.on('connection', (socket) => {
            logger.info(`New client connected: ${socket.id}`);

            // Send recent detection history on connection
            socket.emit('detection-history', this.detectionHistory);

            socket.on('disconnect', () => {
                logger.info(`Client disconnected: ${socket.id}`);
            });
        });
    }

    connectMQTT() {
        try {
            this.mqttClient = mqtt.connect(process.env.MQTT_BROKER_URL);

            this.mqttClient.on('connect', () => {
                logger.info('Connected to MQTT Broker');
                this.mqttClient.subscribe(process.env.MQTT_TOPIC);
            });

            this.mqttClient.on('message', (topic, message) => {
                try {
                    const payload = message.toString();
                    const [name, confidence] = payload.split(':');

                    const detection = {
                        name,
                        confidence: parseFloat(confidence),
                        timestamp: new Date().toISOString()
                    };

                    // Store in detection history (limit to last 50 entries)
                    if (this.detectionHistory.length >= 50) {
                        this.detectionHistory.shift();
                    }
                    this.detectionHistory.push(detection);

                    // Broadcast to all connected socket clients
                    this.io.emit('face-detected', detection);

                    logger.info(`Face Detected: ${name} (${confidence}%)`);
                } catch (error) {
                    logger.error(`MQTT Message Processing Error: ${error.message}`);
                }
            });

            this.mqttClient.on('error', (error) => {
                logger.error(`MQTT Connection Error: ${error.message}`);
            });
        } catch (error) {
            logger.error(`MQTT Initialization Error: ${error.message}`);
        }
    }

    start() {
        const PORT = process.env.PORT || 3000;
        this.server.listen(PORT, () => {
            logger.info(`Server running on port ${PORT}`);
        });
    }
}

// Initialize and start the server
const server = new FaceRecognitionServer();
server.start();