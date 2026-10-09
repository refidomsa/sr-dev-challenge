# Solución — Gestión de Pedidos de Combustible

Backend en NestJS 11 con Clean Architecture, PostgreSQL con TypeORM, y frontend en React con Vite.

## Requisitos

- Node.js 22 o superior y npm
- Docker (para la base de datos)

## Cómo ejecutar todo localmente

Tres terminales, desde la raíz del repositorio.

**0. Usuarios**
Una vez descagado el pryecto Antes de levantarlo llenar el env tal como se puso el .env.example con la contraseña general para todos los roles y agregar diferentes correos validos para los 2 tipos de roles existentes, operador y distribuidor

**1. Base de datos**

```bash
docker compose up -d
```

Levanta PostgreSQL 16 en el puerto 5433 (no el 5432, para no chocar con un PostgreSQL local) (usuario `postgres`, contraseña `postgres`, base `fuel_orders`).

**2. Backend** (http://localhost:3000)

```bash
cd backend
npm install
npm run start:dev
```

Al arrancar crea las tablas y, si la base está vacía, carga los datos semilla. No hace falta un archivo `.env`: los valores por defecto están en `backend/.env.example`.

**3. Frontend** (http://localhost:5173)

```bash
cd frontend
npm install
npm run dev
```

## Usuarios de prueba

La contraseña de los tres es `Refidomsa123`.

| Correo | Rol | Distribuidor |
| --- | --- | --- |
| `operador@refidomsa.test` | Operador | — |
| `ana@losprados.test` | Distribuidor | Estación Los Prados (límite RD$5,000,000) |
| `carlos@elcaribe.test` | Distribuidor | Estación El Caribe (límite RD$3,000,000) |

Hay un tercer distribuidor sin usuario, Estación La Vega (límite RD$200,000), y los cuatro productos.

## Cómo correr las pruebas

```bash
cd backend
npm test
```

Las pruebas unitarias. No necesitan base de datos ni servidor: prueban las reglas de negocio (`src/domain/__test__`) y los casos de uso con repositorios en memoria (`src/application/__test__`).

## Endpoints

Todos, salvo el login, requieren el encabezado `Authorization: Bearer <token>`.

| Método y ruta | Qué hace | Quién |
| --- | --- | --- |
| `POST /auth/login` | Inicia sesión y devuelve el token | Todos |
| `GET /products` | Lista los productos | Todos |
| `GET /orders` | Lista pedidos. Parámetros: `status`, `distributorId`, `deliveryFrom`, `deliveryTo` (`YYYY-MM-DD`), `page`, `pageSize` | Distribuidor: los suyos. Operador: todos |
| `GET /orders/:id` | Detalle de un pedido | Igual que el listado |
| `POST /orders` | Crea un pedido | Distribuidor |
| `POST /orders/:id/approve` | Aprueba | Operador |
| `POST /orders/:id/reject` | Rechaza (cuerpo: `reason`) | Operador |
| `POST /orders/:id/dispatch` | Marca como despachado | Operador |
| `POST /orders/:id/cancel` | Cancela | Distribuidor, solo los suyos |
| `GET /distributors/:id/credit` | Crédito disponible | Distribuidor: el suyo. Operador: cualquiera |
| `GET /distributors` | Lista distribuidores (para el filtro) | Operador |

Los errores siguen RFC 9457 (`application/problem+json`) y llevan un `code` estable, por ejemplo:

```json
{
  "type": "https://refidomsa.test/problems/sunday_delivery",
  "title": "SundayDeliveryError",
  "status": 422,
  "detail": "The delivery date cannot be a Sunday",
  "instance": "/orders",
  "code": "SUNDAY_DELIVERY"
}
```

| Situación | HTTP |
| --- | --- |
| Datos mal formados | 400 |
| Sin token, token inválido o credenciales incorrectas | 401 |
| El rol no puede hacer la acción | 403 |
| No existe, o es de otro distribuidor | 404 |
| El estado del pedido no admite el cambio | 409 |
| Rompe una regla de negocio (galones, fecha, crédito…) | 422 |

## Estructura

```
backend/src/
  domain/          Entidades, reglas de negocio, errores e interfaces de repositorio. Sin NestJS ni TypeORM.
  application/     Casos de uso (uno por acción) y puertos (reloj, ids, hash, token).
  infrastructure/  TypeORM, JWT, bcrypt, datos semilla.
  presentation/    Controladores, DTOs, guard de autenticación y filtro de errores.
frontend/src/
  api/             Cliente HTTP y tipos.
  auth/            Sesión del usuario.
  pages/           Login, lista, nuevo pedido y detalle.
  components/      Piezas compartidas.
  lib/             Formato y validaciones del formulario.
docs/
  DECISIONES.md    Decisiones, alternativas y supuestos.
  USO_DE_IA.md     Cómo usé la IA.
```

## Pendientes y mejoras

Lo que dejé fuera a propósito, por el tiempo disponible, y haría con más tiempo:

- **Migraciones.** Las tablas se crean con `synchronize: true` de TypeORM. En producción deben ser migraciones versionadas.
- **Concurrencia.** Dos pedidos creados al mismo tiempo por el mismo distribuidor pueden pasar ambos la verificación de crédito. La solución es una transacción con bloqueo de la fila del distribuidor. Lo mismo para dos operadores cambiando el mismo pedido: columna de versión.
- **Historial de estados.** Solo se guarda la fecha del último cambio. Faltaría una tabla con cada cambio y quién lo hizo.
- **Pruebas.** Faltan pruebas de integración de los repositorios contra PostgreSQL, pruebas e2e de los endpoints y pruebas del frontend.
- **Un solo comando.** Docker Compose solo levanta la base de datos. Faltan los Dockerfile del backend y del frontend para levantar todo con `docker compose up`.
- **Frontend.** No usa una librería de datos (TanStack Query) ni de formularios (React Hook Form + Zod); el estado se maneja con `useState` y `useEffect`. Alcanza para cuatro pantallas, pero no escalaría bien.
- **Seguridad.** El token se guarda en `localStorage` y no hay refresh token ni límite de intentos de login. El secreto JWT tiene un valor por defecto para desarrollo.
- **Documentación de la API.** Sin Swagger/OpenAPI.
- **CI.** Sin pipeline que corra lint y pruebas en cada push.
- **Mensajes del backend en inglés.** El frontend los traduce por `code`; faltaría internacionalización real.
