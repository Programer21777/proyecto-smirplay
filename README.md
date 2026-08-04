# Smirplay

La tarjeta de Instagram muestra automáticamente el Reel más reciente de
`@smirplay` cuya descripción empieza con `⚽`. El token se usa únicamente en el
endpoint del servidor y nunca se envía al navegador.

## Configurar Instagram

1. Crea una app en [Meta for Developers](https://developers.facebook.com/apps/)
   y añade la API de Instagram con inicio de sesión con Instagram.
2. Autoriza la cuenta profesional `@smirplay` con el permiso
   `instagram_business_basic` y genera un token de usuario de Instagram.
3. Obtén el ID de la cuenta con esta consulta, sustituyendo el token:

   ```text
   https://graph.instagram.com/v26.0/me?fields=user_id,username&access_token=TU_TOKEN
   ```

4. Copia `.env.example` como `.env` y agrega `INSTAGRAM_ID` e
   `INSTAGRAM_TOKEN`. `.env` está excluido de Git y no debe subirse.

Documentación oficial:

- [API con inicio de sesión de Instagram](https://developers.facebook.com/documentation/instagram-platform/instagram-api-with-instagram-login/)
- [Referencia de contenido multimedia](https://developers.facebook.com/documentation/instagram-platform/reference/instagram-media/)
- [Referencia de `/me`](https://developers.facebook.com/documentation/instagram-platform/reference/me/)

## Ejecutar localmente

Requiere Node.js 20 o posterior.

```bash
npm install
npm run dev
```

Abre `http://localhost:3000`. No uses Live Server para probar la API porque no
ejecuta `/api/instagram/ultimo-gol`.

## Publicar

GitHub Pages solo publica archivos estáticos y no puede guardar el token ni
ejecutar este endpoint. La opción más simple es importar este mismo repositorio
en Vercel y configurar allí estas variables de entorno:

- `INSTAGRAM_ID`
- `INSTAGRAM_TOKEN`
- `INSTAGRAM_API_VERSION=v26.0`

Vercel publicará tanto la web como `/api/instagram/ultimo-gol` y no necesitas
modificar `index.html`.

Si quieres conservar `https://programer21777.github.io/proyecto-smirplay/`,
publica el backend en Vercel y coloca la URL completa del endpoint en la etiqueta
`smirplay-instagram-api` de `index.html`. En Vercel define además
`ALLOWED_ORIGIN=https://programer21777.github.io`.

## Comprobaciones

```bash
npm test
npm run check
```
