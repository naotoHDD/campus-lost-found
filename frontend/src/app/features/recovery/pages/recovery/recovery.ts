import { Component } from '@angular/core';

import {
  FormsModule
} from '@angular/forms';

@Component({
  selector: 'app-recovery',
  imports: [
    FormsModule
  ],
  templateUrl: './recovery.html',
  styleUrl: './recovery.scss'
})
export class Recovery {

  location =
    'Bibliothèque';

  date = '';

  time = '';

  code = '';

  finderConfirmed =
    false;

  claimantConfirmed =
    false;

}