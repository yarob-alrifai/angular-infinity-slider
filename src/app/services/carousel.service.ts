import { Injectable } from '@angular/core';
import { signal } from '@angular/core';


interface Item {
  key: number;
}
@Injectable({ providedIn: 'root' })
export class CarouselService {
  private readonly itemsNumber = signal(50);
  private readonly visibleItemsCount = signal(5);
  private readonly winningBlock = signal(14);
  private readonly data = signal<Item[]>([]);

  items = signal<Item[]>([]);
  currentIndex = signal<number>(Math.floor(this.visibleItemsCount() / 2));
  speed = signal(0.5);

  constructor() {
    this.initializeItems();
  }

  private initializeItems() {
    const initialItems = Array.from({ length: this.itemsNumber() }, (_, i) => ({
      key: i + 1,
    }));
    this.data.set(initialItems);
    this.items.set(initialItems.slice(0, this.visibleItemsCount() + 2));
    this.data.update((data) =>
      data.slice(this.visibleItemsCount() + 2)
    );
  }

  addItem() {
    const item = this.data().shift();
    if (item) {
      this.items.update((items) => [...items, item]);
    }
  }

  rotateCarousel() {
    this.currentIndex.update(
      (index) => index + 1 % this.itemsNumber()
    );
  }

  getVisibleItemsCount() {
    return this.visibleItemsCount();
  }

  getTransformValue(): string {
    return `translateX(${
      (-(this.currentIndex() - Math.floor(this.visibleItemsCount() / 2)) * 100) /
      this.visibleItemsCount()
    }%)`;
  }

  updateSpeed(factor: number) {
    this.speed.update((speed) => speed * factor);
  }

  getSpeed(): number {
    return this.speed();
  }
}
