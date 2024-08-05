import {
  Component,
  OnInit,
  Renderer2,
  ViewChild,
  ElementRef,
  signal,
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
  itemsNumber = 50; //Items number
  visibleItemsCount = 5; // Number of visible items on the screen, we can change it as we want
  winningBlock = 14; //Winning block
  // orange we can change the prev as we want
  // blue====our data
  ourDate = signal<Item[]>(
    Array.from({ length: this.itemsNumber }, (_, i) => ({ key: i + 1 }))
  ); //Gerate our items
  items = signal<Item[]>([]); //To display on the screen
  helper = this.ourDate(); //For reset the items when stop
  data = [...this.ourDate()]; //We will use it to add items every time to our items array
  // blue====our data
  currentIndex = signal<number>(Math.floor(this.visibleItemsCount / 2)); //Started index
  isRunning = signal<boolean>(false);
  selectedItemIndex = signal(-1); //Random slected item to stop on it
  isWinner = signal<boolean>(false); //Use it in the dialog
  dialogTitle = signal<string>(''); //Dialog title we will change it then
  showDialog = signal<boolean>(false); //To show dialog and show message when stop
enableButton = signal(true)
  @ViewChild('dialog') dialog!: ElementRef<HTMLDialogElement>; //Get to the dialog
  @ViewChild('carouselList', { static: true }) carouselList!: ElementRef; //Get to the carousel list

  // fire =====================================def=====================================

  constructor(private renderer: Renderer2) {}

  ngOnInit() {
    this.initCarousel();
  }

  // green =====================================add=====================================add
  // orange we will use fun to add item every time to our items array

  add() {
    this.currentIndex.update((index) => index + 1); //Add one to the current index
    const item = this.data.shift(); // Get and remove the first item from data
    if (this.data.length == 0) {
      this.data.push(...this.helper);
    }
    if (item) {
      // Check if the item exists
      this.items.update((items) => [...items, item]); // Append the item to items
    }

    this.applyStyles(); //To edit the style because we added new items
    this.rotateCarousel(); //Rotate the carousel after add item
  }
  // green =====================================initCarousel=====================================initCarousel

  initCarousel() {
    this.items.set(this.ourDate().slice(0, this.visibleItemsCount)); //Upload 5 items in the items array
    this.data.splice(0, this.visibleItemsCount); //Delete first 5 items from data array so we can shift first item add push it in items array, to avoid repetation

    this.applyStyles(); //To edit the style because we added new items
    this.rotateCarousel(); //Rotate the carousel after add item
  }

  // green =====================================applyStyles=====================================applyStyles

  applyStyles() {
    const cells = Array.from(
      this.carouselList.nativeElement.querySelectorAll('.carousel__cell')
    ) as HTMLElement[];
    cells.forEach((cell: HTMLElement) => {
      this.renderer.setStyle(
        cell,
        'flex',
        `0 0 ${100 / this.visibleItemsCount}%`
      );
    });
  }
  // green =====================================rotateCarousel=====================================rotateCarousel

  rotateCarousel() {
    const transformValue = `translateX(${
      (-(this.currentIndex() - Math.floor(this.visibleItemsCount / 2)) * 100) /
      this.visibleItemsCount
    }%)`; //The movment will be to the left side with animation, then the selected item will be at the center
    this.renderer.setStyle(
      this.carouselList.nativeElement,
      'transform',
      transformValue
    );
  }
  // green =====================================_rotateCarousel=====================================_rotateCarousel
  // orange we will use this fun to move to the selected item directly with out animation

  _rotateCarousel() {
    // Compute the transform value
    const transformValue = `translateX(${
      (-(this.currentIndex() - Math.floor(this.visibleItemsCount / 2)) * 100) /
      this.visibleItemsCount
    }%)`;
    // Temporarily disable transitions
    this.renderer.setStyle(
      this.carouselList.nativeElement,
      'transition',
      'none'
    );
    this.renderer.setStyle(
      this.carouselList.nativeElement,
      'transform',
      transformValue
    );

    // Restore transitions after a short delay
    setTimeout(() => {
      this.renderer.setStyle(this.carouselList.nativeElement, 'transition', '');
    }, 20);
  }

  // green =====================================startSlider=====================================startSlider

  startSlider() {
    console.log('================================================');
    console.log('Slider started');
    this.enableButton.set(false)
    this.selectedItemIndex.set(-1)
    this.isWinner.set(false)
    this.isRunning.set(true);
    this.selectedItemIndex.set(this.getRandomIndex()); //Get random index from our items
    console.log('Selected item index:', this.selectedItemIndex());
    this.performFullRotation(); //Start full rotation depending on items
  }
  // green =====================================getRandomIndex=====================================getRandomIndex

  getRandomIndex(): number {
    return Math.floor(Math.random() * 10) + this.winningBlock; //Get random index depending on winning block that we selected
  }

  // green =====================================performFullRotation=====================================performFullRotation
  // orange this function to do one cycle befor go the the selected item

  performFullRotation() {
    let speed = 150; // Initial speed for rotation
    console.log('Performing full rotation');
    const totalSteps = this.ourDate().length; // One cycle, to show all items in the list
    let step = 0; //For count steps, then stop on 50, or on items number

    const rotationInterval = setInterval(() => {
      // console.log(speed);

      if (!this.isRunning()) {
        clearInterval(rotationInterval);
        return;
      }

      speed = Math.max(10, speed - 1); // Update speed and ensure it doesn't go below a minimum
      this.add(); //Call fun add to move to the right side and add item to items array

      step++;
      if (step >= totalSteps) {
        clearInterval(rotationInterval);
        this.alignToSelectedItem();
      }
    }, speed);
  }
  // green =====================================alignToSelectedItem=====================================alignToSelectedItem

  // orange this function to go to the selected item
  alignToSelectedItem() {
    let alignSpeed = 200; // Initial speed for alignment
    console.log('Aligning to selected item');
    const offset = this.calculateOffset(); //Calculate offset

    const alignmentInterval = setInterval(() => {
      //Start moving to the selected item
      if (!this.isRunning()) {
        clearInterval(alignmentInterval);
        return;
      }

      alignSpeed = Math.min(300, alignSpeed + 1); // Update alignment speed and ensure it doesn't go above a maximum
      // console.log('The alignment speed is: ' + alignSpeed);// To see the speed
      const currentIndex = this.currentIndex();
      if (currentIndex === offset) {
        clearInterval(alignmentInterval);
        this.isRunning.set(false);

        setTimeout(() => {
          //Here we will wait for 500ms then the dialog will appear, to display the result
          if(this.selectedItemIndex()===14){          this.isWinner.set(true);
          }
          this.dialogTitle.set(this.isWinner() ? 'Congratulations!' : 'Oops!');
          this.showDialog.set(true);
          this.openDialog();
          this.enableButton.set(true)
          // fire Reset items array. Put in items array just 50 items and delete the old value
          this.items.set(
            this.helper.slice(
              0,
              this.selectedItemIndex() + Math.round(this.visibleItemsCount / 2)
            )
          );
          this.currentIndex.update((index) => index % this.itemsNumber);
          // fire After reset the items array we will move to the index %items.length, with out animation
          this._rotateCarousel();
        }, 500);
      } else {
        this.add();
      }
    }, alignSpeed);
  }
  // green =====================================calculateOffset=====================================calculateOffset

  calculateOffset(): number {
    let theRealIndexForSelected = -1;
    // Calculate the offset depending on our current index
    theRealIndexForSelected =
      Math.floor(this.currentIndex() / this.itemsNumber) * this.itemsNumber +
      this.selectedItemIndex();

    console.log('selected Item Index : ' + this.selectedItemIndex());
    // console.log('currentIndex' + this.currentIndex());
    if (theRealIndexForSelected < this.currentIndex()) {
      theRealIndexForSelected =
        Math.floor(this.currentIndex() / this.itemsNumber) *
          (this.itemsNumber * 2) +
        this.selectedItemIndex();
    }
    return theRealIndexForSelected;
  }

  // green =====================================isCenterItem=====================================isCenterItem
  // orange this function to now if the item is in the center of the view(and the selected index right now) to applay some css on it
  isCenterItem(index: number): boolean {
    const centerIndex = Math.floor(
      this.visibleItemsCount / Math.floor(this.visibleItemsCount / 2)
    );

    let currentCenterIndex = 0;

    if (this.visibleItemsCount < 5) {
      currentCenterIndex =
        (this.currentIndex() - 3 + centerIndex) % this.helper.length;
    } else {
      currentCenterIndex =
        (this.currentIndex() - 2 + centerIndex) % this.helper.length;
    }

    return index === currentCenterIndex;
  }
  // green =====================================Dialog_Function=====================================Dialog_Function

  // orange these functions to control open and close dialog

  closeDialog() {
    this.showDialog.set(false);
    const dialog = this.dialog.nativeElement;
    dialog.close();
  }

  openDialog() {
    const dialog = this.dialog.nativeElement;
    dialog.showModal();

  }

  // fire =====================================Dialog_Function=====================================Dialog_Function
}
