# CWM Music Manager

Aplicación de escritorio para organizar productores, temas, eventos y playlists.

**Autor:** Camilo Ariza Velasco

## Sitio web

La página de presentación se construye con Vite desde `website.html`. GitHub Actions publica automáticamente el sitio en GitHub Pages al subir cambios a la rama `main`.

## Aplicación para Windows

Descarga el instalador disponible en [Releases](https://github.com/brayamcamiloa-boop/cwm-music-manager/releases).

## Desarrollo local

```powershell
npm ci
npm run dev
```

Para abrir solo la página web:

```powershell
npm run dev:web
```

## Compilación

```powershell
npm run build
npm run dist:win
```

Los archivos de instalación, respaldos locales y dependencias no se incluyen en el repositorio.
