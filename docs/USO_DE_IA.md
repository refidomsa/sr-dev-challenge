# Uso de IA

## 1. Herramienta y forma de trabajo

Usé **Claude (Anthropic)**, en la app de escritorio, dentro de un proyecto con el enunciado cargado como documento. No usé autocompletado de IA en el editor.

Antes de empezar le fijé estas reglas:

- No hacer ningún cambio sin mi autorización.
- Utilizar el patrón de diseño Clean Architecture.
- Siempre explicar el porqué de un cambio.
- El backend en NestJS y el frontend en React.
- En lo posible, diagramar las respuestas, en formato editable en Excalidraw.

Durante el trabajo agregué tres más:

- Todos los nombres de código y de archivos van en inglés.
- Las pruebas no deben ser tan largas.
- Pruebas Unitarias
El trabajo tuvo **dos etapas distintas**, y prefiero dejarlo claro:

| Etapa | Qué cubre | Cómo trabajé |
| --- | --- | --- |
| 1. Paso a paso | Análisis del enunciado, diagramas, `domain/` completo y `application/` completo (casos de uso y sus pruebas) | La IA proponía un trozo pequeño y lo explicaba. Yo lo leía, preguntaba, lo corregía o lo reescribía, lo copiaba a mano, corría las pruebas y hacía el commit. La IA no escribía en mi repositorio. |

La etapa 1 es la que conozco línea por línea. 

## 2. Para qué la usé

- **Entender el enunciado:** flujos del distribuidor y del operador, y qué es el crédito disponible, antes de decidir tecnología.
- **Planificar:** estructura de carpetas, flujo de Git (ramas por área, un solo Pull Request), orden de construcción.
- **Escribir código** con explicación, capa por capa.
- **Verificar:** la IA probaba cada entrega en una copia aislada del proyecto (compilación, pruebas, lint) antes de dármela, y el backend contra un PostgreSQL real.
- **Diagnosticar errores** que yo le pegaba de la terminal o del editor.
- **Documentar:** borradores de este archivo, de `DECISIONES.md` y de `SOLUTION.md`, a partir del registro de la conversación.

## 3. Prompts más relevantes

Textuales.

| # | Prompt | Para qué sirvió |
| --- | --- | --- |
| 1 | "Antes de darte una decisión vamos a crear un diagrama para entender lo solicitado. Primero entendamos lo que se pide, luego vamos con la tecnologia" | Frenar las decisiones de stack y forzar primero el análisis. |
| 2 | "Antes que nada, que vendria siendo la linea de credito?" | Separar límite de crédito (dato fijo) de crédito disponible (valor calculado). |
| 3 | "Si, me voy con el esctrito, pero antes D, necesito que me expliques Anillo de Clean Architecture" / "Ahora no me lo espliques con el dibujo, transpolalo a mi realidad de carpetas" | Entender la regla de dependencias sobre mis propias carpetas, no en abstracto. |
| 5 | "Bien pues creemos id fijos para los productos que tengo actualmente" | De aquí salió el enum `ProductId`. |
| 6 | "Aqui te equivocaste al poner en el orderLine que solo recibe product, como string […] Cuando en realidad es el id del producto que recibe" | Corregir un tipo demasiado genérico (ver sección 4). |
| 7 | "Aqui veo un error, y es que si es distribuidor puede eliminar un orden id por que solo esta validando si no es Distribuidor" | Revisar el permiso de cancelación (ver sección 4). |


## 4. Casos en que la IA se equivocó o propuso algo que no acepté

### Errores de la IA

- **Recomendó instalar la última versión de NestJS sin verificarla.** Indicó `npx @nestjs/cli@latest`, que instaló NestJS 12. Al correr `npm test` falló: NestJS 12 es solo ES Modules y Jest necesita Node 24 con una opción experimental; yo tengo Node 22. Lo detecté yo al ejecutar las pruebas. La IA lo reprodujo en una copia aislada y regeneré el proyecto con NestJS 11. Costó cerca de media hora.
- **Lista de dependencias desactualizada.** Dio por hecho que el proyecto traía ESLint; NestJS 12 trae otra herramienta.
- **Tipo demasiado genérico.** Después de crear `ProductId`, dejó que `OrderLine` recibiera el producto como `string`. Eso permitía pasar el nombre (`'Gasolina Premium'`) donde iba el id (`'premium-gasoline'`). Lo señalé y se cambió a `productId: ProductId`; ahora ese error no compila.
- **`Product` sin validación ni pruebas.** Lo entregó como un contenedor de datos. Pedí las pruebas y, al revisarlo, se podía crear un producto con precio negativo. Se agregó la validación.
- **Mostró un cambio sin todos sus archivos.** Describió tres archivos en vez de mostrarlos. Desde entonces le exigí el código completo de cada archivo.

