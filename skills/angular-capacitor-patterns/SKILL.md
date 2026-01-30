---
name: angular-capacitor-patterns
description: Arquitectura y patrones para apps móviles con Angular 18+, Capacitor 6, PrimeNG y GSAP. Úsalo cuando construyas componentes móviles, implementes sincronización offline, o integres plugins de Capacitor.
---

# Angular + Capacitor Mobile Patterns

Patrones arquitectónicos especializados para aplicaciones móviles híbridas usando Angular Standalone Components, Capacitor 6, y estrategias offline-first.

## Cuándo Usar Esta Skill

- Crear componentes móviles optimizados para touch
- Implementar sincronización offline-first con Supabase
- Integrar plugins de Capacitor (Notifications, Storage, Camera)
- Configurar animaciones GSAP para gamificación
- Estructurar features con NgRx Signals

## Principios Fundamentales

### 1. Mobile-First Architecture

Todos los componentes deben:
- Usar `ChangeDetectionStrategy.OnPush` obligatorio
- Implementar gestos touch-friendly (min 44x44px)
- Considerar keyboard virtual (bottom padding dinámico)
- Optimizar para 3G/4G (lazy loading agresivo)

```typescript
@Component({
  selector: 'app-block-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[style.min-height.px]': '88', // 2x touch target
    '[class.ios]': 'platform.is("ios")',
    '[class.android]': 'platform.is("android")'
  }
})
export class BlockCardComponent {}
```

### 2. Offline-First Data Flow

```
┌─────────────────────────────────────────────┐
│ User Action (Complete Block)               │
└───────────────┬─────────────────────────────┘
                │
                ▼
┌───────────────────────────────────────────┐
│ 1. Write to Local SQLite FIRST            │
│    (Instant UI update via signals)        │
└───────────────┬───────────────────────────┘
                │
                ▼
┌───────────────────────────────────────────┐
│ 2. Queue Sync Operation                   │
│    (Background service)                   │
└───────────────┬───────────────────────────┘
                │
                ▼
         ┌──────┴───────┐
         │ Online?      │
         └──┬────────┬──┘
           YES      NO
            │        │
            │        └─> Store in sync_queue
            │            (retry on reconnect)
            ▼
┌───────────────────────────────────────────┐
│ 3. Push to Supabase                       │
│    (Last-write-wins conflict resolution)  │
└───────────────┬───────────────────────────┘
                │
                ▼
┌───────────────────────────────────────────┐
│ 4. Update Local with server response      │
│    (Reconcile timestamps)                 │
└───────────────────────────────────────────┘
```

### 3. NgRx Signals State Management

**NUNCA usar NgRx Store clásico**. Siempre Signals:

```typescript
// ✅ CORRECTO: Signal Store con computeds
import { signalStore, withState, withComputed, withMethods } from '@ngrx/signals';

interface BlocksState {
  blocks: DailyBlock[];
  selectedDate: string;
  loading: boolean;
}

export const BlocksStore = signalStore(
  { providedIn: 'root' },
  withState<BlocksState>({
    blocks: [],
    selectedDate: new Date().toISOString().split('T')[0],
    loading: false
  }),
  
  withComputed(({ blocks, selectedDate }) => ({
    todayBlocks: computed(() => 
      blocks().filter(b => b.date === selectedDate())
    ),
    completedCount: computed(() => 
      blocks().filter(b => b.status === 'completed').length
    ),
    completionRate: computed(() => {
      const total = blocks().length;
      const completed = blocks().filter(b => b.status === 'completed').length;
      return total > 0 ? (completed / total) * 100 : 0;
    })
  })),
  
  withMethods((store, blocksRepo = inject(BlocksRepository)) => ({
    async loadBlocks(userId: string, date: string) {
      patchState(store, { loading: true });
      try {
        const blocks = await blocksRepo.getDailyBlocks(userId, date);
        patchState(store, { blocks, selectedDate: date, loading: false });
      } catch (error) {
        console.error('Failed to load blocks', error);
        patchState(store, { loading: false });
      }
    },
    
    async completeBlock(blockId: string, note?: string) {
      // Optimistic update
      const updatedBlocks = store.blocks().map(b => 
        b.id === blockId 
          ? { ...b, status: 'completed' as const, completion_note: note }
          : b
      );
      patchState(store, { blocks: updatedBlocks });
      
      // Background sync
      try {
        await blocksRepo.completeBlock(blockId, note);
      } catch (error) {
        // Rollback on failure
        patchState(store, { blocks: store.blocks() });
        throw error;
      }
    }
  }))
);
```

