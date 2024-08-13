import {
  ElementRef,
  Injectable,
  Renderer2,
  signal,
  viewChild,
} from '@angular/core';
import { Item } from '../core/interfaces/item';
import { DialogService } from './dialog.service';
import { sign } from 'crypto';

@Injectable({
  providedIn: 'root',
})
export class CarouselService {
  visibleItemsCount = signal(5);
  itemsNumber = signal(20);
  ourDate = signal<Item[]>(
    Array.from({ length: this.itemsNumber() }, (_, i) => ({ key: i + 1 }))
  ); // Generate our items
  currentIndex = signal<number>(Math.floor(this.visibleItemsCount() / 2));
  endSlicee = signal(this.visibleItemsCount() + 2);
  index = signal<number>(this.currentIndex());
  differenceBetweenRightAndSelected = signal(0);
  winningBlock = signal(10); //Winning block
  selectedItemIndex = signal<number>(-1); //Random slected item to stop on it
  isWinner = signal<boolean>(false); //Use it in the dialog
  dialogTitle = signal<string>(''); //Dialog title we will change it then
  enableButton = signal<boolean>(true);
  counterForChangeSpeed = signal<number>(0);
  counterForDoOneCycle = signal<number>(0);
  stepSpeed = signal<number>(0.05);
  maxSpeed = signal<number>(0.1);
  minSpeed = signal<number>(0.6);
  currentSpeed = signal<number>(this.minSpeed());
  selectedItemOffset = signal<number>(0);
  items = signal<Item[]>([]);
  carouselList: HTMLElement | null = null;
  renderer: Renderer2 | undefined;
  showDialog = signal<boolean>(false); //To show dialog and show message when stop

  constructor(private dialogService: DialogService) {}

  initCarousel(
    carouselList: HTMLElement,
    renderer: Renderer2,

  ) {
    this.setCarouselList(carouselList);
    this.setRenderer(renderer);

    this.putSevenItemsInTheCarousel();
    this.applyStylesForNewItems();
    this.rotateCarouselToStartedtIndex();
  }

  setCarouselList(carouselList: HTMLElement) {
    this.carouselList = carouselList;
  }

  setRenderer(renderer: Renderer2) {
    this.renderer = renderer;
  }


  private putSevenItemsInTheCarousel() {
    this.items.set(this.ourDate().slice(0, this.endSlicee()));
  }

  applyStylesForNewItems() {
    const cells = this.getCellsFromCarouselList();
    cells.forEach((cell: HTMLElement) => this.setStyleForNewCell(cell));
  }

  private getCellsFromCarouselList(): HTMLElement[] {
    // Ensure carouselList is not null
    if (!this.carouselList) {
      console.error('Carousel list is not set.');
      return [];
    }
    return Array.from(
      this.carouselList.querySelectorAll('.carousel__cell')
    ) as HTMLElement[];
  }

  private setStyleForNewCell(cell: HTMLElement) {
    this.renderer!.setStyle(
      cell,
      'flex',
      `0 0 ${100 / this.visibleItemsCount()}%`
    );
  }

  private rotateCarouselToStartedtIndex() {
    if (!this.carouselList) {
      console.error('Carousel list is not set.');
      return;
    }
    this.renderer!.setStyle(
      this.carouselList,
      'transform',
      this.getTransformValue()
    );
  }

  private getTransformValue() {
    return `translateX(${
      (-(this.currentIndex() - Math.floor(this.visibleItemsCount() / 2)) *
        100) /
      this.visibleItemsCount()
    }%)`;
  }

  shiftAndAppendItem() {
    const item = this.ourDate()[(this.index() + 4) % this.itemsNumber()];
    if (item) {
      this.items.update((items) => [...items, item]);
    }
  }

  start() {
    this.resetAllVariable();
    this.shiftAndAppendItem();
    this.applyStylesForNewItems();
    this.performFullRotation();
  }

  resetAllVariable() {
    this.index.update((index) => index % this.itemsNumber());
    this.incrementIndex();
    this.enableButton.set(false);
    this.counterForDoOneCycle.set(0);
    this.counterForChangeSpeed.set(0);
    this.currentSpeed.set(0.5);
    this.showDialog.set(false)
    this.selectedItemIndex.set(this.getRandomIndex());
    this.selectedItemOffset.set(this.selectedItemIndex());
    this.isWinner.set(this.selectedItemIndex() === this.winningBlock());
    this.dialogTitle.set(this.isWinner() ? 'Congratulations!' : 'Oops!');
    this.printSlectedItemIndexInTheConsol();
  }

  private incrementIndex() {
    this.index.update((index) => index + 1);
  }

  private getRandomIndex(): number {
    return (
      (Math.floor(Math.random() * 10) + this.winningBlock()) %
      this.itemsNumber()
    );
  }

  printSlectedItemIndexInTheConsol() {
    console.log('selected item: ' + this.selectedItemIndex());
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
    this.renderer!.setStyle(this.carouselList, 'transition', '');
    this.renderer!.setStyle(
      this.carouselList,
      'transition',
      `transform ${this.currentSpeed()}s ease-in-out`
    );
    this.renderer!.setStyle(this.carouselList, 'transform', transformValue);
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

  private resetTransform(transformValue: string) {
    this.renderer!.setStyle(this.carouselList, 'transition', 'none');
    this.renderer!.setStyle(this.carouselList, 'transform', transformValue);
  }

  private removeFirstItem() {
    this.items().shift();
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
    this.applyStylesForNewItems();
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
    this.applyStylesForNewItems();
    this.performFullRotation();
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

  private checkAlignmentOrEnd() {
    if (this.isNotAlignedWithSelectedItem()) {
      this.alignToSelectedItem();
    } else {
      this.finalizeAlignment();
    }
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

  private incrementSpeedCounter() {
    this.counterForChangeSpeed.update((counter) => counter + 1);
  }
  private isNotAlignedWithSelectedItem(): boolean {
    return this.index() !== this.selectedItemOffset();
  }
  private finalizeAlignment() {
    this.showDialog.set(true);
    this.enableButton.set(true);
  }

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




}
