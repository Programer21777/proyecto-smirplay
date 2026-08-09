"use strict";

require("dotenv").config();

const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");
const ultimoGol = require("./api/instagram/ultimo-gol");

const PUERTO = Number(process.env.PORT) || 3000;
const RAIZ = __dirname;
const TIPOS = {
    ".css": "text/css; charset=utf-8",
    ".html": "text/html; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".svg": "image/svg+xml"
};


function servirArchivo(req, res) {
    const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
    const rutaSolicitada = decodeURIComponent(url.pathname);
    const rutaRelativa = rutaSolicitada === "/"
        ? "index.html"
        : rutaSolicitada.replace(/^\/+/, "");
    const rutaArchivo = path.resolve(RAIZ, rutaRelativa);

    if (
        !rutaArchivo.startsWith(`${RAIZ}${path.sep}`) ||
        rutaRelativa.split(/[\\/]/).some(function (parte) {
            return parte.startsWith(".");
        })
    ) {
        res.writeHead(403);
        res.end("Acceso denegado");
        return;
    }

    fs.stat(rutaArchivo, function (error, estadisticas) {
        if (error || !estadisticas.isFile()) {
            res.writeHead(404);
            res.end("No encontrado");
            return;
        }

        const tipo = TIPOS[path.extname(rutaArchivo).toLowerCase()] ||
            "application/octet-stream";

        res.writeHead(200, {
            "Content-Type": tipo,
            "X-Content-Type-Options": "nosniff"
        });
        fs.createReadStream(rutaArchivo).pipe(res);
    });
}


const servidor = http.createServer(function (req, res) {
    const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);

    if (url.pathname === "/api/instagram/ultimo-gol") {
        ultimoGol(req, res);
        return;
    }

    servirArchivo(req, res);
});


servidor.listen(PUERTO, function () {
    console.log(`Smirplay disponible en http://localhost:${PUERTO}`);
});
app.get("/api/tiktok/ultimo-mvp", async (req, res) => {

    try {

        const token = process.env.TIKTOK_ACCESS_TOKEN;

        if (!token) {

            return res.status(500).json({
                error: "No existe token de TikTok"
            });

        }


        const url =
            "https://open.tiktokapis.com/v2/video/list/" +
            "?fields=id,title,video_description,create_time," +
            "cover_image_url,share_url,embed_link,embed_html";


        const respuesta = await fetch(url, {

            method: "POST",

            headers: {

                "Authorization": `Bearer ${token}`,

                "Content-Type": "application/json"

            },

            body: JSON.stringify({

                max_count: 20

            })

        });


        const resultado = await respuesta.json();


        if (
            !resultado.data ||
            !resultado.data.videos
        ) {

            console.log(resultado);

            return res.status(500).json({
                error: "TikTok no devolvió publicaciones"
            });

        }


        const videos = resultado.data.videos;


        const ultimoMVP = videos.find(video => {

            const descripcion =
                (
                    video.video_description ||
                    video.title ||
                    ""
                ).trim();


            return descripcion.startsWith("🏅");

        });


        if (!ultimoMVP) {

            return res.status(404).json({
                error: "No se encontró un MVP"
            });

        }


        res.json(ultimoMVP);

    }

    catch (error) {

        console.error(
            "Error TikTok:",
            error
        );


        res.status(500).json({

            error:
                "No se pudo consultar TikTok"

        });

    }

});