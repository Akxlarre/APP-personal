import { Injectable, signal } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class NetworkService {
    private onlineSubject = new BehaviorSubject<boolean>(navigator.onLine);
    public onlineChanges$ = this.onlineSubject.asObservable();

    constructor() {
        window.addEventListener('online', () => this.updateOnlineStatus(true));
        window.addEventListener('offline', () => this.updateOnlineStatus(false));
    }

    private updateOnlineStatus(isOnline: boolean) {
        this.onlineSubject.next(isOnline);
    }

    isOnline(): boolean {
        return this.onlineSubject.value;
    }
}
