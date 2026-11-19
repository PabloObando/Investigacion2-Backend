# OSINT_LAB

## Radar CR

Con Node.js 24, instala las dependencias y ejecuta el backend desde esta carpeta.

```powershell
npm ci
npm run start:dev
```

En la carpeta `Investigacion2-Frontend`, ejecuta `npm ci` y `npm run dev`. Abre http://localhost:5173. Sin `VITE_API_URL`, el servidor de desarrollo de Vite reenvía `/api` a `http://127.0.0.1:3000`. Usa `API_PROXY_TARGET` si NestJS corre en otra dirección.

### Despliegue

- **Render (backend)**. Crea o configura un Web Service de Node.js. Usa `npm ci --include=dev && npm run build` como Build Command y `npm run start:prod` como Start Command. En **Environment**, configura `FRONTEND_URL` con el origen de producción del frontend, por ejemplo `https://tu-frontend.vercel.app`. El servidor usa el puerto `PORT` de Render.
- **Vercel (frontend)**. Selecciona el preset Vite con Build Command `npm run build` y Output Directory `dist`. En **Settings → Environment Variables**, configura `VITE_API_URL` para **Production** con el origen HTTPS público del backend, por ejemplo `https://tu-backend.onrender.com`. Usa solo el dominio con su protocolo, sin `/api` ni rutas. Genera un nuevo despliegue de producción para aplicar el valor.

### Datos del OIJ

Consulta de ejemplo en `GET /api/oij/registros?year=2025&q=hurto&province=San%20Jos%C3%A9&page=1`. Parámetros opcionales:

- `year` selecciona un año publicado entre 2015 y 2026. La vista inicial usa 2025.
- `q` busca palabras en delito, subdelito, provincia, cantón y distrito, sin distinguir mayúsculas ni tildes.
- `province` y `crime` seleccionan las categorías del catálogo devuelto por la API.
- `month` filtra del 1 al 12. La gráfica mensual conserva los demás filtros y muestra los meses disponibles para cambiar la selección.
- `page` pagina a partir de 1, con 12 registros por página.

El servidor descarga y almacena en memoria por 24 horas el CSV anual oficial. Para usar copias locales con el mismo formato y nombre (`PJCROD_POLICIALES_V1-2025.csv`, por ejemplo), define `OIJ_DATA_DIR` con la ruta de la carpeta. La cobertura que muestra el panel corresponde a las fechas presentes en el archivo publicado. [Estadísticas policiales del Poder Judicial](https://datosabiertospj.poder-judicial.go.cr/dataset/estadisticas-policiales).
