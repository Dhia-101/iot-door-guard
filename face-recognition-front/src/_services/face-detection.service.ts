import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { BehaviorSubject, Observable } from 'rxjs';

interface Detection {
  name: string;
  confidence: number;
  timestamp: string;
}

@Injectable({
  providedIn: 'root'
})
export class FaceDetectionService {
  private socket: Socket;
  private detectionSubject = new BehaviorSubject<Detection[]>([]);
  private latestDetectionSubject = new BehaviorSubject<Detection | null>(null);

  constructor() {
    // Replace with your backend URL
    this.socket = io('http://localhost:3000', {
      transports: ['websocket']
    });

    // Listen for initial detection history
    this.socket.on('detection-history', (history: Detection[]) => {
      this.detectionSubject.next(history);
    });

    // Listen for new face detections
    this.socket.on('face-detected', (detection: Detection) => {
      const currentHistory = this.detectionSubject.value;
      const updatedHistory = [...currentHistory, detection];

      // Keep only the last 50 detections
      if (updatedHistory.length > 50) {
        updatedHistory.shift();
      }

      this.detectionSubject.next(updatedHistory);
      this.latestDetectionSubject.next(detection);
    });
  }

  // Observable for getting detection history
  getDetectionHistory(): Observable<Detection[]> {
    return this.detectionSubject.asObservable();
  }

  // Observable for latest detection
  getLatestDetection(): Observable<Detection | null> {
    return this.latestDetectionSubject.asObservable();
  }

  // Optional: method to disconnect when component is destroyed
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
    }
  }
}
