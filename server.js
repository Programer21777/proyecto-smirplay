"use strict";

require("dotenv").config();

const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");

const ultimoGol = require("./api/instagram/ultimo-gol");
const loginTikTok = require("./lib/tiktok-login");
const callbackTikTok = require("./api/tiktok/callback");
const ultimoMvpTikTok = require("./api/tiktok/ultimo-mvp");

const PUERTO = Number(process.env.PORT) || 3000;
const RAIZ = __dirname;

const TIPOS = {
    ".css": "text/css; charset=utf-8",
    ".html": "text/html; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".svg": "image/svg+xml",
    ".ico": "image/x-icon"
};


function servirArchivo(req, res) {

    const url = new URL(
        req.url,
        `http://${req.headers.host || "localhost"}`
    );

    const rutaSolicitada =
        decodeURIComponent(url.pathname);

    const rutaRelativa =
        rutaSolicitada === "/"
            ? "index.html"
            : rutaSolicitada.replace(/^\/+/, "");

    const rutaArchivo =
        path.resolve(RAIZ, rutaRelativa);


    if (
        !rutaArchivo.startsWith(`${RAIZ}${path.sep}`) ||
        rutaRelativa
            .split(/[\\/]/)
            .some(function (parte) {
                return parte.startsWith(".");
            })
    ) {

        res.writeHead(403);

        res.end("Acceso denegado");

        return;
    }


    fs.stat(
        rutaArchivo,
        function (error, estadisticas) {

            if (
                error ||
                !estadisticas.isFile()
            ) {

                res.writeHead(404);

                res.end("No encontrado");

                return;
            }


            const tipo =
                TIPOS[
                    path
                        .extname(rutaArchivo)
                        .toLowerCase()
                ] ||
                "application/octet-stream";


            res.writeHead(
                200,
                {
                    "Content-Type": tipo,
                    "X-Content-Type-Options":
                        "nosniff"
                }
            );


            fs
                .createReadStream(rutaArchivo)
                .pipe(res);

        }
    );

}


const servidor =
    http.createServer(
        function (req, res) {

            const url =
                new URL(
                    req.url,
                    `http://${req.headers.host || "localhost"}`
                );


            /* API DE INSTAGRAM */

            if (
                url.pathname ===
                "/api/instagram/ultimo-gol"
            ) {

                ultimoGol(req, res);

                return;
            }

            /* TIKTOK LOGIN */

             if (
            url.pathname ===
             "/api/tiktok/login"
             ) {

             loginTikTok(req, res);

             return;
             }


             /* TIKTOK CALLBACK */

             if (
        url.pathname ===
        "/api/tiktok/callback"
            ) {

        callbackTikTok(req, res);

        return;
    }

    /* TIKTOK ÚLTIMO MVP */

if (
    url.pathname ===
    "/api/tiktok/ultimo-mvp"
) {

    ultimoMvpTikTok(req, res);

    return;
}
            /* ARCHIVOS DE LA PÁGINA */

            servirArchivo(req, res);

        }
    );


servidor.listen(
    PUERTO,
    function () {

        console.log(
            `Smirplay disponible en http://localhost:${PUERTO}`
        );

    }
);