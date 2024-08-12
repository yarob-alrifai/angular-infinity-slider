import {
  Component,
  OnInit,
  Renderer2,
  ElementRef,
  signal,
  viewChild,
} from '@angular/core';
import { NgClass } from '@angular/common';

interface Item {
  key: number;
}
@Component({
  selector: 'app-slider',
  templateUrl: './slider.component.html',
  styleUrls: ['./slider.component.css'],
  imports: [NgClass],
  standalone: true,
})
export class SliderComponent implements OnInit {
  // fire =====================================def=====================================

  differenceBetweenRightAndSelected = signal(0);
  itemsNumber = signal(50); //Items number
  visibleItemsCount = signal(5); // Number of visible items on the screen, we can change it as we want
  winningBlock = signal(15); //Winning block
  endSlicee = signal(this.visibleItemsCount() + 2);

  ourDate = signal<Item[]>(
    Array.from({ length: this.itemsNumber() }, (_, i) => ({ key: i + 1 }))
  ); //Gerate our items
  items = signal<Item[]>([]); //To display on the screen
  currentIndex = signal<number>(Math.floor(this.visibleItemsCount() / 2)); //Started index
  selectedItemIndex = signal<number>(-1); //Random slected item to stop on it
  isWinner = signal<boolean>(false); //Use it in the dialog
  dialogTitle = signal<string>(''); //Dialog title we will change it then
  showDialog = signal<boolean>(false); //To show dialog and show message when stop
  enableButton = signal<boolean>(true);
  index = signal<number>(this.currentIndex());
  counterForChangeSpeed = signal<number>(0);
  counterForDoOneCycle = signal<number>(0);
  stepSpeed = signal<number>(0.05);
  maxSpeed = signal<number>(0.1);
  minSpeed = signal<number>(0.6);
  currentSpeed = signal<number>(this.minSpeed());
  selectedItemOffset = signal<number>(0);
  dialog = viewChild<ElementRef>('dialog'); //Get to the dialog
  carouselList = viewChild<ElementRef>('carouselList'); //Get to the carousel list

  // fire =====================================def=====================================

  constructor(private renderer: Renderer2) {}

  ngOnInit() {
    this.initCarousel();
  }
  // green initial functions  =================================initial functions =========================
  private initCarousel() {
    this.setUpItems();
    this.applyStyles();
    this.firstRotateCarousel();
  }

