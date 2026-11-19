# OSINT_LAB

## Radar CR

Con Node.js 24, instala las dependencias de ambos proyectos y compila desde esta carpeta.

```powershell
npm install
npm --prefix ../Investigacion2-Frontend install
npm run build:full
npm run start:prod
```

Abre http://localhost:3000. NestJS sirve el panel y la API en el mismo puerto. Para editar con recarga automática, ejecuta `npm run start:dev` aquí y `npm run dev` en el frontend. Vite reenvía `/api` a `http://127.0.0.1:3000` por defecto. Usa `API_PROXY_TARGET` si NestJS corre en otra dirección.

### Datos del OIJ

Consulta de ejemplo en `GET /api/oij/registros?year=2025&q=hurto&province=San%20Jos%C3%A9&page=1`. Parámetros opcionales:

- `year` selecciona un año publicado entre 2015 y 2026. La vista inicial usa 2025.
- `q` busca palabras en delito, subdelito, provincia, cantón y distrito, sin distinguir mayúsculas ni tildes.
- `province` y `crime` seleccionan las categorías del catálogo devuelto por la API.
- `month` filtra del 1 al 12. La gráfica mensual conserva los demás filtros y muestra los meses disponibles para cambiar la selección.
- `page` pagina a partir de 1, con 12 registros por página.

El servidor descarga y almacena en memoria por 24 horas el CSV anual oficial. Para usar copias locales con el mismo formato y nombre (`PJCROD_POLICIALES_V1-2025.csv`, por ejemplo), define `OIJ_DATA_DIR` con la ruta de la carpeta. Si el frontend se compila a una ubicación diferente, define `FRONTEND_DIST` con la ruta a su carpeta de salida. La cobertura que muestra el panel corresponde a las fechas presentes en el archivo publicado. [Estadísticas policiales del Poder Judicial](https://datosabiertospj.poder-judicial.go.cr/dataset/estadisticas-policiales).
