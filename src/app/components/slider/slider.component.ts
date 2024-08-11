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
  selectedItemIndex = signal(-1); //Random slected item to stop on it
  isWinner = signal<boolean>(false); //Use it in the dialog
  dialogTitle = signal<string>(''); //Dialog title we will change it then
  showDialog = signal<boolean>(false); //To show dialog and show message when stop
  enableButton = signal(true);
  index = signal(this.currentIndex());
  counterForChangeSpeed = signal(0);
  counterForDoOneCycle = signal(0);
  stepSpeed = signal(0.05);
  maxSpeed = signal(0.1);
  minSpeed = signal(0.6);
  speed = signal(this.minSpeed());
  selectedItemOffset = signal(0);
  dialog = viewChild<ElementRef>('dialog'); //Get to the dialog
  carouselList = viewChild<ElementRef>('carouselList'); //Get to the carousel list

  // fire =====================================def=====================================

  constructor(private renderer: Renderer2) {}

  ngOnInit() {
    this.initCarousel();
  }

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

  private alignToSelectedItem() {
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
    const item = this.ourDate()[(this.index() + 4) % this.itemsNumber()];
    if (item) {
      this.items.update((items) => [...items, item]);
    }
  }

  private animateCarousel() {
    const transformValue = this.calculateTransformValue(
      this.currentIndex() + 1
    );
    this.applyTransform(transformValue);

    const start = performance.now();
    const duration = this.speed() * 1000;

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
    const duration = this.speed() * 1500;

    const animate = (timestamp: number) => {
      const elapsed = timestamp - start;

      if (elapsed >= duration) {
        if (
          this.counterForChangeSpeed() ===
          this.differenceBetweenRightAndSelected()
        ) {
          this.counterForChangeSpeed.set(0);
          this.speed.update((speed) =>
            Math.min(this.minSpeed(), speed + this.stepSpeed())
          );
        }
        this.counterForChangeSpeed.update((counter) => counter + 1);

        if (this.index() !== this.selectedItemOffset()) {
          this.alignToSelectedItem();
        } else {
          this.showDialog.set(true);
          this.openDialog();
          this.enableButton.set(true);
        }
      } else {
        requestAnimationFrame(animate);
      }
    };
    requestAnimationFrame(animate);
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

  private inItVariable() {
    this.index.update((index) => index % this.itemsNumber());
    this.incrementIndex();
    this.enableButton.set(false);
    this.counterForDoOneCycle.set(0);
    this.speed.set(0.5);
    this.counterForChangeSpeed.set(0);
    this.selectedItemIndex.set(this.getRandomIndex());
    this.isWinner.set(this.selectedItemIndex() === this.winningBlock());
    this.dialogTitle.set(this.isWinner() ? 'Congratulations!' : 'Oops!');
    this.selectedItemOffset.set(this.selectedItemIndex());
    console.log('selected item: ' + this.selectedItemIndex());
  }

   start() {
    this.inItVariable();
    this.shiftAndAppendItem();
    this.applyStyles();
    this.performFullRotation();
  }

  private scheduleNextRotation() {
    const start = performance.now();
    const duration = this.speed() * 1500;

    const animate = (timestamp: number) => {
      const elapsed = timestamp - start;

      if (elapsed >= duration) {
        if (this.counterForDoOneCycle() === this.itemsNumber()) {
          this.counterForChangeSpeed.set(0);
          this.index.update((index) => index % this.itemsNumber());
          if (this.selectedItemIndex() <= this.index()) {
            this.selectedItemOffset.set(
              this.selectedItemIndex() + this.itemsNumber()
            );
          }
          this.differenceBetweenRightAndSelected.set(
            Math.round((this.selectedItemOffset() - this.index()) / 10)
          );
          this.alignToSelectedItem();
          return;
        }

        this.counterForDoOneCycle.update((i) => i + 1);

        if (
          this.counterForChangeSpeed() === Math.round(this.itemsNumber() / 10)
        ) {
          this.counterForChangeSpeed.set(0);
          this.speed.update((i) =>
            Math.max(this.maxSpeed(), i - this.stepSpeed())
          );
        }

        this.counterForChangeSpeed.update((i) => i + 1);
        this.move();
      } else {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }

  private move() {
    this.incrementIndex();
    this.shiftAndAppendItem();
    this.applyStyles();
    this.performFullRotation();
  }

  private performFullRotation() {
    const transformValue = this.calculateTransformValue(
      this.currentIndex() + 1
    );
    this.applyTransform(transformValue);
    this.scheduleTransformReset();
    this.scheduleNextRotation();
  }

  private scheduleTransformReset() {
    const start = performance.now();
    const duration = this.speed() * 1000;

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

  private getRandomIndex(): number {
    return (
      (Math.floor(Math.random() * 10) + this.winningBlock()) %
      this.itemsNumber()
    );
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
