import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SliderComponent } from './components/slider/slider.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet,SliderComponent],
  template : `<app-slider></app-slider>`,
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'angular-slider';
}
