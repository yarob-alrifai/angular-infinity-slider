import {
  Component,
  OnInit,
  Renderer2,
  ElementRef,
  signal,
  viewChild,
} from '@angular/core';

import { CommonModule } from '@angular/common';

interface Item {
  key: number;
}
@Component({
  selector: 'app-slider',
  templateUrl: './slider.component.html',
  styleUrls: ['./slider.component.css'],
  standalone: true,
  imports: [CommonModule],
  animations: [],
})
export class SliderComponent implements OnInit {
  // green =====================================def=====================================
  // orange we can change the next as we want

  transformValue = signal('translateX(0)');
  itemsNumber = signal(10); //Items number
  visibleItemsCount = signal(5); // Number of visible items on the screen, we can change it as we want
  winningBlock = signal(5); //Winning block
  // orange we can change the prev as we want
  // blue====our data
  ourDate = signal<Item[]>(
    Array.from({ length: this.itemsNumber() }, (_, i) => ({ key: i + 1 }))
  ); //Gerate our items
  items = signal<Item[]>([]); //To display on the screen
  data = [...this.ourDate()]; //We will use it to add items every time to our items array
  helper = this.ourDate(); //For reset the items when stop
  // blue====our data
  currentIndex = signal<number>(Math.floor(this.visibleItemsCount() / 2)); //Started index
  selectedItemIndex = signal(-1); //Random slected item to stop on it
  isWinner = signal<boolean>(false); //Use it in the dialog
  dialogTitle = signal<string>(''); //Dialog title we will change it then
  showDialog = signal<boolean>(false); //To show dialog and show message when stop
  enableButton = signal(true);

  dialog = viewChild<ElementRef>('dialog'); //Get to the dialog
  carouselList = viewChild<ElementRef>('carouselList'); //Get to the carousel list
  speed = signal(0.5);
  index = signal(2);
  counter = signal(0);
  howMany = signal(0);
  stepSpeed = signal(0.1);
  maxSpeed = signal(0.2);
  minSpeed = signal(0.5);

  selectedItemOffset = signal(0);
  // fire =====================================def=====================================

  constructor(private renderer: Renderer2) {}

  ngOnInit() {
    this.initCarousel();
  }

  initCarousel() {
    let endSlicee = signal(this.visibleItemsCount() + 2);
    this.items.set(this.ourDate().slice(0, endSlicee()));
    this.data.splice(0, endSlicee());

    this.applyStyles();
    this.firstRotateCarousel();
  }

  firstRotateCarousel() {
    const transformValue = `translateX(${
      (-(this.currentIndex() - Math.floor(this.visibleItemsCount() / 2)) *
        100) /
      this.visibleItemsCount()
    }%)`;
    this.renderer.setStyle(
      this.carouselList()?.nativeElement,
      'transform',
      transformValue
    );
  }

  alignToSelectedItem() {
    this.incrementIndex();
    this.shiftAndAppendItem();
    this.applyStyles();
    this.animateCarousel();
    this.scheduleAlignment();
  }

  private incrementIndex() {
    this.index.update((index) => index + 1);
  }

  private shiftAndAppendItem() {
    const item = this.data.shift();
    if (this.data.length === 0) {
      this.data.push(...this.helper);
    }
    if (item) {
      this.items.update((items) => [...items, item]);
    }
  }

  private applyStyles() {
    const cells = Array.from(
      this.carouselList()?.nativeElement.querySelectorAll('.carousel__cell')
    ) as HTMLElement[];
    cells.forEach((cell: HTMLElement) => {
      this.renderer.setStyle(
        cell,
        'flex',
        `0 0 ${100 / this.visibleItemsCount()}%`
      );
    });
  }

  private animateCarousel() {
    const transformValue = this.calculateTransformValue(
      this.currentIndex() + 1
    );
    this.applyTransform(transformValue);
    setTimeout(() => {
      const resetTransformValue = this.calculateTransformValue(
        this.currentIndex()
      );
      this.resetTransform(resetTransformValue);
      this.removeFirstItem();
    }, this.speed() * 1000);
  }

  private calculateDifference(): number {
    const index = this.index();
    const nearestLowerMultipleOf10 = Math.floor(index / 10) * 10;
    const val = nearestLowerMultipleOf10;

    return Math.round((this.selectedItemIndex() + val - index) / 4);
  }

  private scheduleAlignment() {
    setTimeout(() => {
      const difference = this.calculateDifference();
      if (this.counter() === difference) {
        this.counter.set(0);
        this.speed.update((speed) =>
          Math.min(this.minSpeed(), speed + this.stepSpeed())
        );
      }
      this.counter.update((counter) => counter + 1);

      if (this.index() !== this.selectedItemOffset()) {
        console.log('index --- selected offset ' + this.index () +'---' + this.selectedItemOffset())
        this.alignToSelectedItem();
      }
    }, this.speed() * 1500);
  }

