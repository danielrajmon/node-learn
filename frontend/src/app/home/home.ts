import { Component } from '@angular/core';
import versionInfo from '../../version.json';

@Component({
  selector: 'app-home',
  imports: [],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home {
  version = versionInfo.fullVersion;
}
