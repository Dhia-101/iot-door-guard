import {Component, OnDestroy, OnInit} from '@angular/core';
import {FaceDetectionService} from "../_services/face-detection.service";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {
  detectionHistory: any[] = [];
  latestDetection: any = null;

  constructor(private faceDetectionService: FaceDetectionService) {}

  ngOnInit() {
    // Subscribe to detection history
    this.faceDetectionService.getDetectionHistory()
      .subscribe((history: any[]) => {
        this.detectionHistory = history;
      });

    // Subscribe to latest detection
    this.faceDetectionService.getLatestDetection()
      .subscribe((detection: any) => {
        this.latestDetection = detection;
      });
  }

  ngOnDestroy() {
    // Optional: disconnect socket when component is destroyed
    this.faceDetectionService.disconnect();
  }
}
