import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class DialogService {


  openDialog(dialog: HTMLDialogElement) {
    dialog.showModal(); // Use the correct method for HTMLDialogElement
  }

  closeDialog(dialog: HTMLDialogElement) {

    dialog.close(); // Close the dialog
  }
}
