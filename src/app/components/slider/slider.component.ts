import {
  Component,
  OnInit,
  Renderer2,
  ElementRef,
  viewChild,
  effect,
  computed,
} from '@angular/core';
import { NgClass } from '@angular/common';
import { DialogService } from '../../services/dialog.service';
import { CarouselService } from '../../services/carousel.service';

@Component({
  selector: 'app-slider',
  templateUrl: './slider.component.html',
  styleUrls: ['./slider.component.css'],
  imports: [NgClass],
  standalone: true,
})
export class SliderComponent implements OnInit {

  items = computed(() => this.carouselService.items());
  selectedItemIndex = computed(() => this.carouselService.selectedItemIndex());
  isWinner = computed(() => this.carouselService.isWinner());
  dialogTitle = computed(() => this.carouselService.dialogTitle());
  showDialog = computed(() => this.carouselService.showDialog()); //To show dialog and show message when stop
  enableButton = computed(() => this.carouselService.enableButton());
  dialog = viewChild<ElementRef>('dialog'); //Get to the dialog
  carouselList = viewChild<ElementRef>('carouselList'); //Get to the carousel list

  // fire =====================================def=====================================

  constructor(
    private renderer: Renderer2,

    public carouselService: CarouselService
  ) {
    effect(() => {
      this.showDialog() ? this.openDialog() : this.closeDialog();
    });
  }

  ngOnInit() {
    this.initCarousel();
  }
  private initCarousel() {
    this.carouselService.initCarousel(
      this.getCarouselList,
      this.renderer
    );
  }

  start() {
    this.carouselService.start();
  }


  get getCarouselList(): HTMLElement {
    return this.carouselList()?.nativeElement;
  }


  isCenterItem(index: number): boolean {
    return this.carouselService.isCenterItem(index);
  }

  closeDialog() {
    this.dialog()?.nativeElement.close();
  }
  openDialog() {
    this.dialog()?.nativeElement.showModal();
  }
}
