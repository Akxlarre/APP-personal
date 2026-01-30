# Life Blocks App - Agent Skills Package

Colección de skills especializadas para desarrollo de Life Blocks App con Angular, Capacitor, Supabase y PrimeNG.

## 🎯 Qué son las Skills

Las **skills** son paquetes de conocimiento especializado que extienden las capacidades de agentes de IA como Cursor, Claude Code, y otros editores asistidos por IA. Cada skill contiene:

- **SKILL.md**: Guía completa con patrones, ejemplos y best practices
- **Scripts**: Automatizaciones opcionales para tareas repetitivas
- **Contexto específico**: Conocimiento profundo del dominio

Inspiradas en el formato de [Vercel Agent Skills](https://github.com/vercel-labs/agent-skills).

---

## 📦 Skills Incluidas

### 1. Angular Capacitor Patterns
**Archivo**: `angular-capacitor-patterns.zip`

Arquitectura y patrones para apps móviles híbridas con Angular 18+, Capacitor 6, PrimeNG y GSAP.

**Cuándo usar**:
- Crear componentes móviles optimizados
- Implementar sincronización offline-first
- Integrar plugins de Capacitor
- Configurar animaciones con GSAP
- Estructurar features con NgRx Signals

**Highlights**:
- ✅ Mobile-first component patterns
- ✅ Offline-first data flow
- ✅ NgRx Signals state management
- ✅ Capacitor plugins integration
- ✅ PrimeNG mobile optimizations
- ✅ GSAP animation patterns
- ✅ Performance optimization techniques

---

### 2. Supabase Offline Sync
**Archivo**: `supabase-offline-sync.zip`

Estrategias de sincronización bidireccional entre SQLite local y Supabase PostgreSQL.

**Cuándo usar**:
- Implementar arquitectura offline-first
- Sincronizar datos entre dispositivo y cloud
- Resolver conflictos de escritura concurrente
- Manejar queue de operaciones pendientes
- Implementar reconexión automática

**Highlights**:
- ✅ Local-first architecture
- ✅ Conflict resolution strategies
- ✅ Sync queue management
- ✅ SQLite + Supabase integration
- ✅ Row Level Security patterns
- ✅ Background sync service
- ✅ Network state handling

---

### 3. Habit Gamification
**Archivo**: `habit-gamification.zip`

Sistema completo de gamificación para formación de hábitos con rachas, deuda de bloques y mecánicas basadas en aversión a la pérdida.

**Cuándo usar**:
- Implementar sistemas de accountability
- Crear tracking de hábitos
- Diseñar mecánicas de gamificación
- Manejar streaks y milestones
- Implementar deuda de tareas

**Highlights**:
- ✅ Streak tracking system
- ✅ Streak freeze mechanics
- ✅ Habit debt queue
- ✅ Milestone achievements
- ✅ Loss aversion psychology
- ✅ Recovery mode strategies
- ✅ Celebration animations

---

## 🚀 Instalación

### Opción 1: Instalación con `npx skills` (Recomendado)

Si tienes un repositorio Git con estas skills:

```bash
# Instalar todas las skills
npx skills add tu-usuario/life-blocks-skills --all

# Instalar skill específica
npx skills add tu-usuario/life-blocks-skills --skill angular-capacitor-patterns
```

### Opción 2: Instalación Manual en Cursor

1. **Descargar los archivos .zip**
2. **Descomprimir en directorio de skills de Cursor**:

```bash
# Linux/Mac
unzip angular-capacitor-patterns.zip -d ~/.cursor/skills/

# Windows
# Descomprimir manualmente en %USERPROFILE%\.cursor\skills\
```

3. **Verificar instalación**:
```bash
ls ~/.cursor/skills/
# Deberías ver:
# - angular-capacitor-patterns/
# - supabase-offline-sync/
# - habit-gamification/
```

### Opción 3: Instalación en Claude Code

```bash
# Copiar skills al directorio de Claude Code
cp -r angular-capacitor-patterns/ ~/.claude-code/skills/
cp -r supabase-offline-sync/ ~/.claude-code/skills/
cp -r habit-gamification/ ~/.claude-code/skills/
```

---

## 🎮 Cómo Usar las Skills

Una vez instaladas, las skills se activan automáticamente cuando:

1. **Creas archivos relacionados**:
```typescript
// Al crear este archivo, se activa angular-capacitor-patterns
// src/app/features/blocks/components/block-card.component.ts

@Component({
  selector: 'app-block-card',
  // La skill sugerirá ChangeDetectionStrategy.OnPush
})
```

2. **Preguntas al agente**:
```
User: "¿Cómo implemento sincronización offline con Supabase?"
Agent: [Lee automáticamente supabase-offline-sync/SKILL.md]
       "Para implementar sync offline-first, sigue este patrón..."
```

3. **Tareas específicas**:
```
User: "Necesito crear un sistema de rachas para hábitos"
Agent: [Activa habit-gamification skill]
       "Te ayudo a implementar el sistema de streaks..."
```

---

## 📖 Estructura de cada Skill

```
skill-name/
├── SKILL.md              # Documentación principal
├── scripts/              # Scripts de automatización (opcional)
│   └── example.sh
└── skill-name.zip        # Paquete para distribución
```

### Formato del SKILL.md

```markdown
---
name: skill-name
description: Breve descripción de cuándo usar esta skill
---

# Título de la Skill

Descripción detallada...

## Cuándo Usar Esta Skill
- Caso de uso 1
- Caso de uso 2

## Patrones y Ejemplos
...código TypeScript...

## Troubleshooting
...
```

---

## 🔧 Configuración del Proyecto

### Prerrequisitos

```json
{
  "dependencies": {
    "@angular/core": "^18.0.0",
    "@capacitor/core": "^6.0.0",
    "@supabase/supabase-js": "^2.38.0",
    "primeng": "^18.0.0",
    "gsap": "^3.12.0",
    "@ngrx/signals": "^18.0.0"
  }
}
```

### Variables de Entorno

```typescript
// src/environments/environment.ts
export const environment = {
  production: false,
  supabaseUrl: 'YOUR_SUPABASE_URL',
  supabaseAnonKey: 'YOUR_SUPABASE_ANON_KEY'
};
```

---

## 🎯 Ejemplos de Uso

### Ejemplo 1: Crear Componente con Patterns

```bash
# El agente usará angular-capacitor-patterns automáticamente
```

**Input**:
```
User: "Crea un componente para mostrar la tarjeta de un bloque de tiempo"
```

**Output** (con skill activa):
```typescript
@Component({
  selector: 'app-block-card',
  standalone: true,
  imports: [CommonModule, CardModule, ButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush, // ✅ Sugerido por skill
  template: `
    <p-card>
      <div class="block-info">
        <h3>{{ block().name }}</h3>
        <span>{{ block().startTime }} - {{ block().endTime }}</span>
      </div>
    </p-card>
  `
})
export class BlockCardComponent {
  block = input.required<DailyBlock>(); // ✅ Signal inputs
}
```

### Ejemplo 2: Implementar Sync Service

**Input**:
```
User: "Necesito un servicio para sincronizar bloques entre SQLite y Supabase"
```

**Output** (con supabase-offline-sync):
```typescript
// El agente genera el servicio completo siguiendo los patrones
// de la skill, incluyendo:
// - Queue de operaciones
// - Resolución de conflictos
// - Manejo de red offline
```

### Ejemplo 3: Sistema de Rachas

**Input**:
```
User: "Implementa el sistema de rachas con Streak Freeze"
```

**Output** (con habit-gamification):
```typescript
// Genera StreakService completo con:
// - Lógica de incremento de racha
// - Detección de ruptura
// - Streak Freeze mechanics
// - Milestone achievements
```

---

## 🧪 Testing

Las skills incluyen patrones de testing recomendados:

```typescript
// Ejemplo de test sugerido por angular-capacitor-patterns
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
  
  it('should display block info correctly', () => {
    const mockBlock = {
      id: '1',
      name: 'Deep Work',
      startTime: '08:00',
      endTime: '12:00'
    };
    
    fixture.componentRef.setInput('block', mockBlock);
    fixture.detectChanges();
    
    const compiled = fixture.nativeElement;
    expect(compiled.querySelector('h3').textContent).toBe('Deep Work');
  });
});
```

---

## 📚 Referencias y Recursos

### Angular
- [Angular Docs](https://angular.dev)
- [NgRx Signals](https://ngrx.io/guide/signals)

### Capacitor
- [Capacitor Docs](https://capacitorjs.com/docs)
- [Capacitor Plugins](https://capacitorjs.com/docs/plugins)

### Supabase
- [Supabase Docs](https://supabase.com/docs)
- [Supabase JS Client](https://supabase.com/docs/reference/javascript)

### PrimeNG
- [PrimeNG Components](https://primeng.org/components)
- [PrimeNG Themes](https://primeng.org/theming)

### GSAP
- [GSAP Docs](https://gsap.com/docs/v3/)
- [GSAP Plugins](https://gsap.com/docs/v3/Plugins)

---

## 🤝 Contribuir

Si deseas agregar nuevas skills o mejorar las existentes:

1. **Crear nueva skill**:
```bash
mkdir nueva-skill
cd nueva-skill
touch SKILL.md
mkdir scripts
```

2. **Seguir el formato**:
```markdown
---
name: nueva-skill
description: Descripción concisa
---

# Título

Contenido...
```

3. **Empaquetar**:
```bash
zip -r nueva-skill.zip nueva-skill/
```

---

## 📄 Licencia

MIT License - Uso libre para Life Blocks App y derivados.

---

## 🔗 Links Útiles

- **Proyecto Principal**: Life Blocks App
- **Stack**: Angular 18 + Capacitor 6 + Supabase + PrimeNG
- **Inspirado por**: [Vercel Agent Skills](https://skills.sh)

---

## 🆘 Troubleshooting

### Skill no se activa

**Problema**: El agente no usa la skill cuando debería.

**Solución**:
1. Verificar que SKILL.md esté en la ruta correcta
2. Reiniciar el editor (Cursor/Claude Code)
3. Verificar que la descripción incluya palabras clave relevantes

### Conflictos entre skills

**Problema**: Dos skills dan sugerencias contradictorias.

**Solución**:
1. Las skills están diseñadas para ser complementarias
2. Si hay conflicto, la skill más específica tiene prioridad
3. Puedes desactivar temporalmente una skill moviéndola fuera del directorio

---

**Última actualización**: 2025-01-30  
**Versión**: 1.0.0  
**Autor**: Life Blocks Team