## Capacitor Integration Patterns

### Plugin Initialization

```typescript
// src/app/core/capacitor/capacitor.service.ts
import { Injectable, inject } from '@angular/core';
import { Platform } from '@angular/cdk/platform';
import { App } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';

@Injectable({ providedIn: 'root' })
export class CapacitorService {
  private platform = inject(Platform);
  
  async initialize() {
    if (!this.platform.isBrowser) {
      await this.setupStatusBar();
      await this.setupAppListeners();
      await SplashScreen.hide();
    }
  }
  
  private async setupStatusBar() {
    if (this.platform.IOS) {
      await StatusBar.setStyle({ style: Style.Dark });
    } else if (this.platform.ANDROID) {
      await StatusBar.setBackgroundColor({ color: '#1a202c' });
    }
  }
  
  private async setupAppListeners() {
    App.addListener('appStateChange', ({ isActive }) => {
      if (isActive) {
        // Resume sync cuando app vuelve a foreground
        inject(SyncService).resumeSync();
      }
    });
    
    App.addListener('backButton', ({ canGoBack }) => {
      if (!canGoBack) {
        App.exitApp();
      }
    });
  }
}
```

### Local Notifications Pattern

```typescript
// src/app/core/notifications/notification.service.ts
import { LocalNotifications, ScheduleOptions } from '@capacitor/local-notifications';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private hasPermissions = signal(false);
  
  async init() {
    const result = await LocalNotifications.requestPermissions();
    this.hasPermissions.set(result.display === 'granted');
  }
  
  async scheduleBlockReminder(block: DailyBlock, minutesBefore: number = 5) {
    if (!this.hasPermissions()) return;
    
    const reminderTime = new Date(block.start_time);
    reminderTime.setMinutes(reminderTime.getMinutes() - minutesBefore);
    
    await LocalNotifications.schedule({
      notifications: [{
        id: this.generateNotificationId(block.id),
        title: `Próximo: ${block.name}`,
        body: `Comienza en ${minutesBefore} minutos`,
        schedule: { at: reminderTime },
        actionTypeId: 'BLOCK_REMINDER',
        extra: { blockId: block.id, blockName: block.name }
      }]
    });
  }
  
  // Cancelar todas las notificaciones de un día específico
  async cancelDayNotifications(date: string) {
    const pending = await LocalNotifications.getPending();
    const idsToCancel = pending.notifications
      .filter(n => n.extra?.date === date)
      .map(n => n.id);
    
    if (idsToCancel.length > 0) {
      await LocalNotifications.cancel({ notifications: idsToCancel.map(id => ({ id })) });
    }
  }
  
  // Haptic feedback para confirmaciones
  async triggerSuccess() {
    await Haptics.impact({ style: ImpactStyle.Medium });
  }
  
  async triggerError() {
    await Haptics.notification({ type: NotificationType.Error });
  }
  
  private generateNotificationId(blockId: string): number {
    // Convertir UUID a número único (primeros 8 chars en hex)
    return parseInt(blockId.slice(0, 8), 16);
  }
}
```

## PrimeNG Mobile Optimizations

### Touch-Optimized Dialog

```typescript
// Wrapper component para dialogs móviles
@Component({
  selector: 'app-mobile-dialog',
  standalone: true,
  imports: [DialogModule],
  template: `
    <p-dialog
      [(visible)]="visible"
      [modal]="true"
      [dismissableMask]="true"
      [blockScroll]="true"
      [styleClass]="'mobile-dialog'"
      [position]="position()"
      [breakpoints]="{ '960px': '90vw', '640px': '100vw' }"
    >
      <ng-content></ng-content>
    </p-dialog>
  `,
  styles: [`
    :host ::ng-deep .mobile-dialog {
      .p-dialog-content {
        padding: var(--spacing-lg);
        max-height: 70vh;
        overflow-y: auto;
        -webkit-overflow-scrolling: touch;
      }
      
      // iOS safe area
      @supports (padding: env(safe-area-inset-bottom)) {
        .p-dialog-footer {
          padding-bottom: calc(var(--spacing-md) + env(safe-area-inset-bottom));
        }
      }
    }
  `]
})
export class MobileDialogComponent {
  visible = model<boolean>(false);
  
  private platform = inject(Platform);
  
  position = computed(() => 
    this.platform.IOS ? 'bottom' : 'center'
  );
}
```

