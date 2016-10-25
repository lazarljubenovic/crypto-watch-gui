import { Component, OnInit, OnDestroy,
  ViewEncapsulation } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Observable, Observer, Subject } from 'rxjs';
import 'rxjs/add/operator/startWith';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/debounceTime';
import 'rxjs/add/operator/distinctUntilChanged';
import 'rxjs/add/observable/dom/webSocket';
import 'rxjs/add/observable/combineLatest';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class AppComponent implements OnInit, OnDestroy {

  public watch: FormControl = new FormControl(false);
  public sourcePath: FormControl = new FormControl('./input');
  public destinationPath: FormControl = new FormControl('./output');
  public isEncryption: FormControl = new FormControl(true);
  public isOptionsFromFile: FormControl = new FormControl(true);
  public permutation: FormControl = new FormControl("1 0");

  public permutation$: Observable<number[]>;

  public socket: any; // todo type
  public socket$: Observable<any>; // todo type

  public changes$: Observable<any>;

  public convert: Subject<boolean> = new Subject<boolean>();
  public convert$: Observable<boolean> = this.convert.asObservable();

  public ngOnInit() {
    this.permutation$ = this.permutation.valueChanges
      .startWith(this.permutation.value)
      .debounceTime(200)
      .distinctUntilChanged()
      .map(str => str.split(/[^\d]/).filter(x => !!x).map(Number));

    this.socket$ = Observable
      .webSocket('ws://localhost:4201');

    this.socket$.subscribe(next => {
      console.log(`Received data:`, next);
    });

    this.socket = new WebSocket('ws://localhost:4201');

    this.socket.onopen = event => {
      this.socket.send(JSON.stringify(`Client connected!`));
    }

    this.changes$ = Observable.combineLatest(
      this.watch.valueChanges.startWith(this.watch.value),
      this.sourcePath.valueChanges.startWith(this.sourcePath.value),
      this.destinationPath.valueChanges.startWith(this.destinationPath.value),
      this.isEncryption.valueChanges.startWith(this.isEncryption.value),
      this.isOptionsFromFile.valueChanges.startWith(this.isOptionsFromFile.value),
      this.permutation$
    )
      .debounceTime(500)
      .distinctUntilChanged((prev, curr) => curr.every((el, i) => el == prev[i]))
      .map(values => {
        return {
          watch: values[0],
          sourcePath: values[1],
          destinationPath: values[2],
          isEncryption: values[3],
          isOptionsFromFile: values[4],
          permutation: values[5],
        }
      });

    this.changes$.subscribe(settings => {
      this.socket.send(JSON.stringify(settings));
      console.log(`Settings set to server`, settings);
    });

    this.convert$.subscribe(x => {
      this.socket.send(JSON.stringify("Convert"));
      console.log(`Sent instruction to manualy convert`);
    })
  }

  public ngOnDestroy() {
    //this.permutation$.unsubscribe();
  }

}
