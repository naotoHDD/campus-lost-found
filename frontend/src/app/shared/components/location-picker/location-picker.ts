import { AfterViewInit, Component, EventEmitter, Input, OnDestroy, Output } from '@angular/core';
import * as L from 'leaflet';

export interface SelectedPosition { latitude: number; longitude: number; }

@Component({
  selector: 'app-location-picker',
  imports: [],
  templateUrl: './location-picker.html',
  styleUrl: './location-picker.scss'
})
export class LocationPicker implements AfterViewInit, OnDestroy {
  @Input() latitude = 36.8065;
  @Input() longitude = 10.1815;
  @Input() readonly = false;
  @Output() positionChange = new EventEmitter<SelectedPosition>();
  mapAvailable = true;
  private map?: L.Map;
  private marker?: L.Marker;

  ngAfterViewInit(): void {
    setTimeout(() => this.initializeMap());
  }

  ngOnDestroy(): void {
    this.map?.remove();
  }

  private initializeMap(): void {
    const element = document.getElementById(this.readonly ? 'detail-map' : 'location-picker-map');
    if (!element || element.dataset['initialized']) return;
    element.dataset['initialized'] = 'true';

    try {
      this.map = L.map(element).setView([this.latitude, this.longitude], 8);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(this.map);

      this.marker = L.marker([this.latitude, this.longitude]).addTo(this.map);

      if (!this.readonly) {
        this.map.on('click', (event: L.LeafletMouseEvent) => {
          this.setPosition(event.latlng.lat, event.latlng.lng);
        });
      }
    } catch {
      this.mapAvailable = false;
    }
  }

  useMyPosition(): void {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(position => {
      this.setPosition(position.coords.latitude, position.coords.longitude);
      if (this.map) this.map.setView([this.latitude, this.longitude], 15);
    });
  }

  private setPosition(latitude: number, longitude: number): void {
    this.latitude = Number(latitude.toFixed(6));
    this.longitude = Number(longitude.toFixed(6));
    if (this.marker) this.marker.setLatLng([this.latitude, this.longitude]);
    this.positionChange.emit({ latitude: this.latitude, longitude: this.longitude });
  }
}
