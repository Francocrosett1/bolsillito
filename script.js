document.addEventListener('DOMContentLoaded', function() {
    // Variables globales simplificadas
    const categoriasPrincipales = [
        { input: 'semanalBudget', id: 'semanal' },
        { input: 'mensualBudget', id: 'mensual' },
        { input: 'ahorrosBudget', id: 'ahorros' }
    ];

    // Variables para el manejo de períodos
    let tipoPeriodoActual = 'semanal';
    let periodoActual = new Date();
    
    // Función para obtener el rango de fechas del período actual
    function obtenerRangoPeriodo(fecha, tipo) {
        const fechaBase = new Date(fecha);
        let inicio, fin;
        
        if (tipo === 'semanal') {
            // Obtener el lunes de la semana
            const diaSemana = fechaBase.getDay();
            const diasAlLunes = diaSemana === 0 ? -6 : 1 - diaSemana;
            inicio = new Date(fechaBase);
            inicio.setDate(fechaBase.getDate() + diasAlLunes);
            
            // El domingo siguiente
            fin = new Date(inicio);
            fin.setDate(inicio.getDate() + 6);
        } else if (tipo === 'mensual') {
            // Primer día del mes
            inicio = new Date(fechaBase.getFullYear(), fechaBase.getMonth(), 1);
            // Último día del mes
            fin = new Date(fechaBase.getFullYear(), fechaBase.getMonth() + 1, 0);
        }
        
        return { inicio, fin };
    }
    
    // Caché de elementos DOM
    const domCache = {
        ingresoMensual: null,
        mostrarIngreso: null,
        alertasContainer: null,
        init() {
            this.ingresoMensual = document.getElementById('ingresoMensual');
            this.mostrarIngreso = document.getElementById('mostrarIngreso');
        }
    };

    // Sistema de alertas optimizado
    function mostrarAlerta(texto, icono = '⚠️', color = '#f44336') {
        // Usar caché para el contenedor de alertas
        if (!domCache.alertasContainer) {
            domCache.alertasContainer = document.getElementById('alertas-container');
            if (!domCache.alertasContainer) {
                domCache.alertasContainer = document.createElement('div');
                domCache.alertasContainer.id = 'alertas-container';
                domCache.alertasContainer.style.cssText = `
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    z-index: 1000;
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                    max-width: 300px;
                    pointer-events: none;
                `;
                document.body.appendChild(domCache.alertasContainer);
            }
        }
        
        const alerta = document.createElement('div');
        alerta.className = 'budget-alert';
        alerta.style.cssText = `
            background: white;
            border-left: 4px solid ${color};
            border-radius: 8px;
            padding: 16px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            display: flex;
            align-items: center;
            gap: 12px;
            animation: slideInAlert 0.3s ease-out;
            pointer-events: auto;
            margin-bottom: 8px;
        `;
        
        // Usar plantilla literal más eficiente
        alerta.innerHTML = `
            <span style="font-size: 20px;">${icono}</span>
            <span style="color: #333; font-weight: 500; flex: 1;">${texto}</span>
            <button onclick="this.parentElement.remove()" style="
                background: none;
                border: none;
                font-size: 18px;
                color: #666;
                cursor: pointer;
                padding: 4px;
                border-radius: 4px;
                transition: background 0.2s;
            " onmouseover="this.style.background='#f0f0f0'" onmouseout="this.style.background='none'">✕</button>
        `;
        
        domCache.alertasContainer.appendChild(alerta);
        
        // Remover automáticamente después de 5 segundos
        setTimeout(() => alerta?.remove(), 5000);
    }

    // Función de inicialización con verificación de errores
    function inicializarApp() {
        try {
            console.log('🚀 Iniciando Bolsillito...');
            
            // Verificar elementos críticos
            const elementosCriticos = [
                'ingresoMensual',
                'semanalBudget', 
                'mensualBudget',
                'ahorrosBudget'
            ];
            
            const elementosFaltantes = elementosCriticos.filter(id => !document.getElementById(id));
            if (elementosFaltantes.length > 0) {
                console.warn('❌ Elementos faltantes:', elementosFaltantes);
                mostrarAlerta(`Elementos faltantes: ${elementosFaltantes.join(', ')}`, '⚠️', '#ff9800');
            }
            
            // Inicializar funciones principales
            cargarDatos();
            cargarEstadoIngreso();
            actualizarVisualizacionPeriodo();
            actualizarPresupuesto();
            
            console.log('✅ Bolsillito iniciado correctamente');
            
        } catch (error) {
            console.error('❌ Error al inicializar la app:', error);
            mostrarAlerta('Error al iniciar la aplicación. Recarga la página.', '❌', '#f44336');
        }
    }

    // Inicializar aplicación con verificación
    inicializarApp();
    
    // Agregar detectores de eventos para los controles deslizantes
    categoriasPrincipales.forEach(cat => {
        const slider = document.getElementById(cat.input);
        if (slider) {
            slider.addEventListener('input', actualizarPresupuesto);
            slider.addEventListener('change', actualizarPresupuesto);
        }
    });
    
    // Detector de eventos para el campo de ingresos con validación mejorada
    const ingresoInput = document.getElementById('ingresoMensual');
    if (ingresoInput) {
        ingresoInput.addEventListener('input', function(e) {
            const valor = parseFloat(e.target.value);
            const contenedor = e.target.parentElement;
            
            // Remover clases previas
            contenedor.classList.remove('income-valid', 'income-invalid');
            
            if (valor && valor > 0) {
                if (valor > 100000000) {
                    contenedor.classList.add('income-invalid');
                    mostrarAlerta('El ingreso máximo permitido es $100,000,000', '⚠️', '#ff9800');
                } else {
                    contenedor.classList.add('income-valid');
                }
            }
            
            actualizarPresupuesto();
        });
        
        ingresoInput.addEventListener('change', actualizarPresupuesto);
        
        // Validación al pegar texto
        ingresoInput.addEventListener('paste', function(e) {
            setTimeout(() => {
                const valor = parseFloat(e.target.value);
                if (valor && valor > 100000000) {
                    e.target.value = '100000000';
                    mostrarAlerta('Valor ajustado al máximo permitido', '⚠️', '#ff9800');
                }
            }, 10);
        });
    }
    
    // Pequeña pausa para asegurar que los gráficos se rendericen correctamente
    setTimeout(() => {
        actualizarGraficos();
    }, 500);

    // Función para formatear el período
    function formatearPeriodo(inicio, fin, tipo) {
        const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
                      'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        
        if (tipo === 'semanal') {
            const inicioMes = meses[inicio.getMonth()];
            const finMes = meses[fin.getMonth()];
            const iniciodia = inicio.getDate();
            const finDia = fin.getDate();
            
            if (inicio.getMonth() === fin.getMonth()) {
                return `${inicioMes} ${iniciodia} - ${finDia}, ${inicio.getFullYear()}`;
            } else {
                return `${inicioMes} ${iniciodia} - ${finMes} ${finDia}, ${inicio.getFullYear()}`;
            }
        } else {
            const mes = meses[inicio.getMonth()];
            return `${mes} ${inicio.getFullYear()}`;
        }
    }
    
    // Función para actualizar la visualización del período
    function actualizarVisualizacionPeriodo() {
        const rango = obtenerRangoPeriodo(periodoActual, tipoPeriodoActual);
        const textoFormateado = formatearPeriodo(rango.inicio, rango.fin, tipoPeriodoActual);
        const currentPeriodEl = document.getElementById('currentPeriod');
        
        if (currentPeriodEl) {
            currentPeriodEl.textContent = textoFormateado;
        }
        
        // Verificar si se puede ir hacia atrás (verificar período anterior)
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        
        let periodoAnterior = new Date(periodoActual);
        if (tipoPeriodoActual === 'semanal') {
            periodoAnterior.setDate(periodoAnterior.getDate() - 7);
        } else {
            periodoAnterior.setMonth(periodoAnterior.getMonth() - 1);
        }
        
        const rangoAnterior = obtenerRangoPeriodo(periodoAnterior, tipoPeriodoActual);
        const botonAnterior = document.querySelector('.period-nav-btn[onclick="cambiarPeriodo(-1)"]');
        
        if (botonAnterior) {
            if (rangoAnterior.fin < hoy) {
                botonAnterior.disabled = true;
                botonAnterior.style.opacity = '0.3';
                botonAnterior.style.cursor = 'not-allowed';
            } else {
                botonAnterior.disabled = false;
                botonAnterior.style.opacity = '1';
                botonAnterior.style.cursor = 'pointer';
            }
        }
        
        // Aquí podríamos filtrar los datos por el período seleccionado
        // Los datos se actualizarán automáticamente con la interfaz
    }

    // Función principal para actualizar el presupuesto (optimizada)
    function actualizarPresupuesto() {
        // Inicializar caché si no existe
        if (!domCache.ingresoMensual) {
            domCache.init();
        }

        // Obtener ingreso optimizado
        let ingresoMensual = 0;
        const valorConfirmado = localStorage.getItem('confirmedIncomeValue');
        const ingresoConfirmado = localStorage.getItem('incomeConfirmed');
        
        if (ingresoConfirmado === 'true' && valorConfirmado) {
            ingresoMensual = parseFloat(valorConfirmado);
        } else {
            ingresoMensual = parseFloat(domCache.ingresoMensual?.value) || 0;
        }
        
        if (domCache.mostrarIngreso) {
            domCache.mostrarIngreso.textContent = `$${ingresoMensual.toFixed(2)}`;
        }

        // Caché de elementos para mejor rendimiento
        const cacheElementos = new Map();
        const obtenerElemento = (id) => {
            if (!cacheElementos.has(id)) {
                cacheElementos.set(id, document.getElementById(id));
            }
            return cacheElementos.get(id);
        };

        // Calcular porcentajes de manera más eficiente
        const porcentajes = categoriasPrincipales.map(cat => parseFloat(obtenerElemento(cat.input)?.value) || 0);
        const total = porcentajes.reduce((a, b) => a + b, 0);
        
        // Limitar a 100% solo si es necesario
        if (total > 100 && document.activeElement?.type === 'range') {
            const indice = categoriasPrincipales.findIndex(cat => cat.input === document.activeElement.id);
            if (indice !== -1) {
                const otros = porcentajes.reduce((a, b, i) => i === indice ? a : a + b, 0);
                document.activeElement.value = Math.max(0, 100 - otros);
                porcentajes[indice] = Math.max(0, 100 - otros);
            }
        }
        
        // Actualizar interfaz de categorías de manera optimizada
        const fragment = document.createDocumentFragment();
        categoriasPrincipales.forEach((cat, i) => {
            const input = obtenerElemento(cat.input);
            if (!input) return;
            
            const porcentaje = porcentajes[i];
            const valor = ingresoMensual * porcentaje / 100;
            
            // Batch de actualizaciones de estilo
            input.style.setProperty('--range-progress', porcentaje + '%');
            const color = porcentaje >= 80 ? '#f44336' : porcentaje >= 40 ? '#ffeb3b' : '#4caf50';
            input.style.setProperty('--thumb-color', color);
            
            // Actualizar textos con menos queries
            const contenedor = input.closest('.category-item');
            if (contenedor) {
                const budgetLabel = contenedor.querySelector('.budget-label');
                const budgetValue = contenedor.querySelector('.budget-range-value');
                
                if (budgetLabel) budgetLabel.textContent = `Presupuestado (${porcentaje.toFixed(0)}%)`;
                if (budgetValue) budgetValue.textContent = `$${valor.toFixed(2)}`;
            }
            
            // Calcular restante de forma más eficiente
            const gastoReal = calcularGastoCategoria(cat.id);
            const restante = valor - gastoReal;
            const spanRestante = obtenerElemento(`${cat.id}Remaining`);
            
            if (spanRestante) {
                spanRestante.textContent = `$${restante.toFixed(2)}`;
                spanRestante.className = `remaining-amount ${restante < 0 ? 'negative' : restante === 0 ? 'zero' : ''}`;
            }
        });
        
        // Lote de actualizaciones del DOM
        requestAnimationFrame(() => {
            actualizarBotonesMax();
            guardarDatos();
            actualizarEstadisticas();
            actualizarResumen();
        });
    }

    // Caché para gastos por categoría (mejora rendimiento)
    const gastosCache = new Map();
    let cacheTimeout = null;

    // Función optimizada para calcular gasto por categoría (solo gastos pagados)
    function calcularGastoCategoria(idCategoria) {
        // Usar caché con invalidación cada 100ms
        if (gastosCache.has(idCategoria)) {
            return gastosCache.get(idCategoria);
        }

        const contenedor = document.getElementById(`${idCategoria}Custom`);
        let total = 0;
        if (contenedor) {
            const categoryItems = contenedor.querySelectorAll('.category-item');
            for (const item of categoryItems) {
                const input = item.querySelector('.spent-input');
                const gastoValue = parseFloat(input.value) || 0;
                
                // Solo contar si el gasto está pagado
                if (gastoValue > 0) {
                    const gastoInfoStr = item.dataset.gastoInfo;
                    if (gastoInfoStr) {
                        try {
                            const gastoInfo = JSON.parse(gastoInfoStr);
                            if (gastoInfo.pagado) {
                                total += gastoValue;
                            }
                        } catch (e) {
                            console.warn('Error al parsear gastoInfo:', e);
                            // Si no hay información de pago, asumimos que no está pagado
                        }
                    }
                    // Si no hay gastoInfo, no se cuenta (no está pagado)
                }
            }
        }

        // Guardar el resultado en caché
        gastosCache.set(idCategoria, total);
        
        // Limpiar caché después de un breve período
        clearTimeout(cacheTimeout);
        cacheTimeout = setTimeout(() => gastosCache.clear(), 100);
        
        return total;
    }

    // Función para actualizar estadísticas
    function actualizarEstadisticas() {
        const ingreso = parseFloat(document.getElementById('ingresoMensual').value) || 0;
        const porcentajeAhorros = parseFloat(document.getElementById('ahorrosBudget').value) || 0;
        const ahorros = ingreso * porcentajeAhorros / 100;
        
        let totalGastado = 0;
        ['semanalCustom', 'mensualCustom', 'ahorrosCustom'].forEach(id => {
            const contenedor = document.getElementById(id);
            if (contenedor) {
                contenedor.querySelectorAll('.budget-input-hidden').forEach(input => {
                    totalGastado += parseFloat(input.value) || 0;
                });
            }
        });
        
        // Actualizar elementos solo si existen
        const totalSavedEl = document.getElementById('totalSaved');
        const totalSpentEl = document.getElementById('totalSpent');
        const savingsRateEl = document.getElementById('savingsRate');
        const categoryCountEl = document.getElementById('categoryCount');
        
        if (totalSavedEl) totalSavedEl.textContent = `$${ahorros.toFixed(2)}`;
        if (totalSpentEl) totalSpentEl.textContent = `$${totalGastado.toFixed(2)}`;
        if (savingsRateEl) savingsRateEl.textContent = `${porcentajeAhorros.toFixed(0)}%`;
        
        let categorias = 3;
        ['semanalCustom', 'mensualCustom', 'ahorrosCustom'].forEach(id => {
            const container = document.getElementById(id);
            if (container) {
                categorias += container.children.length;
            }
        });
        if (categoryCountEl) categoryCountEl.textContent = categorias;
        
        // Actualizar gráficos
        actualizarGraficos();
    }
    
    // Función para formatear valores en pesos argentinos
    function formatearPesos(valor) {
        if (valor >= 1000000) {
            return `$${(valor/1000000).toFixed(1)}M`;
        } else if (valor >= 1000) {
            return `$${(valor/1000).toFixed(0)}k`;
        } else {
            return `$${valor.toLocaleString('es-AR', {minimumFractionDigits: 0, maximumFractionDigits: 0})}`;
        }
    }
    
    // Función para actualizar gráficos dinámicamente
    function actualizarGraficos() {
        const ingreso = parseFloat(document.getElementById('ingresoMensual').value) || 0;
        
        // Calcular totales por categoría
        let totalPresupuestado = 0;
        let totalGastado = 0;
        
        categoriasPrincipales.forEach(cat => {
            const porcentaje = parseFloat(document.getElementById(cat.input).value) || 0;
            totalPresupuestado += ingreso * porcentaje / 100;
        });
        
        ['semanalCustom', 'mensualCustom', 'ahorrosCustom'].forEach(id => {
            const contenedor = document.getElementById(id);
            if (contenedor) {
                contenedor.querySelectorAll('.spent-input').forEach(input => {
                    totalGastado += parseFloat(input.value) || 0;
                });
            }
        });
        
        // Generar datos para gráfico mensual (simulados basados en datos reales)
        const gastadoEnPesos = totalGastado;
        const presupuestadoEnPesos = totalPresupuestado;
        actualizarGraficoMensual(gastadoEnPesos, presupuestadoEnPesos);
        
        // Generar datos para comparación (simulados)
        actualizarGraficoComparacion(gastadoEnPesos);
    }
    
    // Función para actualizar gráfico mensual
    function actualizarGraficoMensual(gastado, presupuestado) {
        const svg = document.querySelector('#spendingChart .chart-svg');
        if (!svg) return;
        
        // Calcular el valor máximo como 150% del presupuesto
        const maxValue = Math.max(presupuestado * 1.5, gastado, 1000);
        const chartHeight = 120;
        
        // Actualizar etiquetas del eje Y dinámicamente (máximo = 1.5x presupuesto)
        const yLabels = document.querySelectorAll('#spendingChart .y-axis-labels span');
        if (yLabels.length >= 4) {
            yLabels[0].textContent = '$0';
            yLabels[1].textContent = formatearPesos(maxValue * 0.33);  // ~50% presupuesto
            yLabels[2].textContent = formatearPesos(maxValue * 0.67);  // ~100% presupuesto (línea presupuesto)  
            yLabels[3].textContent = formatearPesos(maxValue);         // 150% presupuesto (máximo)
        }
        
        // Actualizar leyenda del presupuesto dinámicamente
        const budgetLegend = document.querySelector('.budget-line + .legend-text');
        if (budgetLegend && presupuestado > 0) {
            budgetLegend.textContent = `Presupuestado (${formatearPesos(presupuestado)})`;
        }
        
        // Generar puntos basados en progreso del mes
        const currentDay = new Date().getDate();
        const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
        const progress = currentDay / daysInMonth;
        
        // Puntos de datos para gasto (con variación natural)
        const spentPoints = [
            { x: 20, y: chartHeight - (gastado * 0.2 / maxValue * chartHeight) },
            { x: 80, y: chartHeight - (gastado * 0.4 / maxValue * chartHeight) },
            { x: 140, y: chartHeight - (gastado * 0.65 / maxValue * chartHeight) },
            { x: 200, y: chartHeight - (gastado * 0.85 / maxValue * chartHeight) },
            { x: 260, y: chartHeight - (gastado * progress / maxValue * chartHeight) }
        ];
        
        // Puntos de datos para presupuesto (línea horizontal constante)
        const budgetY = chartHeight - (presupuestado / maxValue * chartHeight);
        const budgetPoints = [
            { x: 20, y: budgetY },
            { x: 260, y: budgetY }
        ];
        
        // Actualizar paths
        const spentPath = svg.querySelector('.spent-path');
        const budgetPath = svg.querySelector('.budget-path');
        
        if (spentPath) {
            const spentPathData = `M${spentPoints.map(p => `${p.x},${p.y}`).join(' L')}`;
            spentPath.setAttribute('d', spentPathData);
        }
        
        if (budgetPath) {
            const budgetPathData = `M${budgetPoints[0].x},${budgetPoints[0].y} L${budgetPoints[1].x},${budgetPoints[1].y}`;
            budgetPath.setAttribute('d', budgetPathData);
            // Asegurar que mantenga el patrón entrecortado
            budgetPath.setAttribute('stroke-dasharray', '8,4');
        }
        
        // Actualizar círculos
        const circles = svg.querySelectorAll('circle');
        spentPoints.forEach((point, index) => {
            if (circles[index]) {
                circles[index].setAttribute('cx', point.x);
                circles[index].setAttribute('cy', point.y);
            }
        });
    }
    
    // Función para actualizar gráfico de comparación
    function actualizarGraficoComparacion(gastoActual) {
        const svg = document.querySelector('.comparison-chart .chart-svg');
        if (!svg) return;
        
        // Simular datos del mes anterior (variación del 80-120% del actual)
        const gastoAnterior = gastoActual * (0.8 + Math.random() * 0.4);
        
        // Calcular el valor máximo como 150% del gasto más alto
        const maxValue = Math.max(gastoActual, gastoAnterior) * 1.5;
        const chartHeight = 100;
        
        // Actualizar etiquetas del eje Y dinámicamente (máximo = 1.5x gasto más alto)
        const yLabels = document.querySelectorAll('.comparison-chart .y-axis-labels span');
        if (yLabels.length >= 3) {
            yLabels[0].textContent = '$0';
            yLabels[1].textContent = formatearPesos(maxValue * 0.67);   // ~100% gasto más alto
            yLabels[2].textContent = formatearPesos(maxValue);         // 150% gasto más alto
        }
        
        // Puntos para mes anterior
        const lastMonthPoints = [
            { x: 20, y: chartHeight - (gastoAnterior * 0.3 / maxValue * chartHeight) },
            { x: 100, y: chartHeight - (gastoAnterior * 0.6 / maxValue * chartHeight) },
            { x: 180, y: chartHeight - (gastoAnterior * 0.8 / maxValue * chartHeight) },
            { x: 260, y: chartHeight - (gastoAnterior / maxValue * chartHeight) }
        ];
        
        // Puntos para este mes
        const currentMonthPoints = [
            { x: 20, y: chartHeight - (gastoActual * 0.25 / maxValue * chartHeight) },
            { x: 100, y: chartHeight - (gastoActual * 0.5 / maxValue * chartHeight) },
            { x: 180, y: chartHeight - (gastoActual * 0.75 / maxValue * chartHeight) },
            { x: 260, y: chartHeight - (gastoActual / maxValue * chartHeight) }
        ];
        
        // Actualizar paths
        const lastMonthPath = svg.querySelector('.last-month-path');
        const currentMonthPath = svg.querySelector('.current-month-path');
        
        if (lastMonthPath) {
            const pathData = `M${lastMonthPoints.map(p => `${p.x},${p.y}`).join(' L')}`;
            lastMonthPath.setAttribute('d', pathData);
        }
        
        if (currentMonthPath) {
            const pathData = `M${currentMonthPoints.map(p => `${p.x},${p.y}`).join(' L')}`;
            currentMonthPath.setAttribute('d', pathData);
        }
        
        // Actualizar círculo final
        const circle = svg.querySelector('circle');
        if (circle) {
            const lastPoint = currentMonthPoints[currentMonthPoints.length - 1];
            circle.setAttribute('cx', lastPoint.x);
            circle.setAttribute('cy', lastPoint.y);
        }
    }

    // Función para actualizar resumen
    function actualizarResumen() {
        let ingresoMensual = 0;
        const valorConfirmado = localStorage.getItem('confirmedIncomeValue');
        const ingresoConfirmado = localStorage.getItem('incomeConfirmed');
        
        if (ingresoConfirmado === 'true' && valorConfirmado) {
            ingresoMensual = parseFloat(valorConfirmado);
        } else {
            ingresoMensual = parseFloat(document.getElementById('ingresoMensual').value) || 0;
        }
        
        let totalPresupuestado = 0;
        let totalGastado = 0;
        
        categoriasPrincipales.forEach(cat => {
            const porcentaje = parseFloat(document.getElementById(cat.input).value) || 0;
            totalPresupuestado += ingresoMensual * porcentaje / 100;
        });
        
        ['semanalCustom', 'mensualCustom', 'ahorrosCustom'].forEach(id => {
            const contenedor = document.getElementById(id);
            if (contenedor) {
                const categoryItems = contenedor.querySelectorAll('.category-item');
                for (const item of categoryItems) {
                    const input = item.querySelector('.spent-input');
                    const gastoValue = parseFloat(input.value) || 0;
                    
                    // Solo contar si el gasto está pagado
                    if (gastoValue > 0) {
                        const gastoInfoStr = item.dataset.gastoInfo;
                        if (gastoInfoStr) {
                            try {
                                const gastoInfo = JSON.parse(gastoInfoStr);
                                if (gastoInfo.pagado) {
                                    totalGastado += gastoValue;
                                }
                            } catch (e) {
                                console.warn('Error al parsear gastoInfo en resumen:', e);
                                // Si no hay información de pago, asumimos que no está pagado
                            }
                        }
                        // Si no hay gastoInfo, no se cuenta (no está pagado)
                    }
                }
            }
        });
        
        const disponible = ingresoMensual - totalPresupuestado;
        
        document.getElementById('totalBudgeted').textContent = `$${totalPresupuestado.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
        document.getElementById('totalSpentSummary').textContent = `$${totalGastado.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
        
        const elementoDisponible = document.getElementById('totalAvailable');
        elementoDisponible.textContent = `$${disponible.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
        
        // Colores dinámicos
        if (disponible < 0) {
            elementoDisponible.style.color = '#f44336';
            elementoDisponible.style.backgroundColor = '#ffebee';
            elementoDisponible.style.padding = '2px 8px';
            elementoDisponible.style.borderRadius = '8px';
        } else if (disponible < ingresoMensual * 0.1) {
            elementoDisponible.style.color = '#ff9800';
            elementoDisponible.style.backgroundColor = '#fff3e0';
            elementoDisponible.style.padding = '2px 8px';
            elementoDisponible.style.borderRadius = '8px';
        } else {
            elementoDisponible.style.color = '#4caf50';
            elementoDisponible.style.backgroundColor = '#e8f5e8';
            elementoDisponible.style.padding = '2px 8px';
            elementoDisponible.style.borderRadius = '8px';
        }
    }

    // Función para formatear fecha a YYYY-MM-DD
    function formatearFecha(fecha) {
        return fecha.toISOString().split('T')[0];
    }

    // Modal y eventos
    const botonAgregar = document.querySelector('.add-button');
    const modal = document.getElementById('modalAgregarGasto');
    const botonCancelar = document.getElementById('botonCancelar');
    const botonGuardar = document.getElementById('botonAgregarGasto');

    console.log('Elementos del modal encontrados:');
    console.log('Botón agregar:', botonAgregar);
    console.log('Modal:', modal);

    if (botonAgregar && modal) {
        botonAgregar.addEventListener('click', () => {
            console.log('Click en botón agregar - abriendo modal');
            modal.classList.remove('hidden');
            inicializarModal();
            console.log('Modal abierto');
        });
        console.log('Event listener del botón agregar registrado correctamente');
    } else {
        console.error('No se pudieron encontrar los elementos del modal');
        if (!botonAgregar) console.error('No se encontró el botón agregar (.add-button)');
        if (!modal) console.error('No se encontró el modal (#modalAgregarGasto)');
    }
    
    // Detectores de eventos para el selector de fecha
    const botonFechaHoy = document.getElementById('botonFechaHoy');
    const botonFechaAyer = document.getElementById('botonFechaAyer');
    const botonFechaPersonalizada = document.getElementById('botonFechaPersonalizada');
    const inputFechaPersonalizada = document.getElementById('inputFechaPersonalizada');
    
    if (botonFechaHoy && botonFechaAyer && botonFechaPersonalizada && inputFechaPersonalizada) {
        [botonFechaHoy, botonFechaAyer, botonFechaPersonalizada].forEach(btn => {
            btn.addEventListener('click', () => {
                // Quitar active de todos
                [botonFechaHoy, botonFechaAyer, botonFechaPersonalizada].forEach(b => b.classList.remove('active'));
                // Agregar clase active al elemento seleccionado
                btn.classList.add('active');
                
                if (btn === botonFechaHoy) {
                    inputFechaPersonalizada.value = formatearFecha(new Date());
                    inputFechaPersonalizada.classList.add('hidden');
                } else if (btn === botonFechaAyer) {
                    const ayer = new Date();
                    ayer.setDate(ayer.getDate() - 1);
                    inputFechaPersonalizada.value = formatearFecha(ayer);
                    inputFechaPersonalizada.classList.add('hidden');
                } else {
                    inputFechaPersonalizada.classList.remove('hidden');
                    inputFechaPersonalizada.focus();
                }
            });
        });
    }

    // Cerrar modal con botón X
    const modalCloseBtn = document.querySelector('.modal-close-btn');
    if (modalCloseBtn) {
        modalCloseBtn.addEventListener('click', () => {
            modal.classList.add('hidden');
            limpiarModal();
        });
    }

    // Cerrar modal al hacer clic fuera
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.add('hidden');
                limpiarModal();
            }
        });
    }
    
    // Inicializar modal con valores por defecto
    function inicializarModal() {
        // Inicializar selector de fecha
        const botonFechaHoy = document.getElementById('botonFechaHoy');
        
        if (botonFechaHoy) {
            // Simular clic en "Hoy"
            botonFechaHoy.click();
        }
        
        // Resetear toggles
        const gastoRepetir = document.getElementById('gastoRepetir');
        const gastoPagado = document.getElementById('gastoPagado');
        
        if (gastoRepetir) gastoRepetir.checked = false;
        if (gastoPagado) gastoPagado.checked = true;
    }

    // Función para limpiar modal
    function limpiarModal() {
        const elementos = {
            montoGasto: document.getElementById('montoGasto'),
            descripcionGasto: document.getElementById('descripcionGasto'),
            categoriaGasto: document.getElementById('categoriaGasto'),
            iconoGasto: document.getElementById('iconoGasto'),
            gastoRepetir: document.getElementById('gastoRepetir'),
            gastoPagado: document.getElementById('gastoPagado')
        };
        
        // Limpiar campos
        if (elementos.montoGasto) elementos.montoGasto.value = '';
        if (elementos.descripcionGasto) elementos.descripcionGasto.value = '';
        if (elementos.categoriaGasto) elementos.categoriaGasto.value = 'semanal';
        if (elementos.iconoGasto) elementos.iconoGasto.value = '💰';
        if (elementos.gastoRepetir) elementos.gastoRepetir.checked = false;
        if (elementos.gastoPagado) elementos.gastoPagado.checked = true;
        
        // Resetear fecha a hoy
        const botonFechaHoy = document.getElementById('botonFechaHoy');
        if (botonFechaHoy) {
            botonFechaHoy.click();
        }
    }
    
    // Botones del modal
    const botonCancelarModal = document.getElementById('botonCancelar');
    const botonGuardarModal = document.getElementById('botonAgregarGasto');

    if (botonCancelarModal) {
        botonCancelarModal.addEventListener('click', () => {
            modal.classList.add('hidden');
            limpiarModal();
        });
    }

    if (botonGuardarModal) {
        botonGuardarModal.addEventListener('click', () => {
            guardarGasto();
        });
    }

    // Nueva función para guardar gasto (con icono y resta automática)
    function guardarGasto() {
        const elements = {
            monto: document.getElementById('montoGasto'),
            descripcion: document.getElementById('descripcionGasto'),
            categoria: document.getElementById('categoriaGasto'),
            icono: document.getElementById('iconoGasto'),
            fecha: document.getElementById('inputFechaPersonalizada'),
            recurrente: document.getElementById('gastoRepetir'),
            pagado: document.getElementById('gastoPagado')
        };

        // Validar campos requeridos
        if (!elements.monto || !elements.monto.value.trim()) {
            mostrarAlerta('Por favor ingresa un monto', '⚠️', '#ff9800');
            return;
        }

        if (!elements.descripcion || !elements.descripcion.value.trim()) {
            mostrarAlerta('Por favor ingresa una descripción', '⚠️', '#ff9800');
            return;
        }

        if (!elements.categoria || !elements.categoria.value.trim()) {
            mostrarAlerta('Por favor selecciona una categoría', '⚠️', '#ff9800');
            return;
        }

        const monto = parseFloat(elements.monto.value);
        if (isNaN(monto) || monto <= 0) {
            mostrarAlerta('Por favor ingresa un monto válido', '⚠️', '#ff9800');
            return;
        }

        // Crear objeto gasto
        const iconoSeleccionado = elements.icono ? elements.icono.value : '💰';
        
        const nuevoGasto = {
            id: Date.now(),
            monto: monto,
            descripcion: elements.descripcion.value.trim(),
            categoria: elements.categoria.value,
            icono: iconoSeleccionado,
            fecha: elements.fecha.value || formatearFecha(new Date()),
            recurrente: elements.recurrente ? elements.recurrente.checked : false,
            pagado: elements.pagado ? elements.pagado.checked : true,
            timestamp: new Date().toISOString()
        };

        // Si está marcado como recurrente, preguntar cuántas veces repetir
        if (elements.recurrente && elements.recurrente.checked) {
            const veces = prompt('¿Cuántas veces quieres repetir este gasto?', '4');
            if (veces && parseInt(veces) > 1) {
                const cantidad = parseInt(veces);
                
                // Crear múltiples gastos usando el sistema de categorías
                for (let i = 0; i < cantidad; i++) {
                    const nombreRepetido = `${nuevoGasto.descripcion} (${i + 1}/${cantidad})`;
                    const montoPagado = nuevoGasto.pagado ? nuevoGasto.monto : 0;
                    
                    // Usar la función existente para crear elementos de categoría
                    crearElementoCategoria(
                        nuevoGasto.categoria, 
                        nombreRepetido, 
                        nuevoGasto.monto, 
                        iconoSeleccionado,
                        montoPagado, 
                        nuevoGasto
                    );
                }
                
                // Si los gastos están pagados, restar del presupuesto disponible
                if (nuevoGasto.pagado) {
                    const montoTotalGastado = nuevoGasto.monto * cantidad;
                    restarDelPresupuesto(nuevoGasto.categoria, montoTotalGastado);
                }
                
                // También guardar en almacenamiento local para persistencia
                const gastos = JSON.parse(localStorage.getItem('gastos') || '[]');
                for (let i = 0; i < cantidad; i++) {
                    const gastoRepetido = {
                        ...nuevoGasto,
                        id: Date.now() + i,
                        descripcion: `${nuevoGasto.descripcion} (${i + 1}/${cantidad})`
                    };
                    gastos.push(gastoRepetido);
                }
                localStorage.setItem('gastos', JSON.stringify(gastos));
                
                mostrarAlerta(`✅ Se crearon ${cantidad} gastos de "${nuevoGasto.descripcion}"`, '🔄', '#4caf50');
            } else {
                // Solo crear uno si no se especifica cantidad válida
                const montoPagado = nuevoGasto.pagado ? nuevoGasto.monto : 0;
                
                crearElementoCategoria(
                    nuevoGasto.categoria, 
                    nuevoGasto.descripcion, 
                    nuevoGasto.monto, 
                    iconoSeleccionado,
                    montoPagado, 
                    nuevoGasto
                );
                
                // Si está pagado, restar del presupuesto
                if (nuevoGasto.pagado) {
                    restarDelPresupuesto(nuevoGasto.categoria, nuevoGasto.monto);
                }
                
                const gastos = JSON.parse(localStorage.getItem('gastos') || '[]');
                gastos.push(nuevoGasto);
                localStorage.setItem('gastos', JSON.stringify(gastos));
                
                mostrarAlerta('Gasto agregado correctamente', '✅', '#4caf50');
            }
        } else {
            // Guardar gasto único usando el sistema de categorías
            const montoPagado = nuevoGasto.pagado ? nuevoGasto.monto : 0;
            
            crearElementoCategoria(
                nuevoGasto.categoria, 
                nuevoGasto.descripcion, 
                nuevoGasto.monto, 
                iconoSeleccionado,
                montoPagado, 
                nuevoGasto
            );
            
            // Si está pagado, restar del presupuesto
            if (nuevoGasto.pagado) {
                restarDelPresupuesto(nuevoGasto.categoria, nuevoGasto.monto);
            }
            
            const gastos = JSON.parse(localStorage.getItem('gastos') || '[]');
            gastos.push(nuevoGasto);
            localStorage.setItem('gastos', JSON.stringify(gastos));
            
            mostrarAlerta('Gasto agregado correctamente', '✅', '#4caf50');
        }

        // Actualizar interfaz
        actualizarResumen();
        actualizarPresupuesto(); // Actualizar los totales de las categorías

        // Cerrar modal y limpiar
        const modal = document.getElementById('modalAgregarGasto');
        if (modal) {
            modal.classList.add('hidden');
        }
        limpiarModal();

        console.log('Gasto guardado:', nuevoGasto);
    }

    // Función para restar automáticamente del presupuesto de la categoría
    function restarDelPresupuesto(categoria, monto) {
        const inputId = categoria + 'Budget';
        const input = document.getElementById(inputId);
        
        if (!input) {
            console.warn(`No se encontró el input de presupuesto para la categoría: ${categoria}`);
            return;
        }
        
        // Obtener el ingreso total confirmado
        const ingresoConfirmado = parseFloat(localStorage.getItem('ingresoConfirmado') || '0');
        
        if (ingresoConfirmado === 0) {
            mostrarAlerta('Debes confirmar un ingreso antes de que se puedan restar gastos automáticamente', '⚠️', '#ff9800');
            return;
        }
        
        // Calcular el presupuesto actual de la categoría
        const porcentajeActual = parseFloat(input.value) || 0;
        const presupuestoActual = (ingresoConfirmado * porcentajeActual) / 100;
        
        // Calcular el nuevo presupuesto después de restar el gasto
        const nuevoPresupuesto = Math.max(0, presupuestoActual - monto);
        
        // Calcular el nuevo porcentaje
        const nuevoPorcentaje = ingresoConfirmado > 0 ? (nuevoPresupuesto / ingresoConfirmado) * 100 : 0;
        
        // Actualizar el slider de presupuesto
        input.value = Math.max(0, nuevoPorcentaje);
        
        // Actualizar la visualización
        actualizarPresupuesto();
        
        // Mostrar información del ajuste
        const montoFormateado = new Intl.NumberFormat('es-AR', { 
            style: 'currency', 
            currency: 'ARS' 
        }).format(monto);
        
        mostrarAlerta(`Presupuesto de ${categoria} reducido en ${montoFormateado}`, '💸', '#2196f3');
        
        console.log(`Presupuesto ${categoria} ajustado: ${presupuestoActual} -> ${nuevoPresupuesto} (${porcentajeActual}% -> ${nuevoPorcentaje}%)`);
    }

    // Event listeners para cambio de período (mantenido para compatibilidad)

    // Función para crear elemento de categoría
    function crearElementoCategoria(categoria, nombre, presupuestado, icono, gastado = 0, gastoInfo = null) {
        const elemento = document.createElement('div');
        elemento.className = 'category-item';
        
        // Información adicional para mostrar
        let infoAdicional = '';
        if (gastoInfo) {
            const fechaTexto = new Date(gastoInfo.fecha).toLocaleDateString('es-AR', {
                day: '2-digit',
                month: '2-digit'
            });
            const estadoPago = gastoInfo.pagado ? '✅' : '⏳';
            const descripcionTexto = gastoInfo.descripcion ? ` - ${gastoInfo.descripcion}` : '';
            infoAdicional = `
                <div class="expense-info" style="font-size: 12px; color: #666; margin-top: 4px;">
                    📅 ${fechaTexto} ${estadoPago}${descripcionTexto}
                </div>
            `;
        }
        
        elemento.innerHTML = `
            <div class="category-left">
                <div class="category-icon-container">${icono}</div>
                <div class="category-info">
                    <div class="category-name" contenteditable="true">${nombre}</div>
                    ${infoAdicional}
                </div>
            </div>
            <div class="category-amounts">
                <div class="budget-row">
                    <span class="budget-label">Presupuestado</span>
                    <span class="budget-amount-display">$${presupuestado.toFixed(2)}</span>
                    <input type="hidden" class="budget-input-hidden" value="${presupuestado}">
                </div>
                <div class="budget-row">
                    <span class="spent-label">Gastado</span>
                    <input type="number" class="spent-input" value="${gastado}" 
                           placeholder="$0" oninput="actualizarGastoCategoria(this)">
                </div>
                <div class="budget-row">
                    <span class="remaining-label">Restante</span>
                    <span class="remaining-amount">$${(presupuestado - gastado).toFixed(2)}</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${Math.min((gastado / presupuestado) * 100, 100)}%"></div>
                </div>
            </div>
            <button class="delete-category-btn" onclick="eliminarCategoriaPersonalizada(this)" title="Eliminar categoría">✕</button>
        `;
        
        // Guardar información completa en el elemento para futuro uso
        if (gastoInfo) {
            elemento.dataset.gastoInfo = JSON.stringify(gastoInfo);
        }
        
        document.getElementById(`${categoria}Custom`).appendChild(elemento);
    }

    // Función para validar almacenamiento local
    function validarAlmacenamientoLocal() {
        try {
            const test = 'test';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (e) {
            console.warn('localStorage no está disponible:', e);
            return false;
        }
    }

    // Funciones de persistencia simplificadas
    // Sistema de batching optimizado para localStorage
    const storageQueue = new Map();
    let storageTimeout = null;

    function queueStorage(key, value) {
        storageQueue.set(key, value);
        
        clearTimeout(storageTimeout);
        storageTimeout = setTimeout(() => {
            if (!validarAlmacenamientoLocal()) return;
            
            try {
                for (const [key, value] of storageQueue) {
                    localStorage.setItem(key, typeof value === 'object' ? JSON.stringify(value) : value);
                }
                storageQueue.clear();
            } catch (error) {
                console.error('Error saving to localStorage:', error);
            }
        }, 250); // Batch writes every 250ms
    }

    // Función optimizada para guardar datos
    function guardarDatos() {
        if (!validarAlmacenamientoLocal()) return;
        
        try {
            // Usar caché de elementos DOM cuando sea posible
            const elementoIngresoMensual = domCache.ingresoMensual || document.getElementById('ingresoMensual');
            const semanalBudgetEl = document.getElementById('semanalBudget');
            const mensualBudgetEl = document.getElementById('mensualBudget');
            const ahorrosBudgetEl = document.getElementById('ahorrosBudget');
            
            const datos = {
                ingresoMensual: elementoIngresoMensual ? parseFloat(elementoIngresoMensual.value) || 0 : 0,
                presupuestoSemanal: semanalBudgetEl ? parseFloat(semanalBudgetEl.value) || 0 : 0,
                presupuestoMensual: mensualBudgetEl ? parseFloat(mensualBudgetEl.value) || 0 : 0,
                presupuestoAhorros: ahorrosBudgetEl ? parseFloat(ahorrosBudgetEl.value) || 0 : 0
            };
            
            // Usar batching para localStorage
            queueStorage('datosPresupuesto', datos);
            
            // Guardar categorías personalizadas
            const categorias = { semanal: [], mensual: [], ahorros: [] };
            ['semanal', 'mensual', 'ahorros'].forEach(tipo => {
                const contenedor = document.getElementById(`${tipo}Custom`);
                if (contenedor) {
                    contenedor.querySelectorAll('.category-item').forEach(item => {
                        try {
                            const nombreEl = item.querySelector('.category-name');
                            const iconoEl = item.querySelector('.category-icon-container');
                            const presupuestadoEl = item.querySelector('.budget-input-hidden');
                            const gastadoEl = item.querySelector('.spent-input');
                            
                            if (nombreEl && iconoEl && presupuestadoEl && gastadoEl) {
                                categorias[tipo].push({
                                    nombre: nombreEl.textContent,
                                    icono: iconoEl.textContent,
                                    presupuestado: parseFloat(presupuestadoEl.value) || 0,
                                    gastado: parseFloat(gastadoEl.value) || 0
                                });
                            }
                        } catch (e) {
                            console.warn('Error al procesar categoría:', e);
                        }
                    });
                }
            });
            
            // Usar batching para categorías también
            queueStorage('categoriasPersonalizadas', categorias);
        } catch (e) {
            console.error('Error al guardar datos:', e);
        }
    }

    function cargarDatos() {
        if (!validarAlmacenamientoLocal()) return;
        
        try {
            const datos = JSON.parse(localStorage.getItem('datosPresupuesto') || '{}');
            
            const elementoIngresoMensual = document.getElementById('ingresoMensual');
            const semanalBudgetEl = document.getElementById('semanalBudget');
            const mensualBudgetEl = document.getElementById('mensualBudget');
            const ahorrosBudgetEl = document.getElementById('ahorrosBudget');
            
            if (elementoIngresoMensual) elementoIngresoMensual.value = datos.ingresoMensual || 0;
            if (semanalBudgetEl) semanalBudgetEl.value = datos.presupuestoSemanal || 0;
            if (mensualBudgetEl) mensualBudgetEl.value = datos.presupuestoMensual || 0;
            if (ahorrosBudgetEl) ahorrosBudgetEl.value = datos.presupuestoAhorros || 0;
            
            // Cargar categorías personalizadas
            const categorias = JSON.parse(localStorage.getItem('categoriasPersonalizadas') || '{"semanal":[],"mensual":[],"ahorros":[]}');
            ['semanal', 'mensual', 'ahorros'].forEach(tipo => {
                if (categorias[tipo] && Array.isArray(categorias[tipo])) {
                    categorias[tipo].forEach(cat => {
                        if (cat && cat.nombre && cat.icono !== undefined) {
                            crearElementoCategoria(tipo, cat.nombre, cat.presupuestado || 0, cat.icono, cat.gastado || 0);
                        }
                    });
                }
            });
        } catch (e) {
            console.error('Error al cargar datos:', e);
            // Si hay error, limpiar localStorage corrupto
            try {
                localStorage.removeItem('datosPresupuesto');
                localStorage.removeItem('categoriasPersonalizadas');
            } catch (cleanupError) {
                console.error('Error al limpiar localStorage:', cleanupError);
            }
        }
    }

    // Funciones globales
    window.cambiarPestana = function(nombre, boton) {
        document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
        document.getElementById(nombre).classList.add('active');
        document.querySelectorAll('.tab-button').forEach(b => b.classList.remove('active'));
        boton.classList.add('active');
    };

    window.cambiarTipoPeriodo = function(tipo) {
        tipoPeriodoActual = tipo;
        
        // Actualizar botones activos
        document.querySelectorAll('.period-type-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.type === tipo) {
                btn.classList.add('active');
            }
        });
        
        // Actualizar visualización
        actualizarVisualizacionPeriodo();
        actualizarPresupuesto();
        mostrarAlerta(`Período cambiado a ${tipo}`, '📅', '#4caf50');
    };
    
    window.cambiarPeriodo = function(direccion) {
        // Calcular la nueva fecha
        let nuevaFecha = new Date(periodoActual);
        if (tipoPeriodoActual === 'semanal') {
            nuevaFecha.setDate(nuevaFecha.getDate() + (direccion * 7));
        } else {
            nuevaFecha.setMonth(nuevaFecha.getMonth() + direccion);
        }
        
        // Verificar si la nueva fecha no es anterior a hoy
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        
        const rangoNuevo = obtenerRangoPeriodo(nuevaFecha, tipoPeriodoActual);
        if (rangoNuevo.fin < hoy && direccion < 0) {
            mostrarAlerta('No se puede navegar a períodos pasados', '⚠️', '#ff9800');
            return;
        }
        
        // Si llegamos aquí, la fecha es válida
        periodoActual = nuevaFecha;
        actualizarVisualizacionPeriodo();
        actualizarPresupuesto();
        
        // Registrar navegación para análisis
        registrarAccion('navegacion_periodo', { tipo: tipoPeriodoActual, direccion });
    };

    // Funciones para el modal lateral de configuraciones
    window.abrirConfiguraciones = function() {
        const modal = document.getElementById('modalConfiguracion');
        if (modal) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden'; // Prevenir scroll del body
        } else {
            console.error('Modal de configuraciones no encontrado');
        }
    };

    window.cerrarConfiguraciones = function() {
        const modal = document.getElementById('modalConfiguracion');
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = 'auto'; // Restaurar scroll del body
        }
    };

    window.exportarDatos = function() {
        const datos = {
            version: '2.0',
            fecha: new Date().toISOString(),
            presupuesto: JSON.parse(localStorage.getItem('datosPresupuesto') || '{}'),
            categorias: JSON.parse(localStorage.getItem('categoriasPersonalizadas') || '{}'),
            historial: JSON.parse(localStorage.getItem('historialGastos') || '[]'),
            configuracion: {
                notificaciones: localStorage.getItem('notificacionesHabilitadas'),
                modoOscuro: localStorage.getItem('modoOscuro'),
                alertasInteligentes: localStorage.getItem('alertasInteligentes')
            }
        };
        
        const csv = generarCSV(datos);
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `bolsillito-export-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        
        URL.revokeObjectURL(url);
        mostrarAlerta('Datos exportados correctamente', '📊', '#4caf50');
    };

    window.importarDatos = function() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.csv';
        
        input.onchange = function(e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    try {
                        const content = e.target.result;
                        
                        // Procesar archivo CSV
                        if (file.name.endsWith('.csv')) {
                            const datos = parsearCSV(content);
                            
                            if (datos) {
                                // Aplicar los datos importados
                                if (datos.presupuesto) {
                                    localStorage.setItem('datosPresupuesto', JSON.stringify(datos.presupuesto));
                                    
                                    // Actualizar campos del formulario
                                    if (datos.presupuesto.ingresoMensual) {
                                        document.getElementById('ingresoMensual').value = datos.presupuesto.ingresoMensual;
                                    }
                                    if (datos.presupuesto.presupuestoSemanal) {
                                        document.getElementById('semanalBudget').value = datos.presupuesto.presupuestoSemanal;
                                    }
                                    if (datos.presupuesto.presupuestoMensual) {
                                        document.getElementById('mensualBudget').value = datos.presupuesto.presupuestoMensual;
                                    }
                                    if (datos.presupuesto.presupuestoAhorros) {
                                        document.getElementById('ahorrosBudget').value = datos.presupuesto.presupuestoAhorros;
                                    }
                                }
                                
                                if (datos.categorias) {
                                    localStorage.setItem('categoriasPersonalizadas', JSON.stringify(datos.categorias));
                                }
                                
                                // Recargar datos y actualizar interfaz
                                cargarDatos();
                                cargarEstadoIngreso();
                                actualizarPresupuesto();
                                mostrarAlerta('Datos CSV importados correctamente', '📁', '#4caf50');
                            } else {
                                mostrarAlerta('Error: Formato de CSV no válido', '❌', '#f44336');
                            }
                        } else {
                            mostrarAlerta('Por favor selecciona un archivo CSV', '⚠️', '#ff9800');
                        }
                        
                    } catch (error) {
                        console.error('Error al importar CSV:', error);
                        mostrarAlerta('Error al importar datos. Verifica el formato del archivo CSV.', '❌', '#f44336');
                    }
                };
                reader.readAsText(file);
            }
        };
        
        input.click();
    };

    // Función para parsear CSV
    function parsearCSV(csvContent) {
        try {
            const lineas = csvContent.split('\n').filter(linea => linea.trim());
            if (lineas.length < 2) return null;
            
            const datos = {
                presupuesto: {},
                categorias: { semanal: [], mensual: [], ahorros: [] }
            };
            
            let seccionActual = null;
            
            for (let i = 0; i < lineas.length; i++) {
                const linea = lineas[i].trim();
                
                // Identificar secciones
                if (linea.includes('=== PRESUPUESTO ===')) {
                    seccionActual = 'presupuesto';
                    continue;
                } else if (linea.includes('=== CATEGORIAS SEMANAL ===')) {
                    seccionActual = 'semanal';
                    continue;
                } else if (linea.includes('=== CATEGORIAS MENSUAL ===')) {
                    seccionActual = 'mensual';
                    continue;
                } else if (linea.includes('=== CATEGORIAS AHORROS ===')) {
                    seccionActual = 'ahorros';
                    continue;
                }
                
                // Parsear datos según la sección
                const columnas = linea.split(',');
                
                if (seccionActual === 'presupuesto' && columnas.length >= 2) {
                    const campo = columnas[0].trim();
                    const valor = parseFloat(columnas[1]) || 0;
                    
                    if (campo === 'Ingreso Mensual') datos.presupuesto.ingresoMensual = valor;
                    else if (campo === 'Presupuesto Semanal') datos.presupuesto.presupuestoSemanal = valor;
                    else if (campo === 'Presupuesto Mensual') datos.presupuesto.presupuestoMensual = valor;
                    else if (campo === 'Presupuesto Ahorros') datos.presupuesto.presupuestoAhorros = valor;
                } else if ((seccionActual === 'semanal' || seccionActual === 'mensual' || seccionActual === 'ahorros') && columnas.length >= 4) {
                    const categoria = {
                        nombre: columnas[0].trim(),
                        icono: columnas[1].trim(),
                        presupuestado: parseFloat(columnas[2]) || 0,
                        gastado: parseFloat(columnas[3]) || 0
                    };
                    datos.categorias[seccionActual].push(categoria);
                }
            }
            
            return datos;
        } catch (error) {
            console.error('Error al parsear CSV:', error);
            return null;
        }
    }

    // Funciones de utilidad avanzadas
    function generarCSV(datos) {
        let csv = '';
        
        // Sección de presupuesto
        csv += '=== PRESUPUESTO ===\n';
        if (datos.presupuesto) {
            csv += `Ingreso Mensual,${datos.presupuesto.ingresoMensual || 0}\n`;
            csv += `Presupuesto Semanal,${datos.presupuesto.presupuestoSemanal || 0}\n`;
            csv += `Presupuesto Mensual,${datos.presupuesto.presupuestoMensual || 0}\n`;
            csv += `Presupuesto Ahorros,${datos.presupuesto.presupuestoAhorros || 0}\n`;
        }
        csv += '\n';
        
        // Secciones de categorías
        if (datos.categorias) {
            // Categorías semanales
            csv += '=== CATEGORIAS SEMANAL ===\n';
            if (datos.categorias.semanal && datos.categorias.semanal.length > 0) {
                datos.categorias.semanal.forEach(categoria => {
                    csv += `${categoria.nombre},${categoria.icono},${categoria.presupuestado},${categoria.gastado}\n`;
                });
            }
            csv += '\n';
            
            // Categorías mensuales
            csv += '=== CATEGORIAS MENSUAL ===\n';
            if (datos.categorias.mensual && datos.categorias.mensual.length > 0) {
                datos.categorias.mensual.forEach(categoria => {
                    csv += `${categoria.nombre},${categoria.icono},${categoria.presupuestado},${categoria.gastado}\n`;
                });
            }
            csv += '\n';
            
            // Categorías de ahorros
            csv += '=== CATEGORIAS AHORROS ===\n';
            if (datos.categorias.ahorros && datos.categorias.ahorros.length > 0) {
                datos.categorias.ahorros.forEach(categoria => {
                    csv += `${categoria.nombre},${categoria.icono},${categoria.presupuestado},${categoria.gastado}\n`;
                });
            }
        }
        
        return csv;
    }

    function registrarAccion(tipo, datos) {
        const acciones = JSON.parse(localStorage.getItem('accionesUsuario') || '[]');
        acciones.push({
            tipo: tipo,
            datos: datos,
            timestamp: Date.now()
        });
        
        // Mantener solo las últimas 100 acciones
        if (acciones.length > 100) {
            acciones.splice(0, acciones.length - 100);
        }
        
        localStorage.setItem('accionesUsuario', JSON.stringify(acciones));
    }

    function generarSugerenciasInteligentes() {
        const sugerencias = [];
        const ingreso = parseFloat(document.getElementById('ingresoMensual').value) || 0;
        
        // Analizar patrones y generar sugerencias
        const gastoTotal = calcularGastoTotal();
        const porcentajeGasto = (gastoTotal / ingreso) * 100;
        
        if (porcentajeGasto > 90) {
            sugerencias.push({
                icono: '⚠️',
                texto: 'Estás gastando más del 90% de tus ingresos. Considera reducir gastos no esenciales.',
                color: '#f44336'
            });
        }
        
        if (porcentajeGasto < 50) {
            sugerencias.push({
                icono: '💰',
                texto: '¡Excelente! Tienes potencial para aumentar tus ahorros.',
                color: '#4caf50'
            });
        }
        
        const contenedor = document.getElementById('smartSuggestions');
        contenedor.innerHTML = '';
        
        sugerencias.forEach(sugerencia => {
            const div = document.createElement('div');
            div.className = 'suggestion-item';
            div.innerHTML = `
                <span class="suggestion-icon">${sugerencia.icono}</span>
                <span class="suggestion-text">${sugerencia.texto}</span>
            `;
            div.style.borderLeftColor = sugerencia.color;
            contenedor.appendChild(div);
        });
    }

    function calcularGastoTotal() {
        let total = 0;
        ['semanalCustom', 'mensualCustom', 'ahorrosCustom'].forEach(id => {
            const contenedor = document.getElementById(id);
            if (contenedor) {
                contenedor.querySelectorAll('.spent-input').forEach(input => {
                    total += parseFloat(input.value) || 0;
                });
            }
        });
        return total;
    }

    window.alternarCategoria = function(nombre) {
        const contenedor = document.getElementById(`${nombre}Custom`);
        const icono = document.getElementById(`${nombre}Icon`);
        
        if (contenedor.classList.contains('collapsed')) {
            contenedor.classList.remove('collapsed');
            icono.classList.remove('collapsed');
            icono.textContent = '▼';
        } else {
            contenedor.classList.add('collapsed');
            icono.classList.add('collapsed');
            icono.textContent = '▶';
        }
    };

    window.eliminarCategoriaPersonalizada = function(boton) {
        boton.parentElement.remove();
        actualizarPresupuesto();
    };

    window.actualizarGastoCategoria = function(input) {
        const item = input.closest('.category-item');
        const presupuestado = parseFloat(item.querySelector('.budget-input-hidden').value) || 0;
        const gastado = parseFloat(input.value) || 0;
        const restante = presupuestado - gastado;
        
        const spanRestante = item.querySelector('.remaining-amount');
        spanRestante.textContent = `$${restante.toFixed(2)}`;
        spanRestante.className = `remaining-amount ${restante < 0 ? 'negative' : restante === 0 ? 'zero' : ''}`;
        
        if (restante < 0) {
            mostrarAlerta(item.querySelector('.category-name').textContent);
        }
        
        const barra = item.querySelector('.progress-fill');
        const porcentaje = Math.min((gastado / presupuestado) * 100, 100);
        barra.style.width = `${porcentaje}%`;
        barra.style.background = porcentaje >= 100 ? '#f44336' : porcentaje >= 80 ? '#ff9800' : '#4caf50';
        
        guardarDatos();
        actualizarPresupuesto();
    };

    window.reiniciarPresupuesto = function() {
        if (confirm('¿Estás seguro de que quieres limpiar todos los datos? Esta acción no se puede deshacer.')) {
            // Limpiar localStorage
            localStorage.removeItem('datosPresupuesto');
            localStorage.removeItem('categoriasPersonalizadas');
            localStorage.removeItem('confirmedIncomeValue');
            localStorage.removeItem('incomeConfirmed');
            
            // Resetear formularios
            document.getElementById('ingresoMensual').value = '';
            categoriasPrincipales.forEach(cat => document.getElementById(cat.input).value = 0);
            ['semanalCustom', 'mensualCustom', 'ahorrosCustom'].forEach(id => {
                document.getElementById(id).innerHTML = '';
            });
            
            // Resetear estado de ingreso confirmado
            const incomeInput = document.getElementById('ingresoMensual');
            const confirmBtn = document.getElementById('confirmIncomeBtn');
            const confirmedDiv = document.getElementById('incomeConfirmed');
            
            if (incomeInput) incomeInput.style.display = 'block';
            if (confirmBtn) confirmBtn.style.display = 'flex';
            if (confirmedDiv) confirmedDiv.style.display = 'none';
            
            actualizarPresupuesto();
            mostrarAlerta('Presupuesto reiniciado correctamente', '✅', '#4caf50');
        }
    };

    // Funciones para manejo de ingreso confirmado
    window.confirmarIngreso = function() {
        const inputIngreso = document.getElementById('ingresoMensual');
        const valorIngreso = parseFloat(inputIngreso.value) || 0;
        
        if (valorIngreso <= 0) {
            mostrarAlerta('Por favor ingresa un valor válido', '⚠️', '#ff9800');
            return;
        }
        
        // Mostrar ingreso confirmado
        const contenedorInput = document.querySelector('.income-input-container');
        const contenedorConfirmado = document.getElementById('incomeConfirmed');
        const montoConfirmado = document.getElementById('confirmedAmount');
        
        montoConfirmado.textContent = `$${valorIngreso.toLocaleString('es-AR')}`;
        contenedorInput.style.display = 'none';
        contenedorConfirmado.style.display = 'flex';
        
        // Actualizar el presupuesto con el nuevo ingreso
        actualizarPresupuesto();
        
        // Guardar en localStorage que el ingreso está confirmado
        localStorage.setItem('incomeConfirmed', 'true');
        localStorage.setItem('confirmedIncomeValue', valorIngreso);
    };
    
    window.editarIngreso = function() {
        const contenedorInput = document.querySelector('.income-input-container');
        const contenedorConfirmado = document.getElementById('incomeConfirmed');
        
        contenedorInput.style.display = 'flex';
        contenedorConfirmado.style.display = 'none';
        
        // Remover confirmación del localStorage
        localStorage.removeItem('incomeConfirmed');
        localStorage.removeItem('confirmedIncomeValue');
    };
    
    // Función para cargar estado de ingreso confirmado
    function cargarEstadoIngreso() {
        const ingresoConfirmado = localStorage.getItem('incomeConfirmed');
        const valorConfirmado = localStorage.getItem('confirmedIncomeValue');
        
        if (ingresoConfirmado === 'true' && valorConfirmado) {
            const inputIngreso = document.getElementById('ingresoMensual');
            const contenedorInput = document.querySelector('.income-input-container');
            const contenedorConfirmado = document.getElementById('incomeConfirmed');
            const montoConfirmado = document.getElementById('confirmedAmount');
            
            inputIngreso.value = valorConfirmado;
            montoConfirmado.textContent = `$${parseFloat(valorConfirmado).toLocaleString('es-AR')}`;
            contenedorInput.style.display = 'none';
            contenedorConfirmado.style.display = 'flex';
        }
    }
    
    // Inicializar aplicación
    cargarDatos();
    cargarEstadoIngreso(); // Cargar estado de ingreso confirmado
    actualizarVisualizacionPeriodo(); // Inicializar período
    actualizarPresupuesto();
    
    // Configurar análisis inteligente inicial
    setTimeout(() => {
        actualizarAnalisis();
        generarSugerenciasInteligentes();
    }, 1000);
    
    // Registrar acciones del usuario para analytics
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('add-button')) {
            registrarAccion('abrir_modal', {});
            // No hacer nada más aquí para evitar conflictos
        }
        if (e.target.classList.contains('period-nav-btn')) {
            registrarAccion('navegacion_periodo', { direccion: e.target.textContent });
        }
    });
    
    // Función optimizada para establecer porcentaje específico
    function establecerPorcentaje(categoria, porcentaje) {
        const inputId = categoria + 'Budget';
        const input = document.getElementById(inputId);
        
        if (!input) return;
        
        // Calcular porcentajes de otras categorías usando caché
        const otrasCategarias = categoriasPrincipales.filter(cat => cat.id !== categoria);
        let totalOtras = 0;
        
        // Usar un bucle for más eficiente que reduce
        for (const cat of otrasCategarias) {
            const element = document.getElementById(cat.input);
            if (element) {
                totalOtras += parseFloat(element.value) || 0;
            }
        }
        
        const porcentajeMaximo = 100 - totalOtras;
        const porcentajeFinal = Math.min(porcentaje, Math.max(0, porcentajeMaximo));
        
        input.value = porcentajeFinal;
        
        // Abrir automáticamente la categoría cuando se selecciona un porcentaje
        const contenedor = document.getElementById(`${categoria}Custom`);
        const icono = document.getElementById(`${categoria}Icon`);
        
        if (contenedor && icono && porcentajeFinal > 0) {
            // Si el porcentaje es mayor que 0, abrir la categoría
            if (contenedor.classList.contains('collapsed')) {
                contenedor.classList.remove('collapsed');
                icono.classList.remove('collapsed');
                icono.textContent = '▼';
            }
        } else if (contenedor && icono && porcentajeFinal === 0) {
            // Si el porcentaje es 0, cerrar la categoría
            if (!contenedor.classList.contains('collapsed')) {
                contenedor.classList.add('collapsed');
                icono.classList.add('collapsed');
                icono.textContent = '▶';
            }
        }
        
        // Usar requestAnimationFrame para actualizaciones visuales
        requestAnimationFrame(() => {
            actualizarPresupuesto();
            
            // Mostrar notificación solo si fue ajustado
            if (porcentajeFinal !== porcentaje && porcentajeFinal >= 0) {
                mostrarAlerta(`Ajustado a ${porcentajeFinal}% (máximo disponible)`, '⚠️', '#ff9800');
            }
        });
    }
    
    // Función para establecer porcentaje máximo disponible
    function establecerPorcentajeMax(categoria) {
        const otrasCategarias = categoriasPrincipales.filter(cat => cat.id !== categoria);
        const totalOtras = otrasCategarias.reduce((total, cat) => {
            return total + (parseFloat(document.getElementById(cat.input).value) || 0);
        }, 0);
        
        const porcentajeMaximo = Math.max(0, 100 - totalOtras);
        const inputId = categoria + 'Budget';
        const input = document.getElementById(inputId);
        
        if (input) {
            input.value = porcentajeMaximo;
            
            // Abrir/cerrar automáticamente la categoría según el porcentaje máximo
            const contenedor = document.getElementById(`${categoria}Custom`);
            const icono = document.getElementById(`${categoria}Icon`);
            
            if (contenedor && icono && porcentajeMaximo > 0) {
                // Si el porcentaje máximo es mayor que 0, abrir la categoría
                if (contenedor.classList.contains('collapsed')) {
                    contenedor.classList.remove('collapsed');
                    icono.classList.remove('collapsed');
                    icono.textContent = '▼';
                }
            } else if (contenedor && icono && porcentajeMaximo === 0) {
                // Si el porcentaje máximo es 0, cerrar la categoría
                if (!contenedor.classList.contains('collapsed')) {
                    contenedor.classList.add('collapsed');
                    icono.classList.add('collapsed');
                    icono.textContent = '▶';
                }
            }
            
            actualizarPresupuesto();
            
            // Actualizar texto del botón Max para mostrar el porcentaje
            const btnMax = document.getElementById(categoria + 'MaxBtn');
            if (btnMax) {
                btnMax.textContent = porcentajeMaximo > 0 ? `${porcentajeMaximo}%` : 'Max';
                
                // Restaurar texto después de 2 segundos
                setTimeout(() => {
                    btnMax.textContent = 'Max';
                }, 2000);
            }
            
            if (porcentajeMaximo === 0) {
                mostrarAlerta('No hay presupuesto disponible para esta categoría', 'ℹ️', '#2196f3');
            }
        }
    }
    
    // Función para actualizar dinámicamente el texto del botón Max
    function actualizarBotonesMax() {
        categoriasPrincipales.forEach(cat => {
            const otrasCategarias = categoriasPrincipales.filter(c => c.id !== cat.id);
            const totalOtras = otrasCategarias.reduce((total, c) => {
                return total + (parseFloat(document.getElementById(c.input).value) || 0);
            }, 0);
            
            const porcentajeMaximo = Math.max(0, 100 - totalOtras);
            const btnMax = document.getElementById(cat.id + 'MaxBtn');
            
            if (btnMax && btnMax.textContent === 'Max') {
                // Solo mostrar el porcentaje si es menor a 100%
                const tooltipText = porcentajeMaximo < 100 ? 
                    `${porcentajeMaximo}% disponible` : 
                    'Porcentaje máximo disponible';
                btnMax.title = tooltipText;
            }
        });
    }

    // Inicializar caché de elementos DOM
    domCache.init();
    
    // Inicializar listeners de input con debounce optimizado
    const inputElements = document.querySelectorAll('.budget-input-range');
    let debounceTimer = null;
    
    inputElements.forEach(input => {
        input.addEventListener('input', () => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(actualizarPresupuesto, 50);
        });
    });
    
    // Usar requestAnimationFrame para operaciones que afecten el layout
    requestAnimationFrame(() => {
        actualizarGraficos();
    });
    
    // Configurar modal al final para asegurar que todos los elementos existan
    setTimeout(() => {
        // Verificar si el modal ya tiene event listeners configurados
        if (typeof inicializarModal === 'function') {
            console.log('Función inicializarModal disponible');
        }
    }, 100);
    
    // Exponer funciones principales
    window.actualizarPresupuesto = actualizarPresupuesto;
    window.establecerPorcentaje = establecerPorcentaje;
    window.establecerPorcentajeMax = establecerPorcentajeMax;
});
