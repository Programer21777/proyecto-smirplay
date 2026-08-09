"use strict";

const crypto = require("node:crypto");
const { obtenerRedis } = require("../../lib/tiktok-redis");

function obtenerCookies(req) {

    const cookies = {};
    const header = req.headers.cookie || "";

    header.split(";").forEach(function (cookie) {

        const partes = cookie.trim().split("=");

        if (partes.length >= 2) {

            const nombre = partes.shift();

            cookies[nombre] =
                decodeURIComponent(partes.join("="));

        }

    });

    return cookies;
}


function compararSeguro(valor1, valor2) {

    if (!valor1 || !valor2) {
        return false;
    }

    const a = Buffer.from(valor1);
    const b = Buffer.from(valor2);

    if (a.length !== b.length) {
        return false;
    }

    return crypto.timingSafeEqual(a, b);
}


module.exports = async function callbackTikTok(req, res) {

    try {

        const CLIENT_KEY =
            process.env.TIKTOK_CLIENT_KEY;

        const CLIENT_SECRET =
            process.env.TIKTOK_CLIENT_SECRET;

        const REDIRECT_URI =
            process.env.TIKTOK_REDIRECT_URI;


        if (
            !CLIENT_KEY ||
            !CLIENT_SECRET ||
            !REDIRECT_URI
        ) {

            res.writeHead(500, {
                "Content-Type":
                    "text/plain; charset=utf-8"
            });

            res.end(
                "Faltan variables de entorno de TikTok."
            );

            return;
        }


        const url = new URL(
            req.url,
            `https://${req.headers.host}`
        );


        /* TikTok puede devolver un error */

        const errorTikTok =
            url.searchParams.get("error");

        const descripcionError =
            url.searchParams.get(
                "error_description"
            );


        if (errorTikTok) {

            res.writeHead(400, {
                "Content-Type":
                    "text/html; charset=utf-8"
            });

            res.end(`
                <h1>Error de TikTok</h1>

                <p>${errorTikTok}</p>

                <p>
                    ${descripcionError || ""}
                </p>
            `);

            return;
        }


        /* Recuperamos code y state */

        const code =
            url.searchParams.get("code");

        const stateRecibido =
            url.searchParams.get("state");


        if (!code) {

            res.writeHead(400, {
                "Content-Type":
                    "text/plain; charset=utf-8"
            });

            res.end(
                "TikTok no devolvió el código de autorización."
            );

            return;
        }


        /* Revisamos el state */

        const cookies =
            obtenerCookies(req);

        const stateGuardado =
            cookies.tiktok_oauth_state;


        if (
            !compararSeguro(
                stateRecibido,
                stateGuardado
            )
        ) {

            res.writeHead(403, {
                "Content-Type":
                    "text/plain; charset=utf-8"
            });

            res.end(
                "El state de TikTok no coincide."
            );

            return;
        }


        /*
         * Eliminamos la cookie del state
         */

        res.setHeader(
            "Set-Cookie",
            "tiktok_oauth_state=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0"
        );


        /*
         * Intercambiamos CODE por TOKENS
         */

        const body =
            new URLSearchParams({

                client_key:
                    CLIENT_KEY,

                client_secret:
                    CLIENT_SECRET,

                code:
                    code,

                grant_type:
                    "authorization_code",

                redirect_uri:
                    REDIRECT_URI

            });


        const respuestaTikTok =
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
            await respuestaTikTok.json();


        if (
            !respuestaTikTok.ok ||
            datos.error
        ) {

            console.error(
                "Error OAuth TikTok:",
                datos
            );


            res.writeHead(500, {

                "Content-Type":
                    "application/json; charset=utf-8"

            });


            res.end(
                JSON.stringify(
                    {
                        error:
                            "TikTok no pudo generar el token.",

                        detalle:
                            datos
                    },
                    null,
                    2
                )
            );

            return;
        }


        /*
         * IMPORTANTE:
         * Esto es solamente para la primera prueba.
         *
         * Luego guardaremos refresh_token
         * de forma segura para automatizar
         * la renovación.
         */


        res.writeHead(200, {

            "Content-Type":
                "text/html; charset=utf-8",

            "Cache-Control":
                "no-store"

        });


        res.end(`

            <!DOCTYPE html>

            <html lang="es">

            <head>

                <meta charset="UTF-8">

                <meta
                    name="viewport"
                    content="width=device-width,
                    initial-scale=1.0">

                <title>
                    TikTok conectado
                </title>

            </head>

            <body
                style="
                    background:#080b12;
                    color:white;
                    font-family:Arial;
                    text-align:center;
                    padding:60px;
                "
            >

                <h1>
                    TikTok conectado correctamente ✅
                </h1>

                <p>
                    La cuenta autorizó Smirplay2.
                </p>

                <p>
                    Scopes autorizados:
                </p>

                <strong>
                    ${datos.scope || "No disponible"}
                </strong>

                <hr
                    style="
                        margin:40px auto;
                        max-width:600px;
                        border-color:#333;
                    "
                >

                <p>
                    Open ID:
                </p>

                <code>
                    ${datos.open_id || ""}
                </code>

                <p style="margin-top:30px;">
                    La autorización quedó completada.
                </p>

            </body>

            </html>

        `);


        /*
         * Por seguridad NO mostramos
         * access_token ni refresh_token
         * en el navegador.
         */

        console.log(
            "TikTok autorizado correctamente."
        );

        console.log(
            "Scopes:",
            datos.scope
        );

    }

    catch (error) {

        console.error(
            "Error callback TikTok:",
            error
        );


        res.writeHead(500, {

            "Content-Type":
                "application/json; charset=utf-8"

        });


        res.end(
            JSON.stringify({

                error:
                    "Error interno al conectar TikTok."

            })
        );

    }

};