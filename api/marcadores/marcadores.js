"use strict";


const URL_GOOGLE_SHEETS =
    "https://script.google.com/macros/s/AKfycbwFQQqrfuHrnwRbOOiRR4fDyoBft6RMR2RKLgmw5kUo9pY9Le6OLqBvMQPL2wtgx79V/exec";


module.exports =
async function marcadores(
    req,
    res
) {

    /* ===================== CORS ===================== */

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
                ok: false,
                error:
                    "Método no permitido."
            })
        );

        return;
    }


    try {

        /*
         * Vercel consulta Google Apps Script
         * desde el servidor.
         *
         * Así evitamos que GitHub Pages
         * consulte Google directamente.
         */

        const respuesta =
            await fetch(
                URL_GOOGLE_SHEETS,
                {
                    method:
                        "GET",

                    headers: {
                        Accept:
                            "application/json"
                    },

                    redirect:
                        "follow",

                    cache:
                        "no-store"
                }
            );


        const texto =
            await respuesta.text();


        if (
            !respuesta.ok
        ) {

            console.error(
                "Error Google Sheets:",
                respuesta.status,
                texto
            );


            res.writeHead(
                502,
                {
                    "Content-Type":
                        "application/json; charset=utf-8"
                }
            );


            res.end(
                JSON.stringify({
                    ok: false,
                    error:
                        "Google Sheets no respondió correctamente."
                })
            );

            return;
        }


        let datos;


        try {

            datos =
                JSON.parse(
                    texto
                );

        } catch (error) {

            console.error(
                "Respuesta no JSON:",
                texto
            );


            res.writeHead(
                502,
                {
                    "Content-Type":
                        "application/json; charset=utf-8"
                }
            );


            res.end(
                JSON.stringify({
                    ok: false,
                    error:
                        "Google Sheets devolvió una respuesta inválida."
                })
            );

            return;
        }


        /* ===================== RESPUESTA ===================== */

        res.writeHead(
            200,
            {
                "Content-Type":
                    "application/json; charset=utf-8",

                "Cache-Control":
                    "no-store, no-cache, must-revalidate"
            }
        );


        res.end(
            JSON.stringify(
                datos
            )
        );


    } catch (error) {

        console.error(
            "Error consultando marcadores:",
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
                ok: false,
                error:
                    "No se pudieron consultar los marcadores."
            })
        );
    }
};