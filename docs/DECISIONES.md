# Decisiones

Entendimiento del flujo, ver diagramas:
![Visión general del sistema de pedidos](diagrams/flows-complete.excalidrawio.svg)
[Abrir en Excalidraw](https://excalidraw.com/#json=d-z1uSN3mValGtYLhV0h2,1pu9srmqkNi35VcSjiVD2g)

## Base de datos y ORM
- PostgreSQL: es una de las que mejor conozco.
- TypeORM: es el ORM que mejor conozco.

**Alternativa considerada:** Prisma. Tiene la ventaja de no poner decoradores en las clases, pero preferí la herramienta que domino. El riesgo de TypeORM (decoradores dentro del dominio) lo evité con dos clases por entidad; ver "Dos clases por entidad".

## Sistema de módulos y framework de pruebas del backend
- CommonJS con Jest.

**Por qué:**
- Jest es el framework de pruebas con más documentación y ejemplos en NestJS, y es el que mejor domino.

## Versión de NestJS
- NestJS 11, no la 12 (última).

**Por qué:**
- NestJS 11 funciona con Node 22 sin configuración adicional, mientras que en NestJS 12 las pruebas con Jest requieren Node 24 y una opción experimental.

## Estructura del backend
- Cuatro capas en `src/`: domain, application, infrastructure, presentation.

**Por qué:**
- Sigue Clean Architecture: las dependencias apuntan hacia domain.
- Capas en el primer nivel y no módulos por funcionalidad, porque el dominio es pequeño (cuatro entidades) y así la arquitectura se ve completa al abrir `src/`.

## El dominio no usa decoradores ni depende del framework
- Las clases de `domain/` son TypeScript puro: sin `@Injectable()`, sin decoradores de TypeORM y sin ningún import de NestJS.

**Por qué:**
- El dominio contiene las reglas del negocio, que es lo más valioso y lo más estable del sistema. No debe depender de herramientas que cambian con el tiempo.
- Lo hace más robusto: actualizar o reemplazar el framework o el ORM no obliga a tocar ninguna regla.
- Lo hace fácil de probar: sus pruebas corren sin base de datos, sin servidor y sin levantar NestJS.

## Dos clases por entidad
- Cada entidad tiene una clase de dominio (`Order`) y una clase de tabla (`OrderOrmEntity`). El repositorio convierte de una a otra.

**Por qué:**
- Es lo que permite usar TypeORM sin que sus decoradores entren al dominio.
- Costo: hay que escribir la conversión en cada repositorio. Con cuatro entidades es poco.
- Consecuencia: `Order` tiene un método `restoreStatus`, que solo usa el repositorio para devolverle a un pedido leído de la base el estado que tenía.

## Casos de uso con decoradores de NestJS
- Las clases de `application/` usan `@Injectable()`.

**Por qué:**
- Es la forma habitual de NestJS y la que mejor conozco; el módulo queda más simple.
- Alternativa descartada: clases puras registradas con `useFactory`, que mantienen `application/` sin imports del framework a cambio de más configuración.
- `domain/` sí queda sin ningún import de NestJS ni de TypeORM.

## Casos de uso y no servicios
- Una clase por acción (`CreateOrderUseCase`, `ApproveOrderUseCase`…), con un solo método `execute`.

**Por qué:**
- Al abrir `application/use-cases/` se lee qué hace el sistema.
- Cada archivo es corto y se prueba por separado. Un `OrdersService` habría juntado todas las acciones en una sola clase.

## Transiciones de estado como tabla
- Las transiciones permitidas están en un solo objeto (`ALLOWED_TRANSITIONS`); lo que no aparece ahí está prohibido.

**Por qué:**
- El enunciado pide rechazar cualquier otra transición. Con una tabla no hay que escribir un `if` por cada caso prohibido.
- Cambiar una regla es modificar una línea y su prueba.

## El estado del pedido solo cambia por sus métodos
- `status` es privado; se cambia con `approve`, `reject`, `cancel` y `dispatch`, y se lee con `getStatus`.

**Por qué:**
- Impide asignar un estado directamente y saltarse la tabla de transiciones.
- Los permisos por rol no van en la entidad; van en los casos de uso.

## Permisos en los casos de uso
- Cada caso de uso recibe al usuario que hace la petición y decide si puede.
- Un pedido o un crédito de otro distribuidor responde "no encontrado" (404), no "prohibido" (403).

**Por qué:**
- El permiso queda junto a la acción y se prueba sin HTTP.
- Con 404 no se revela que el pedido existe.
- En el listado, si un distribuidor pide el filtro de otro distribuidor, se reemplaza por el suyo: el permiso no depende del frontend.

## Errores de negocio
- Todos heredan de `DomainError` y llevan un `code`.

**Por qué:**
- Permite que presentation distinga un error de negocio de un fallo inesperado y elija el código HTTP, sin que domain sepa de HTTP.
- Un solo filtro (`ProblemDetailsFilter`) convierte cualquier error a RFC 9457. El `code` es lo que usa el frontend para mostrar el mensaje en español.

## Inicio de sesión
- El caso de uso depende de dos interfaces (`PasswordHasher` y `TokenService`), no de bcrypt ni de JWT directamente. Así la lógica se prueba sin librerías y la tecnología se puede cambiar sin tocarla.
- Un correo inexistente y una contraseña incorrecta devuelven el mismo error, para no revelar qué correos están registrados.
- JWT con `@nestjs/jwt` y un guard propio, sin Passport: para un solo tipo de autenticación, Passport agrega piezas sin aportar.

## Dinero, galones y fechas
- El dinero se guarda en centavos, como número entero. RD$290.10 se representa como 29010. Con enteros, galones × precio da siempre un resultado exacto; con decimales de JavaScript aparecen errores como 0.1 + 0.2 = 0.30000000000000004. Alternativa descartada: una librería de decimales, que es una dependencia más.
- Los galones son enteros. No se piden 500.5 galones.
- La línea copia el precio, no apunta al producto. `OrderLine` guarda el `productId` y el precio de ese momento. Si el producto sube de precio mañana, el pedido no cambia. Es lo que pide la regla 6.
- La hora actual entra como parámetro. `Order` recibe "ahora" (`createdAt`) en vez de consultarlo por dentro. Así una prueba puede decir "hoy es jueves a las 10:00" y comprobar el caso de 23 h 59 min contra el de 24 h.

## Pruebas con repositorios en memoria
- Los casos de uso se prueban con implementaciones falsas de los repositorios, no con mocks de Jest.

**Por qué:**
- La prueba se lee como un uso real: guardar, ejecutar, comprobar.
- Las pruebas están en carpetas `__test__` separadas del código, por capa.

## Frontend
- React con Vite y TypeScript, React Router, y `fetch` en un solo archivo (`api/client.ts`).

**Por qué:**
- Son cuatro pantallas. Con menos librerías hay menos que configurar y cada línea se puede explicar.
- Alternativa considerada: TanStack Query, React Hook Form y Zod. Las dejé fuera por tiempo; están en pendientes.
- El formulario valida las mismas reglas que el backend para avisar antes de enviar, pero el backend siempre valida de nuevo y su respuesta es la que manda.

## Supuestos
- **Rango de fechas del listado.** El enunciado pide filtrar por "rango de fechas" sin indicar cuál. Asumí la fecha de entrega, porque es la que usa el operador para planificar los despachos.
- **Domingo.** La fecha de entrega lleva hora, y "domingo" se evalúa en hora de República Dominicana (UTC−4, sin horario de verano). Un pedido para el domingo a la 1:00 a. m. hora local ya es lunes en otras zonas; había que fijar cuál manda.
- **Crédito igual al total.** Un pedido cuyo total es exactamente el crédito disponible se acepta ("no puede superar").
- **Motivo de rechazo.** No puede estar vacío ni ser solo espacios.
- **Fecha de cambio de estado.** Se guarda una sola, la del último cambio.
- **Precios.** Tienen como máximo dos decimales. Los precios semilla son de ejemplo.
- **Estados.** Se guardan y viajan en inglés y mayúsculas (`PENDING`, `APPROVED`…); el frontend los muestra en español.
- **Paginación.** La primera página es la 1 y el tamaño máximo es 100, para que una sola petición no pueda traer todos los pedidos.
- **Listado de distribuidores.** Agregué `GET /distributors`, solo para operadores, porque el filtro por distribuidor lo necesita.