### Propuestas que rechacé o cambié

| Qué propuso la IA | Qué hice yo | Por qué |
| --- | --- | --- |
| Cerrar de inmediato las decisiones de stack. | Las pospuse hasta entender el enunciado con diagramas. | Elegir tecnología antes de entender el problema lleva a decisiones que no puedo justificar. |
| Prisma como ORM, para evitar decoradores en el dominio. | Elegí TypeORM. | Es el que domino. El riesgo que señalaba la IA lo resolvimos con dos clases por entidad. |
| Casos de uso como clases puras registradas con `useFactory`. | Elegí `@Injectable()`. | Es la forma habitual de NestJS y el módulo queda más simple. `domain/` sí quedó sin framework. |
| Pruebas con `it.each`, `flatMap` y funciones auxiliares. | Pedí pruebas explícitas. | Tengo que poder explicar cada línea. |
| `Product` y `OrderLine` con constructor abreviado, constructor privado, `static create` y getters. | Pedí dos veces "más entendible" y terminé reescribiéndolas a mi manera: propiedades arriba, constructor con parámetros, una condición por `if`. | Legibilidad. La IA tardó tres correcciones en adoptarlo como norma. |
| Archivos de prueba junto al código. | Los puse en carpetas `__test__` por capa. | Mantener las pruebas separadas del código. |
| Renombrar `Order.distributor` a `distributorId`. | Lo dejé como estaba. | El tipo `string` ya era correcto. |
| Un archivo de pruebas de 300 líneas para los cuatro casos de uso de estado. | Pedí pruebas más cortas; desde ahí fue un archivo por caso de uso con datos compartidos. | Legibilidad. |
| Diez diagramas en archivos separados. | Armé yo un único lienzo con todo conectado. | Un solo diagrama integrado se entiende mejor y no obliga a descargar archivos. |
| Rama única llamada `solucion`; nombres de archivos en español. | `feature/backend` y `feature/frontend`; todo nombre de código en inglés. | Orden y convención. |

### Una vez que la corregí y no era un error

Al leer `CancelOrderUseCase` creí que cualquier distribuidor podía cancelar cualquier pedido, porque el primer `if` solo comprueba el rol. Había una segunda comprobación más abajo (que el pedido sea de su distribuidor) y dos pruebas que la cubren. No era un error, pero sí un problema de claridad: los dos permisos no se leían como un par. Lo dejo anotado porque revisar código de IA también es esto: dudar, comprobar y confirmar.

### Limitaciones que noté

- No pudo abrir mi enlace de Excalidraw; la validación de ese diagrama es mía.
- Los archivos `.excalidraw` que generó no los verificó visualmente; los revisé y reorganicé yo.


## 5. Decisiones que tomé yo

Independientes de lo que sugirió la IA, o en contra:

- NestJS, React y Clean Architecture, fijados antes de empezar.
- PostgreSQL y TypeORM, por dominio propio de las herramientas.
- NestJS 11 en lugar de 12, tras ver fallar las pruebas.
- Entender primero, tecnología después.
- Estilo de código explícito y legible por encima de conciso.
- Ids fijos para los productos, y que la línea referencie al producto por id.
- Pruebas en carpetas `__test__`.
- Comentarios de las reglas de negocio con el texto del enunciado, en español.
- Agregué una prueba propia de transición inválida y modifiqué la tabla de transiciones a propósito para comprobar que las pruebas detectaban el cambio.
- Cambiar a trabajo por lotes al final, aceptando el costo: menos control línea por línea sobre `infrastructure/`, `presentation/` y el frontend.

Propuestas de la IA que evalué y acepté: un repositorio con `backend/`, `frontend/` y `docs/`; dinero en centavos enteros; transiciones como tabla; errores de negocio con `code`; la hora actual como parámetro; repositorios en memoria en vez de mocks; "no encontrado" para pedidos ajenos; un mismo error para correo o contraseña incorrectos.

## 6. Qué aprendí del proceso

- Pedir la explicación antes del código me dio decisiones que puedo defender; pedir código primero me habría dado código que solo podría leer.
- `@latest` en un reto con tiempo limitado es un riesgo: conviene fijar la versión que uno domina.
- La IA tiende a escribir código más ingenioso de lo necesario. Hay que pedirle legibilidad de forma explícita y repetirlo.
- El paso a paso con explicación consume mucho tiempo. Con más horas habría construido también las últimas capas así.
