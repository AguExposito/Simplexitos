# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)

# Simplexitos - Sistema de Gestión de Inventarios

## Validaciones de Baja de Productos

### Control de Baja contra Órdenes de Compra

El sistema implementa validaciones estrictas para evitar la baja de productos cuando:

1. **Órdenes de Compra Activas**: No se permite eliminar un producto si tiene órdenes de compra con estado:
   - `ABIERTA` (pendiente)
   - `RECIBIDA` (enviada/recibida)

2. **Stock Disponible**: No se permite eliminar un producto si tiene unidades en stock (stock > 0).

### Estados de Órdenes de Compra

- **ABIERTA**: Orden pendiente de procesamiento
- **RECIBIDA**: Orden enviada y recibida
- **CANCELADA**: Orden cancelada (no impide la baja)

### Proceso de Baja

Para poder eliminar un producto, el usuario debe:

1. **Vender o transferir todo el stock** del producto
2. **Cancelar todas las órdenes de compra** pendientes o enviadas
3. Una vez cumplidas estas condiciones, el sistema permitirá la eliminación

### Interfaz de Usuario

- La tabla de productos muestra el **stock actual** de cada producto
- Los botones de eliminar se muestran en gris cuando el producto no puede ser eliminado
- Al intentar eliminar, el sistema muestra mensajes detallados explicando por qué no se puede proceder

### Endpoints de API

- `GET /producto/:id/status` - Verifica el estado de un producto antes de eliminar
- `DELETE /producto/:id` - Elimina un producto (con validaciones)

### Mensajes de Error

El sistema proporciona mensajes específicos como:
- "El producto tiene X unidades en stock. Debe vender o transferir todo el stock antes de eliminar el producto."
- "El producto tiene X orden(es) pendiente(s) y Y enviada(s). Debe cancelar todas las órdenes antes de eliminar el producto."