### Infinite Scroll con DataView

```typescript
@Component({
  selector: 'app-habit-history',
  standalone: true,
  imports: [DataViewModule, ScrollerModule],
  template: `
    <p-dataView
      [value]="visibleItems()"
      [layout]="'list'"
      [lazy]="true"
      (onLazyLoad)="loadMore($event)"
    >
      <ng-template let-item pTemplate="listItem">
        <app-habit-card [habit]="item" />
      </ng-template>
    </p-dataView>
  `
})
export class HabitHistoryComponent {
  private habitsStore = inject(HabitsStore);
  
  visibleItems = computed(() => 
    this.habitsStore.habits().slice(0, this.pageSize() * this.currentPage())
  );
  
  private pageSize = signal(20);
  private currentPage = signal(1);
  
  loadMore(event: any) {
    this.currentPage.update(p => p + 1);
  }
}
```

## GSAP Animation Patterns

### Streak Celebration Animation

```typescript
// src/app/shared/animations/streak.animations.ts
import gsap from 'gsap';

export class StreakAnimations {
  static playStreakComplete(element: HTMLElement, days: number) {
    const tl = gsap.timeline();
    
    // Scale + Rotation
    tl.to(element, {
      scale: 1.3,
      rotation: 360,
      duration: 0.6,
      ease: 'back.out(2)',
      onStart: () => {
        element.classList.add('celebrating');
      }
    });
    
    // Bounce back
    tl.to(element, {
      scale: 1,
      duration: 0.3,
      ease: 'elastic.out(1, 0.5)'
    });
    
    // Milestone confetti
    if ([7, 30, 100].includes(days)) {
      this.playConfetti(element.parentElement!);
    }
  }
  
  static playStreakLost(element: HTMLElement) {
    const tl = gsap.timeline();
    
    // Shake violently
    tl.to(element, {
      x: -10,
      duration: 0.05,
      repeat: 5,
      yoyo: true
    });
    
    // Fade out and shrink
    tl.to(element, {
      opacity: 0,
      scale: 0.5,
      duration: 0.4,
      ease: 'power2.in',
      onComplete: () => {
        gsap.set(element, { opacity: 1, scale: 1, x: 0 });
      }
    });
  }
  
  private static playConfetti(container: HTMLElement) {
    // Crear partículas
    const colors = ['#6366f1', '#10b981', '#f59e0b', '#ef4444'];
    const particleCount = 30;
    
    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement('div');
      particle.className = 'confetti-particle';
      particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      container.appendChild(particle);
      
      gsap.fromTo(particle, 
        {
          x: 0,
          y: 0,
          opacity: 1,
          scale: 1
        },
        {
          x: (Math.random() - 0.5) * 300,
          y: -200 + Math.random() * 100,
          opacity: 0,
          scale: 0,
          duration: 1.5,
          ease: 'power2.out',
          onComplete: () => particle.remove()
        }
      );
    }
  }
}
```

### Page Transition Animation

```typescript
// src/app/core/animations/route-animations.ts
import { trigger, transition, style, animate, query } from '@angular/animations';

export const slideInAnimation = trigger('routeAnimations', [
  transition('* <=> *', [
    query(':enter, :leave', [
      style({
        position: 'absolute',
        width: '100%',
        transform: 'translateX(0)',
        opacity: 1
      })
    ], { optional: true }),
    
    query(':enter', [
      style({ transform: 'translateX(100%)', opacity: 0 })
    ], { optional: true }),
    
    query(':leave', [
      animate('300ms ease-out', style({ 
        transform: 'translateX(-100%)',
        opacity: 0 
      }))
    ], { optional: true }),
    
    query(':enter', [
      animate('300ms 150ms ease-out', style({ 
        transform: 'translateX(0)',
        opacity: 1 
      }))
    ], { optional: true })
  ])
]);
```

