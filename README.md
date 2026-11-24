# Applus Front

Panel administrativo del sistema de **programación de órdenes de servicio** (visitas técnicas de un contratista de Afinia). Consume la API de [applus](../applus) y es el lugar desde donde el área administrativa carga el Excel de Afinia, asigna técnicos, publica las OS (quedan visibles en la app móvil del técnico), registra resultados y saca reportes.

## Stack

React 18 · Vite 5 · Tailwind CSS 4 · React Router 7. Sin librerías de UI ni de estado: fetch con un wrapper propio y contexto de autenticación.

## Puesta en marcha

```bash
npm install
cp .env.example .env    # VITE_API_URL=https://<backend>/api  (local: http://localhost:8080/api)
npm run dev             # http://localhost:5173
npm run build           # genera dist/
npm run lint
```

Primera vez: entra a `/register` para crear el usuario administrador (el backend solo lo permite cuando no existe ningún usuario). Después, los demás usuarios se crean desde **Usuarios**.

## Roles

- **Administrador**: todo, incluida la gestión de usuarios y técnicos.
- **Supervisor**: programaciones, resultados y reportes.
- **Técnico**: no entra al panel (el login lo rechaza con un aviso); usa la app móvil.

## Vistas

| Ruta | Qué hace |
| --- | --- |
| `/dashboard` | Números de la operación: pendientes, sin técnico, publicadas, vencidas sin resultado, ejecutadas, duplicadas, técnicos activos. Trabajo del día por técnico (OS, vistas en la app, resultados) y resultados acumulados. Selector de día. |
| `/precargar` | Descargar plantilla, cargar Excel, revisar lo cargado (duplicadas y sin técnico marcadas), asignar técnico, eliminar pendientes y **publicar**. |
| `/historico` | OS publicadas con filtros (fechas por campo, técnico, municipio, estado de ejecución, búsqueda), paginación, exportar Excel y detalle. |
| `/resultados` | Ciclo Excel: exportar las OS publicadas con columnas de resultado vacías, cargar el Excel diligenciado (todo o nada, errores por fila) y ver/registrar resultados individuales. |
| `/reportes` | Cumplimiento por técnico o municipio en un rango de fechas estimadas, con descarga a Excel. |
| `/usuarios` | (Solo admin) Crear, editar, activar/desactivar y restablecer contraseña de usuarios. Los técnicos llevan cédula, teléfono y municipio para cruzarlos con la columna `ASIGNADO_A` del Excel. |
| `/perfil` | Datos propios y cambio de contraseña. |

El **detalle de una OS** (modal, disponible en Precargar, Histórico y Resultados) muestra cliente, asignación, trazabilidad (quién cargó, publicó, cuándo la vio el técnico) y resultado, y permite editar datos, asignar o reasignar técnico, registrar resultado o eliminar según el estado.

## Estructura

```
src/
├─ api/client.js            # apiFetch (JSON + token + errores), apiDownload (xlsx), query()
├─ context/AuthContext.jsx  # Sesión en localStorage, login/logout, rol, esAdmin
├─ components/              # Layout, Sidebar (menú por rol), Navbar, Modal, Confirmar, Alerta,
│                           # Paginacion, SelectTecnico, DetalleOS, Badges, Icon, ui.js (clases comunes)
├─ hooks/useMensaje.js      # Mensajes de estado que se ocultan solos
├─ pages/                   # Una por ruta
└─ utils/programaciones.js  # Fechas, filtros -> query params, fetchProgramaciones, fetchTecnicos, validarExcel
```

## Convenciones

- Las fechas sin hora del backend (`YYYY-MM-DDT00:00:00.000Z`) se interpretan como fecha local para no mostrar el día anterior.
- Los filtros de rango se envían como instantes ISO del día local completo; el backend los respeta exactos.
- Cualquier respuesta `401` cierra la sesión (evento `auth:unauthorized`).
- Los `.xlsx` se descargan con `apiDownload` (token en el header, `formato=archivo`) o con `descargarDataUrl` cuando el backend devuelve `dataUrl`.

## Despliegue

Vercel con `vercel.json` (rewrites a `index.html`). Variable `VITE_API_URL` apuntando al backend desplegado, con el sufijo `/api`.
