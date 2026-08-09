"use strict";

const {
    obtenerRedis
} = require("../../lib/tiktok-redis");


async function obtenerAccessTokenValido() {

    const redis = obtenerRedis();

    const oauth =
        await redis.hgetall("tiktok:oauth");


    if (
        !oauth ||
        !oauth.access_token ||
        !oauth.refresh_token
    ) {
        throw new Error(
            "TikTok todavía no tiene tokens guardados en Redis."
        );
    }


    const ahora =
        Math.floor(Date.now() / 1000);

    const expiresAt =
        Number(oauth.expires_at || 0);


    /*
     * Si todavía faltan más de 5 minutos
     * para que expire, usamos el token actual.
     */
    if (
        expiresAt >
        ahora + 300
    ) {
        return oauth.access_token;
    }


    /*
     * Si ya expiró o está por expirar,
     * renovamos automáticamente.
     */

    const CLIENT_KEY =
        process.env.TIKTOK_CLIENT_KEY;

    const CLIENT_SECRET =
        process.env.TIKTOK_CLIENT_SECRET;


    if (
        !CLIENT_KEY ||
        !CLIENT_SECRET
    ) {
        throw new Error(
            "Faltan las credenciales de TikTok."
        );
    }


    const body =
        new URLSearchParams({

            client_key:
                CLIENT_KEY,

            client_secret:
                CLIENT_SECRET,

            grant_type:
                "refresh_token",

            refresh_token:
                oauth.refresh_token

        });


    const respuesta =
        await fetch(
            "https://open.tiktokapis.com/v2/oauth/token/",
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/x-www-form-urlencoded"
                },

                body:
                    body.toString()
            }
        );


    const datos =
        await respuesta.json();


    if (
        !respuesta.ok ||
        datos.error
    ) {

        console.error(
            "Error renovando token TikTok:",
            datos
        );

        throw new Error(
            "No se pudo renovar el access token de TikTok."
        );
    }


    const nuevoAhora =
        Math.floor(Date.now() / 1000);


    await redis.hset(
        "tiktok:oauth",
        {
            access_token:
                datos.access_token,

            refresh_token:
                datos.refresh_token ||
                oauth.refresh_token,

            expires_at:
                nuevoAhora +
                Number(datos.expires_in || 0),

            refresh_expires_at:
                nuevoAhora +
                Number(
                    datos.refresh_expires_in || 0
                ),

            open_id:
                datos.open_id ||
                oauth.open_id ||
                "",

            scope:
                datos.scope ||
                oauth.scope ||
                ""
        }
    );


    console.log(
        "Token de TikTok renovado correctamente."
    );


    return datos.access_token;
}



module.exports =
async function ultimoMvpTikTok(
    req,
    res
) {

    /*
     * Permite consultas desde
     * tu página de GitHub Pages.
     */

    res.setHeader(
        "Access-Control-Allow-Origin",
        "*"
    );

    res.setHeader(
        "Access-Control-Allow-Methods",
        "GET, OPTIONS"
    );

    res.setHeader(
        "Access-Control-Allow-Headers",
        "Content-Type"
    );


    if (
        req.method === "OPTIONS"
    ) {

        res.writeHead(204);

        res.end();

        return;
    }


    if (
        req.method !== "GET"
    ) {

        res.writeHead(
            405,
            {
                "Content-Type":
                    "application/json; charset=utf-8"
            }
        );

        res.end(
            JSON.stringify({
                error:
                    "Método no permitido"
            })
        );

        return;
    }


    try {

        /*
         * Obtenemos un access token
         * válido desde Redis.
         */

        const ACCESS_TOKEN =
            await obtenerAccessTokenValido();


        const CAMPOS = [
            "id",
            "title",
            "video_description",
            "create_time",
            "cover_image_url",
            "share_url",
            "embed_link"
        ].join(",");


        let cursor = null;

        let pagina = 0;
        const candidatosMvp = [];


        /*
         * Máximo 5 páginas.
         * 20 publicaciones por página.
         */

        while (
            pagina < 5
        ) {

            pagina++;


            const body = {
                max_count: 20
            };


            if (cursor) {
                body.cursor = cursor;
            }


            const respuesta =
                await fetch(
                    `https://open.tiktokapis.com/v2/video/list/?fields=${CAMPOS}`,
                    {
                        method:
                            "POST",

                        headers: {

                            "Authorization":
                                `Bearer ${ACCESS_TOKEN}`,

                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify(body)
                    }
                );


            const datos =
                await respuesta.json();


            if (
                !respuesta.ok
            ) {

                console.error(
                    "Error HTTP TikTok:",
                    respuesta.status,
                    datos
                );


                res.writeHead(
                    respuesta.status,
                    {
                        "Content-Type":
                            "application/json; charset=utf-8"
                    }
                );


                res.end(
                    JSON.stringify({
                        error:
                            "TikTok rechazó la solicitud.",

                        detalle:
                            datos
                    })
                );

                return;
            }


            if (
                datos.error &&
                datos.error.code &&
                datos.error.code !== "ok"
            ) {

                console.error(
                    "Error API TikTok:",
                    datos.error
                );


                res.writeHead(
                    500,
                    {
                        "Content-Type":
                            "application/json; charset=utf-8"
                    }
                );


                res.end(
                    JSON.stringify({
                        error:
                            "TikTok devolvió un error.",

                        detalle:
                            datos.error
                    })
                );

                return;
            }


            const videos =
                datos.data?.videos || [];


            /*
             * Buscamos la publicación
             * cuya descripción empiece
             * exactamente con 🏅
             */

            const mvp =
                videos.find(
                    function (video) {

                        const descripcion =
                            (
                                video.video_description ||
                                video.title ||
                                ""
                            ).trim();


                        return (
                            descripcion
                                .startsWith("🏅")
                        );
                    }
                );


            if (mvp) {

                const descripcion =
                    (
                        mvp.video_description ||
                        mvp.title ||
                        ""
                    ).trim();


                res.writeHead(
                    200,
                    {
                        "Content-Type":
                            "application/json; charset=utf-8",

                        "Cache-Control":
                            "no-store"
                    }
                );


                res.end(
                    JSON.stringify({

                        encontrado:
                            true,

                        mvp: {

                            id:
                                mvp.id,

                            descripcion:
                                descripcion,

                            fecha:
                                mvp.create_time,

                            portada:
                                mvp.cover_image_url ||
                                null,

                            enlace:
                                mvp.share_url ||
                                null,

                            embed:
                                mvp.embed_link ||
                                null
                        }

                    })
                );


                return;
            }


            const hayMas =
                datos.data?.has_more === true;


            cursor =
                datos.data?.cursor;


            if (
                !hayMas ||
                !cursor
            ) {
                break;
            }
        }


        /*
         * No encontramos un MVP.
         */

        res.writeHead(
            200,
            {
                "Content-Type":
                    "application/json; charset=utf-8",

                "Cache-Control":
                    "no-store"
            }
        );


        res.end(
            JSON.stringify({

                encontrado:
                    false,

                mensaje:
                    "No se encontró una publicación reciente cuya descripción comience con 🏅."

            })
        );


    } catch (error) {

        console.error(
            "Error consultando último MVP:",
            error
        );


        res.writeHead(
            500,
            {
                "Content-Type":
                    "application/json; charset=utf-8"
            }
        );


        res.end(
            JSON.stringify({
                error:
                    error.message ||
                    "Error interno al consultar el último MVP."
            })
        );
    }
};