  private setUpItems() {
    this.items.set(this.ourDate().slice(0, this.endSlicee()));
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

  private firstRotateCarousel() {
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

  // green work functions  =================================work functions =========================

  start() {
    this.inItVariable();
    this.shiftAndAppendItem();
    this.applyStyles();
    this.performFullRotation();
  }

  private inItVariable() {
    this.index.update((index) => index % this.itemsNumber());
    this.incrementIndex();
    this.enableButton.set(false);
    this.counterForDoOneCycle.set(0);
    this.currentSpeed.set(0.5);
    this.counterForChangeSpeed.set(0);
    this.selectedItemIndex.set(this.getRandomIndex());
    this.isWinner.set(this.selectedItemIndex() === this.winningBlock());
    this.dialogTitle.set(this.isWinner() ? 'Congratulations!' : 'Oops!');
    this.selectedItemOffset.set(this.selectedItemIndex());
    console.log('selected item: ' + this.selectedItemIndex());
  }

  private shiftAndAppendItem() {
    const item = this.ourDate()[(this.index() + 4) % this.itemsNumber()];
    if (item) {
      this.items.update((items) => [...items, item]);
    }
  }

  private performFullRotation() {
    const transformValue = this.calculateTransformValue(
      this.currentIndex() + 1
    );
    this.applyTransform(transformValue);
    this.scheduleTransformReset();
    this.scheduleNextRotation();
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
      `transform ${this.currentSpeed()}s ease-in-out`
    );
    this.renderer.setStyle(
      this.carouselList()?.nativeElement,
      'transform',
      transformValue
    );
  }

  private scheduleTransformReset() {
    const start = performance.now();
    const duration = this.currentSpeed() * 1000;

    const animate = (timestamp: number) => {
      const elapsed = timestamp - start;

      if (elapsed >= duration) {
        const resetTransformValue = this.calculateTransformValue(
          this.currentIndex()
        );
        this.resetTransform(resetTransformValue);
        this.removeFirstItem();
      } else {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }

  private scheduleNextRotation() {
    const start = performance.now();
    const duration = this.currentSpeed() * 1500;
    const animate = (timestamp: number) => {
      const elapsed = timestamp - start;
      if (elapsed >= duration) {
        this.handleEndOfRotation();
      } else {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }

  handleEndOfRotation() {
    if (this.hasCompletedCycle()) {
      this.resetCycle();

      this.updateIndexForSelectedItem();
      this.calculateDifferenceBetweenSelectedAndCurrent();
      this.alignToSelectedItem();
      return;
    }
    this.incrementCycleCounter();
    this.adjustSpeedIfNecessary();
    this.move();
  }

  private hasCompletedCycle(): boolean {
    return this.counterForDoOneCycle() === this.itemsNumber();
  }

  private resetCycle() {
    this.counterForChangeSpeed.set(0);
    this.index.update((index) => index % this.itemsNumber());
  }
  private updateIndexForSelectedItem() {
    if (this.selectedItemIndex() <= this.index()) {
      this.selectedItemOffset.set(
        this.selectedItemIndex() + this.itemsNumber()
      );
    }
  }

  private calculateDifferenceBetweenSelectedAndCurrent() {
    this.differenceBetweenRightAndSelected.set(
      Math.round((this.selectedItemOffset() - this.index()) / 10)
    );
  }

  private alignToSelectedItem() {
    this.incrementIndex();
    this.shiftAndAppendItem();
    this.applyStyles();
    this.animateCarousel();
    this.scheduleAlignment();
  }

  private incrementCycleCounter() {
    this.counterForDoOneCycle.update((i) => i + 1);
  }

  private adjustSpeedIfNecessary() {
    if (this.counterForChangeSpeed() === Math.round(this.itemsNumber() / 10)) {
      this.counterForChangeSpeed.set(0);
      this.currentSpeed.update((i) =>
        Math.max(this.maxSpeed(), i - this.stepSpeed())
      );
    }
    this.counterForChangeSpeed.update((i) => i + 1);
  }

  private move() {
    this.incrementIndex();
    this.shiftAndAppendItem();
    this.applyStyles();
    this.performFullRotation();
  }

  private incrementIndex() {
    this.index.update((index) => index + 1);
  }

  private animateCarousel() {
    const transformValue = this.calculateTransformValue(
      this.currentIndex() + 1
    );
    this.applyTransform(transformValue);

    const start = performance.now();
    const duration = this.currentSpeed() * 1000;

    const animate = (timestamp: number) => {
      const elapsed = timestamp - start;

      if (elapsed >= duration) {
        const resetTransformValue = this.calculateTransformValue(
          this.currentIndex()
        );
        this.resetTransform(resetTransformValue);
        this.removeFirstItem();
      } else {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }
  private scheduleAlignment() {
    const start = performance.now();
    const duration = this.currentSpeed() * 1500;
    const animate = (timestamp: number) => {
      const elapsed = timestamp - start;
      if (elapsed >= duration) {
        this.handleSpeedAdjustment();
        this.checkAlignmentOrEnd();
      } else {
        requestAnimationFrame(animate);
      }
    };
    requestAnimationFrame(animate);
  }

  private handleSpeedAdjustment() {
    if (this.shouldAdjustSpeed()) {
      this.resetSpeedCounter();
      this.increaseSpeed();
    }
    this.incrementSpeedCounter();
  }

  private shouldAdjustSpeed(): boolean {
    return (
      this.counterForChangeSpeed() === this.differenceBetweenRightAndSelected()
    );
  }

  private resetSpeedCounter() {
    this.counterForChangeSpeed.set(0);
  }

  private increaseSpeed() {
    this.currentSpeed.update((speed) =>
      Math.min(this.minSpeed(), speed + this.stepSpeed())
    );
  }

  private checkAlignmentOrEnd() {
    if (this.isNotAlignedWithSelectedItem()) {
      this.alignToSelectedItem();
    } else {
      this.finalizeAlignment();
    }
  }

  private isNotAlignedWithSelectedItem(): boolean {
    return this.index() !== this.selectedItemOffset();
  }

  private finalizeAlignment() {
    this.showDialog.set(true);
    this.openDialog();
    this.enableButton.set(true);
  }

  private incrementSpeedCounter() {
    this.counterForChangeSpeed.update((counter) => counter + 1);
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

  private getRandomIndex(): number {
    return (
      (Math.floor(Math.random() * 10) + this.winningBlock()) %
      this.itemsNumber()
    );
  }

  //green  for ceneter item in the view ====================
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
        this.ourDate().length
      );
    } else {
      return (
        (this.currentIndex() - 2 + this.calculateCenterIndex()) %
        this.ourDate().length
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
  //green dialog =======================================

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
