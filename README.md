# Ratios Food Cost — Bonita Menorca

Aplicación web para seguimiento de ratios de food cost por centro y semana.

## Estructura del proyecto

```
food-cost-ratios/
├── index.html      # Estructura HTML y modales
├── styles.css      # Estilos (light + dark mode)
├── app.js          # Lógica principal, gráficos, carga de datos
├── data.js         # Datos iniciales de muestra
├── vercel.json     # Configuración de despliegue
└── README.md
```

## Centros incluidos

- BINIFADET
- TAMARINDOS
- TAMARINDOS BAR
- TIRANT
- TIENDA

## Panels disponibles

| Panel | Descripción |
|---|---|
| Dashboard | Métricas globales, 4 gráficos, resumen por centro |
| Semanal por centro | Ingresos/gastos/ratio por semana filtrable por centro |
| Por subfamilia | Detalle de ratios desglosado a nivel subfamilia |
| Presupuesto vs Real | Comparativo semanal real vs presupuesto con barras de progreso |
| ↑ Ingresos | Tabla de ingresos con carga desde Excel |
| ↓ Gastos | Tabla de gastos con carga desde Excel |
| € Presupuesto | Tabla de presupuesto diario por centro |
| Art. Venta | Catálogo artículos Ágora (familia/subfamilia/factor) |
| Art. Compra | Catálogo artículos Yurest (familia/subfamilia/factor) |

## Carga de datos desde Excel

Cada tabla incluye una zona de pegado. El proceso diario de Dakota:

1. Exportar / copiar desde Excel o Yurest/Ágora
2. Abrir la pestaña correspondiente en la app
3. Pulsar **Borrar tabla** para limpiar los datos anteriores
4. Pegar con **Ctrl+V** en el área de texto
5. Pulsar **Cargar datos**

### Formato esperado por tabla

#### Ingresos (Ágora)
```
FECHA   CENTRO   CANAL   ARTICULO   DESCRIPCION   UNIDADES   BASE   PVP   SEMANA   MES   FAMILIA   SUBFAMILIA   FACTOR
```

#### Gastos (Yurest/Dijit)
```
FECHA   CENTRO   PROVEEDOR   PRODUCTO   FAMILIA   SUBFAMILIA   CANTIDAD   UNIDAD   TOTAL   SEMANA   MES
```

#### Presupuesto
```
FECHA   CENTRO   PRESUPUESTO_DIA   SEMANA   MES
```

#### Catálogo artículos venta
```
ID   PRODUCTO   FAMILIA   SUBFAMILIA   FACTOR
```

#### Catálogo artículos compra
```
ID   ARTICULO   UNIDAD   FAMILIA   SUBFAMILIA   FACTOR
```

> Separador: **tabulador** (el que usa Excel por defecto al copiar).  
> Sin fila de cabecera.

## Umbrales de food cost

| Color | Rango | Estado |
|---|---|---|
| 🟢 Verde | ≤ 25% | Óptimo |
| 🟡 Ámbar | 26–35% | Aceptable |
| 🔴 Rojo | > 35% | Elevado |

## Despliegue en Vercel

### Opción A — desde GitHub (recomendado)
1. Subir el repositorio a GitHub
2. Entrar en [vercel.com](https://vercel.com) → New Project
3. Importar el repositorio
4. Vercel detecta automáticamente el proyecto estático
5. Deploy → URL pública en segundos

### Opción B — Vercel CLI
```bash
npm i -g vercel
cd food-cost-ratios
vercel
```

### Opción C — drag & drop
1. Ir a [vercel.com/new](https://vercel.com/new)
2. Arrastrar la carpeta `food-cost-ratios` directamente

## Desarrollo local

Simplemente abrir `index.html` en el navegador, o usar un servidor local:

```bash
# Con Python
python3 -m http.server 3000

# Con Node
npx serve .
```

## Próximas versiones

- [ ] Conexión API Ágora para carga automática de ingresos
- [ ] Conexión API Dijit para carga automática de compras
- [ ] Persistencia de datos (localStorage o base de datos)
- [ ] Exportación a Excel
- [ ] Alertas automáticas por email cuando el ratio supera umbrales