## Offline Sync Patterns

### SQLite Repository

```typescript
// src/app/core/database/sqlite.service.ts
import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';

@Injectable({ providedIn: 'root' })
export class SQLiteService {
  private sqlite: SQLiteConnection;
  private db!: SQLiteDBConnection;
  
  async init() {
    this.sqlite = new SQLiteConnection(CapacitorSQLite);
    
    this.db = await this.sqlite.createConnection(
      'lifeblocks',
      false,
      'no-encryption',
      1,
      false
    );
    
    await this.db.open();
    await this.createTables();
  }
  
  private async createTables() {
    const schema = `
      CREATE TABLE IF NOT EXISTS daily_blocks (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        date TEXT NOT NULL,
        name TEXT NOT NULL,
        start_time TEXT NOT NULL,
        end_time TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        completion_note TEXT,
        completed_at TEXT,
        synced INTEGER DEFAULT 0,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE INDEX IF NOT EXISTS idx_blocks_date ON daily_blocks(date);
      CREATE INDEX IF NOT EXISTS idx_blocks_sync ON daily_blocks(synced);
      
      CREATE TABLE IF NOT EXISTS sync_queue (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        operation TEXT NOT NULL,
        table_name TEXT NOT NULL,
        record_id TEXT NOT NULL,
        payload TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `;
    
    await this.db.execute(schema);
  }
  
  async getUnsyncedBlocks(): Promise<DailyBlock[]> {
    const result = await this.db.query(
      'SELECT * FROM daily_blocks WHERE synced = 0'
    );
    return result.values || [];
  }
  
  async markAsSynced(blockId: string) {
    await this.db.run(
      'UPDATE daily_blocks SET synced = 1 WHERE id = ?',
      [blockId]
    );
  }
}
```

### Background Sync Service

```typescript
// src/app/core/sync/background-sync.service.ts
@Injectable({ providedIn: 'root' })
export class BackgroundSyncService {
  private sqlite = inject(SQLiteService);
  private supabase = inject(SupabaseService);
  private network = inject(NetworkService);
  
  private syncInterval$ = interval(30000); // 30 segundos
  
  startAutoSync() {
    this.syncInterval$
      .pipe(
        filter(() => this.network.isOnline()),
        switchMap(() => this.syncPendingChanges()),
        catchError(error => {
          console.error('Sync failed', error);
          return of(null);
        })
      )
      .subscribe();
  }
  
  async syncPendingChanges() {
    const unsynced = await this.sqlite.getUnsyncedBlocks();
    
    for (const block of unsynced) {
      try {
        await this.supabase
          .from('daily_blocks')
          .upsert(block, { onConflict: 'id' });
        
        await this.sqlite.markAsSynced(block.id);
      } catch (error) {
        console.error(`Failed to sync block ${block.id}`, error);
        // Continuar con el siguiente
      }
    }
  }
}
```

## Performance Optimization

### Virtual Scrolling for Long Lists

```typescript
@Component({
  selector: 'app-inventory-list',
  standalone: true,
  imports: [ScrollingModule, VirtualScrollerModule],
  template: `
    <cdk-virtual-scroll-viewport itemSize="72" class="viewport">
      <app-inventory-item
        *cdkVirtualFor="let item of items(); trackBy: trackById"
        [item]="item"
      />
    </cdk-virtual-scroll-viewport>
  `
})
export class InventoryListComponent {
  items = input.required<InventoryItem[]>();
  
  trackById(index: number, item: InventoryItem) {
    return item.id;
  }
}
```

### Image Loading Strategy

```typescript
// Directiva para lazy loading de imágenes
@Directive({
  selector: 'img[appLazyLoad]',
  standalone: true
})
export class LazyLoadDirective implements OnInit {
  @Input() src!: string;
  private el = inject(ElementRef<HTMLImageElement>);
  
  ngOnInit() {
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            this.loadImage();
            observer.disconnect();
          }
        });
      });
      
      observer.observe(this.el.nativeElement);
    } else {
      this.loadImage();
    }
  }
  
  private loadImage() {
    this.el.nativeElement.src = this.src;
  }
}
```

## Testing Patterns

### Component Testing with Signals

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';

describe('BlockCardComponent', () => {
  let component: BlockCardComponent;
  let fixture: ComponentFixture<BlockCardComponent>;
  
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BlockCardComponent]
    }).compileComponents();
    
    fixture = TestBed.createComponent(BlockCardComponent);
    component = fixture.componentInstance;
  });
  
  it('should update completion status when confirmed', async () => {
    const mockBlock = {
      id: '1',
      name: 'Deep Work',
      status: 'pending' as const
    };
    
    fixture.componentRef.setInput('block', mockBlock);
    fixture.detectChanges();
    
    // Simular confirmación
    await component.confirmCompletion('Terminé el módulo de auth');
    
    expect(component.block().status).toBe('completed');
  });
});
```

### Service Testing with Mocks

```typescript
describe('BlocksRepository', () => {
  let repo: BlocksRepository;
  let mockSupabase: jasmine.SpyObj<SupabaseClient>;
  
  beforeEach(() => {
    mockSupabase = jasmine.createSpyObj('SupabaseClient', ['from']);
    
    TestBed.configureTestingModule({
      providers: [
        BlocksRepository,
        { provide: SupabaseService, useValue: { client: mockSupabase } }
      ]
    });
    
    repo = TestBed.inject(BlocksRepository);
  });
  
  it('should fetch daily blocks', async () => {
    const mockData = [{ id: '1', name: 'Gym' }];
    mockSupabase.from.and.returnValue({
      select: () => ({
        eq: () => ({
          eq: () => Promise.resolve({ data: mockData, error: null })
        })
      })
    } as any);
    
    const result = await repo.getDailyBlocks('user-1', '2025-01-30');
    
    expect(result).toEqual(mockData);
  });
});
```

## Troubleshooting Common Issues

### Issue: Notificaciones no aparecen en iOS

**Causa**: Permisos no solicitados correctamente

**Solución**:
```typescript
// Solicitar permisos DESPUÉS de que el usuario interactúe
async requestNotificationPermissions() {
  const result = await LocalNotifications.requestPermissions();
  
  if (result.display !== 'granted') {
    // Mostrar dialog explicando por qué son necesarias
    this.showPermissionsExplanation();
  }
}
```

### Issue: App se congela en sincronización

**Causa**: Operaciones síncronas en main thread

**Solución**: Usar Web Workers
```typescript
// sync.worker.ts
addEventListener('message', async (e) => {
  const { blocks } = e.data;
  
  // Procesamiento pesado aquí
  const processed = await heavySync(blocks);
  
  postMessage({ result: processed });
});
```

### Issue: Memoria creciente en listas largas

**Causa**: No usar virtual scrolling

**Solución**: Implementar `cdk-virtual-scroll-viewport` (ver sección Performance)

---

## Scripts de Automatización

### Generar Componente Mobile-Ready

```bash
#!/bin/bash
# scripts/generate-mobile-component.sh