  private calculateTransformValue(index: number): string {
    return `translateX(${
      (-(index - Math.floor(this.visibleItemsCount() / 2)) * 100) /
      this.visibleItemsCount()
    }%)`;
  }

  private applyTransform(transformValue: string) {
    this.renderer.setStyle(
      this.carouselList()?.nativeElement,
      'transition',
      ''
    );
    this.renderer.setStyle(
      this.carouselList()?.nativeElement,
      'transition',
      `transform ${this.speed()}s ease-in-out`
    );
    this.renderer.setStyle(
      this.carouselList()?.nativeElement,
      'transform',
      transformValue
    );
  }

  private resetTransform(transformValue: string) {
    this.renderer.setStyle(
      this.carouselList()?.nativeElement,
      'transition',
      'none'
    );
    this.renderer.setStyle(
      this.carouselList()?.nativeElement,
      'transform',
      transformValue
    );
  }

  private removeFirstItem() {
    this.items().shift();
  }

  // red ============================================

  start() {
    this.index.update((index) => index % this.itemsNumber());
    this.index.update((index) => index + 1);
    this.howMany.set(0);
    this.speed.set(0.5)
    this.selectedItemIndex.set(this.getRandomIndex());
    console.log('selected item: ' + this.selectedItemIndex());
    this.shiftAndAppendItem();
    this.applyStyles();
    this.performFullRotation();
  }

  private scheduleNextRotation() {

    setTimeout(() => {
      if (this.howMany() === this.itemsNumber()) {
        console.log('how many ' + this.howMany());
        this.counter.set(0);
        this.selectedItemOffset.set(   this.selectedItemIndex() + Math.floor(this.index() / 10) * 10  );
        console.log('selected item index offset ' + this.selectedItemOffset());
        this.index.update(index =>  index % this.itemsNumber());
        this.alignToSelectedItem();
        return;
      }
      this.howMany.update((i) => i + 1);
      if (this.counter() === Math.round(this.itemsNumber() / 4)) {
        this.counter.set(0);
        this.speed.update((i) =>
          Math.max(this.maxSpeed(), i - this.stepSpeed())
        );
      }
      this.counter.update((i) => i + 1);
      this.move();
    }, this.speed() * 1500);



  }

  move() {
    this.index.update((index) => index + 1);
    this.shiftAndAppendItem();
    this.applyStyles();
    this.performFullRotation();
  }

  // green =====================================

  performFullRotation() {
    const transformValue = this.calculateTransformValue(
      this.currentIndex() + 1
    );
    this.applyTransform(transformValue);
    this.scheduleTransformReset();
    this.scheduleNextRotation();
  }

  private scheduleTransformReset() {
    setTimeout(() => {
      const resetTransformValue = this.calculateTransformValue(
        this.currentIndex()
      );
      this.resetTransform(resetTransformValue);
      this.removeFirstItem();
    }, this.speed() * 1000);
  }

  getRandomIndex(): number {
    return (
      (Math.floor(Math.random() * 10) + this.winningBlock()) %
      this.itemsNumber()
    );
  }

  // red

  isCenterItem(index: number): boolean {
    const centerIndex = this.calculateCenterIndex();
    const currentCenterIndex = this.getCurrentCenterIndex();
    return this.isItemAtCenter(index, currentCenterIndex, centerIndex);
  }

  private calculateCenterIndex(): number {
    return Math.floor(
      this.visibleItemsCount() / Math.floor(this.visibleItemsCount() / 2)
    );
  }

  private getCurrentCenterIndex(): number {
    if (this.visibleItemsCount() < 5) {
      return (
        (this.currentIndex() - 3 + this.calculateCenterIndex()) %
        this.helper.length
      );
    } else {
      return (
        (this.currentIndex() - 2 + this.calculateCenterIndex()) %
        this.helper.length
      );
    }
  }

  private isItemAtCenter(
    index: number,
    currentCenterIndex: number,
    centerIndex: number
  ): boolean {
    if (this.items()[0].key === 0) {
      return index === currentCenterIndex + 1;
    }
    return index === currentCenterIndex;
  }

  // red

  closeDialog() {
    this.showDialog.set(false);
    const dialog = this.dialog()?.nativeElement;
    dialog.close();
  }
  openDialog() {
    const dialog = this.dialog()?.nativeElement;
    dialog.showModal();
  }
}
