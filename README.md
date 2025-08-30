# Bolsillito (Demo)

Bolsillito es mi **primera aplicación web** creada como un proyecto de aprendizaje para gestionar presupuestos personales. Es una demo no destinada a la comercialización, diseñada para explorar conceptos de desarrollo web con HTML, CSS y JavaScript. Permite rastrear ingresos, gastos y ahorros en categorías semanales, mensuales y de ahorro, con visualizaciones básicas y alertas. Todo se ejecuta en el navegador y usa LocalStorage para persistencia. **Nota**: Muchas funcionalidades son prototipos y no están completamente implementadas o pulidas.

## Características Principales (Demo)

- **Gestión de Ingresos y Presupuestos**: Ingresa un ingreso mensual y asigna porcentajes a categorías (semanal, mensual, ahorros) con sliders. Los porcentajes se limitan al 100%.
- **Categorías Personalizadas**: Agrega/elimina subcategorías con íconos y gastos (funcionalidad básica).
- **Períodos Temporales**: Navega entre vistas semanales/mensuales con fechas automáticas (navegación a futuro limitada).
- **Visualizaciones**: Gráficos de barras simples para gastos vs. presupuesto (funcionalidad limitada).
- **Análisis Inteligente**: Estadísticas básicas de ahorros y sugerencias (prototipo, no siempre precisas).
- **Alertas**: Notificaciones para exceder presupuestos o errores (parcialmente implementadas).
- **Exportar/Importar Datos**: Soporte básico para CSV (puede ser inestable).
- **Responsive**: Diseño adaptable, pero no totalmente optimizado.
- **Persistencia Local**: Datos guardados en LocalStorage con opción de reinicio.

**Advertencia**: Esta es una demo educativa. Algunas funciones, como gráficos avanzados, validaciones robustas o configuraciones completas, no están implementadas o pueden fallar.

## Instalación

No requiere dependencias externas; es una app estática.

1. Clona o descarga el repositorio:
   ```bash
   git clone https://github.com/Francocrosett1/bolsillito.git

2. Navega a la carpeta clonada
   ```bash
   cd bolsillito

4. Abre index.html en un navegador moderno:

   Si tienes Node.js, usa:
   ```bash 
   npx serve

Accede a http://localhost:3000

## Uso

**Inicio**: Abre index.html e ingresa un ingreso mensual. Confirma con el botón ✓.
Presupuestos: Ajusta sliders para asignar porcentajes a categorías. Usa "Max" para el máximo disponible.

Gastos: Agrega gastos con el botón "+" (monto, descripción, ícono, categoría, fecha).

Navegación: Cambia entre períodos (semanal/mensual) con ◀/▶.

Categorías: Expande/contrae con ▼/▶, elimina con el botón de basura.

Análisis y Configuraciones: Explora estadísticas básicas o configura moneda/exportación (funciones limitadas).

**Ejemplo**:

Ingresa $100,000.

Asigna 50% Semanal, 30% Mensual, 20% Ahorros.

Agrega gasto: $2,000 en "Comida" (Semanal).

Revisa barras de progreso (pueden no actualizarse perfectamente).

Estructura del Proyecto

index.html: Interfaz principal.

styles.css: Estilos y animaciones (algunas no optimizadas).

script.js: Lógica de la app (gestión de datos, eventos, LocalStorage).

## Limitaciones

**Prototipo**: Funciones como gráficos, importación/exportación y sugerencias están incompletas o son inestables.

**No Comercial**: No está diseñada para uso real, solo como ejercicio de aprendizaje.

**Errores**: Puede haber bugs en cálculos, persistencia o responsive design.

