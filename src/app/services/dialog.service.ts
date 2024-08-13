import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class DialogService {


  openDialog(dialog: HTMLDialogElement) {
    dialog.showModal();
  }

  closeDialog(dialog: HTMLDialogElement) {

    dialog.close();
  }
}
