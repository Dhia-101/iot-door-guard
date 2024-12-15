// src/_services/face-detection.service.ts
import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Detection {
  name: string;
  confidence: number;
  timestamp: string;
}

export type DoorStatus = 'closed' | 'open';

@Injectable({
  providedIn: 'root'
})
export class FaceDetectionService {
  private socket: Socket;
  private statusSubject = new BehaviorSubject<DoorStatus>('closed');
  private detectionSubject = new BehaviorSubject<Detection | null>(null);
  private timeoutId: any;

  constructor() {
    this.socket = io('http://localhost:3000', {
      transports: ['websocket']
    });

    // Listen for face detections
    this.socket.on('face-detected', (detection: Detection) => {
      this.statusSubject.next('open');
      this.detectionSubject.next(detection);
      this.resetTimeout();
    });

    // Optional: Add a mechanism to reset status after a period of inactivity
    this.socket.on('disconnect', () => {
      this.statusSubject.next('closed');
      this.detectionSubject.next(null);
      clearTimeout(this.timeoutId);
    });
  }

  private resetTimeout() {
    clearTimeout(this.timeoutId);
    this.timeoutId = setTimeout(() => {
      this.statusSubject.next('closed');
      this.detectionSubject.next(null);
    }, 5000);
  }

  getDoorStatus(): Observable<DoorStatus> {
    return this.statusSubject.asObservable();
  }

  getDetection(): Observable<Detection | null> {
    return this.detectionSubject.asObservable();
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
    }
    clearTimeout(this.timeoutId);
  }
}