COMPONENT_NAME=$1

ng generate component "features/${COMPONENT_NAME}" \
  --standalone=true \
  --change-detection=OnPush \
  --skip-tests=false \
  --style=scss

echo "✅ Componente mobile-ready creado en features/${COMPONENT_NAME}"
```

### Sincronizar Tipos de Supabase

```bash
#!/bin/bash
# scripts/sync-supabase-types.sh

npx supabase gen types typescript \
  --project-id $SUPABASE_PROJECT_ID \
  > src/app/core/supabase/database.types.ts

echo "✅ Tipos de Supabase actualizados"
```

---

## Checklist de Code Review

Antes de merge, verificar:

- [ ] Todos los componentes usan `ChangeDetectionStrategy.OnPush`
- [ ] State management usa NgRx Signals (no NgRx Store)
- [ ] Sincronización escribe primero a SQLite, luego a Supabase
- [ ] Notificaciones tienen haptic feedback
- [ ] Touch targets mínimo 44x44px
- [ ] Animaciones GSAP optimizadas (`willChange` usado correctamente)
- [ ] Tests cubren casos offline y online
- [ ] Safe area insets considerados para iOS

---

**Versión**: 1.0.0  
**Última actualización**: 2025-01-30  
**Compatibilidad**: Angular 18+, Capacitor 6+, PrimeNG 18+
