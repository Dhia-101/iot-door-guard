// src/app/app.component.ts
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Detection, DoorStatus, FaceDetectionService } from "../_services/face-detection.service";
import { Subscription } from "rxjs";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {
  doorStatus: DoorStatus = 'closed';
  currentDetection: Detection | null = null;

  private statusSubscription: Subscription | null = null;
  private detectionSubscription: Subscription | null = null;

  constructor(private faceDetectionService: FaceDetectionService) {}

  ngOnInit() {
    this.statusSubscription = this.faceDetectionService.getDoorStatus()
      .subscribe(status => {
        this.doorStatus = status;

        // Clear detection when door closes
        if (status === 'closed') {
          this.currentDetection = null;
        }
      });

    this.detectionSubscription = this.faceDetectionService.getDetection()
      .subscribe(detection => {
        this.currentDetection = detection;
      });
  }

  ngOnDestroy() {
    this.statusSubscription?.unsubscribe();
    this.detectionSubscription?.unsubscribe();
    this.faceDetectionService.disconnect();
  }
}
