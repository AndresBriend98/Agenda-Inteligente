# Árbol de Decisión del Sistema Experto

```mermaid
graph TD
    %% Nodos principales
    A[Mensaje del Usuario] --> B{Validar Ambiente}
    B -->|No Válido| C[Error: Ambiente no válido]
    B -->|Válido| D{Verificar Medios}
    D -->|No Disponibles| E[Error: Medios no disponibles]
    D -->|Disponibles| F{Procesar Percepción}
    F -->|No Válida| G[Error: Percepción no válida]
    F -->|Válida| H[Análisis de Intención]

    %% Análisis de Intención
    H --> I{¿Qué acción?}
    I -->|Crear| J{¿Qué tipo?}
    I -->|Eliminar| K{¿Qué tipo?}
    I -->|Modificar| L{¿Qué tipo?}
    I -->|Mover| M{¿Qué tipo?}

    %% Crear
    J -->|Columna| N[Crear Columna]
    J -->|Tarea| O[Crear Tarea]

    %% Eliminar
    K -->|Columna| P[Eliminar Columna]
    K -->|Tarea| Q[Eliminar Tarea]

    %% Modificar
    L -->|Tarea| R[Modificar Tarea]

    %% Mover
    M -->|Tarea| S[Mover Tarea]

    %% Proceso de Creación
    N --> T{¿Existe?}
    O --> T
    T -->|Sí| U{¿Qué hacer?}
    T -->|No| V[Crear Nuevo]
    U -->|Actualizar| W[Actualizar Existente]
    U -->|Notificar| X[Notificar Usuario]
    U -->|Ignorar| Y[Ignorar]

    %% Validación de Datos
    V --> Z{¿Datos Completos?}
    Z -->|No| AA[Completar Datos]
    Z -->|Sí| AB[Procesar]
    AA --> AB

    %% Estilos
    classDef decision fill:#f9f,stroke:#333,stroke-width:2px
    classDef action fill:#bbf,stroke:#333,stroke-width:2px
    classDef error fill:#fbb,stroke:#333,stroke-width:2px
    classDef process fill:#bfb,stroke:#333,stroke-width:2px

    class B,D,F,I,J,K,L,M,T,U,Z decision
    class N,O,P,Q,R,S,V,W,X,Y,AA,AB action
    class C,E,G error
    class H process
```

## Explicación del Árbol de Decisión

### 1. Nodos de Decisión (Rosa)
- **Validar Ambiente**: Verifica si el entorno es adecuado
- **Verificar Medios**: Comprueba disponibilidad de recursos
- **Procesar Percepción**: Analiza el mensaje
- **¿Qué acción?**: Determina el tipo de acción
- **¿Qué tipo?**: Identifica si es tarea o columna
- **¿Existe?**: Verifica existencia del elemento
- **¿Qué hacer?**: Decide manejo de elementos existentes
- **¿Datos Completos?**: Verifica información necesaria

### 2. Nodos de Acción (Azul)
- **Crear Columna/Tarea**: Crea nuevos elementos
- **Eliminar Columna/Tarea**: Elimina elementos
- **Modificar Tarea**: Actualiza tareas
- **Mover Tarea**: Cambia ubicación
- **Actualizar Existente**: Modifica elementos
- **Notificar Usuario**: Informa resultados
- **Ignorar**: No realiza acción
- **Completar Datos**: Agrega información
- **Procesar**: Ejecuta acción

### 3. Nodos de Error (Rojo)
- **Error de Ambiente**: Problemas con entorno
- **Error de Medios**: Falta de recursos
- **Error de Percepción**: Problemas de procesamiento

### 4. Nodos de Proceso (Verde)
- **Análisis de Intención**: Procesa el mensaje

## Flujo de Decisión

1. El sistema recibe un mensaje del usuario
2. Valida el ambiente y los medios disponibles
3. Procesa la percepción del mensaje
4. Analiza la intención del usuario
5. Determina la acción y el tipo de elemento
6. Verifica la existencia del elemento
7. Decide cómo manejar el elemento
8. Valida y completa los datos necesarios
9. Ejecuta la acción correspondiente

## Consideraciones

- Cada decisión incluye validaciones necesarias
- El sistema maneja errores en cada paso
- Las acciones se ejecutan en orden de prioridad
- El árbol permite diferentes caminos de decisión
- Se pueden agregar nuevas ramas según sea necesario 