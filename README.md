
# 🛰️ REDECOL E.S.P - Control Operativo GPS

Sistema móvil para la supervisión y reporte de rutas de aprovechamiento, diseñado para cumplir con el **Decreto 1381 de 2024** y facilitar el cargue de información en el **SUI**.

## 🚀 Funcionalidades
- **Seguimiento GPS en Tiempo Real**: Captura precisa de coordenadas durante la labor de reciclaje.
- **Inteligencia Artificial (Gemini)**: Genera informes técnicos automáticos validando la ruta y el cumplimiento normativo.
- **Exportación de Datos**: Descarga de archivos CSV compatibles con cualquier sistema de seguimiento central.
- **Sincronización vía Webhook**: Conecta la app directamente con tu base de datos central configurando una URL de destino.
- **Modo PWA**: Se puede instalar en cualquier celular Android/iOS sin pasar por la Play Store.

## 🛠️ Instalación en el Celular
1. Abre la URL generada por GitHub Pages en el navegador del móvil.
2. Selecciona "Añadir a la pantalla de inicio".
3. La app aparecerá con el logo de **REDECOL** en tu menú de aplicaciones.

## 📡 Integración Técnica
Para conectar esta app con tu sistema central, ve al icono de engranaje ⚙️ y pega la URL de tu API. La app enviará un objeto JSON con el siguiente formato al finalizar cada ruta:

```json
{
  "event": "ROUTE_COMPLETED",
  "operador": "Nombre del Reciclador",
  "data": [
    {"lat": 7.123, "lng": -73.123, "timestamp": "2024-..."}
  ]
}
```

---
*Desarrollado para la eficiencia operativa de REDECOL E.S.P - Barrancabermeja.*
