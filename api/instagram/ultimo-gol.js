"use strict";

const {
    consultarPublicaciones,
    seleccionarUltimoGol,
    serializarReel
} = require("../../lib/instagram");


function configurarCors(req, res) {
    const origenPermitido = process.env.ALLOWED_ORIGIN || "*";

    res.setHeader("Access-Control-Allow-Origin", origenPermitido);
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Accept, Content-Type");

    if (origenPermitido !== "*") {
        res.setHeader("Vary", "Origin");
    }
}


function responderJson(res, estado, contenido) {
    res.statusCode = estado;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.end(JSON.stringify(contenido));
}


async function ultimoGol(req, res) {
    configurarCors(req, res);

    if (req.method === "OPTIONS") {
        res.statusCode = 204;
        res.end();
        return;
    }

    if (req.method !== "GET") {
        res.setHeader("Allow", "GET, OPTIONS");
        responderJson(res, 405, { error: "Método no permitido." });
        return;
    }

    const instagramId = process.env.INSTAGRAM_ID;
    const token = process.env.INSTAGRAM_TOKEN;
    const version = process.env.INSTAGRAM_API_VERSION || "v26.0";

    if (!instagramId || !token) {
        res.setHeader("Cache-Control", "no-store");
        responderJson(res, 503, {
            error: "La conexión con Instagram todavía no está configurada."
        });
        return;
    }

    try {
        const publicaciones = await consultarPublicaciones({
            instagramId,
            token,
            version
        });
        const reel = seleccionarUltimoGol(publicaciones);

        if (!reel) {
            res.setHeader("Cache-Control", "public, max-age=60, s-maxage=300");
            responderJson(res, 404, {
                error: "No se encontró un Reel reciente cuya descripción comience con ⚽."
            });
            return;
        }

        res.setHeader(
            "Cache-Control",
            "public, max-age=60, s-maxage=300, stale-while-revalidate=600"
        );
        responderJson(res, 200, {
            reel: serializarReel(reel),
            actualizado_en: new Date().toISOString()
        });
    } catch (error) {
        console.error("Error al consultar Instagram", {
            message: error.message,
            codigoInstagram: error.codigoInstagram,
            estadoHttp: error.estadoHttp
        });

        res.setHeader("Cache-Control", "no-store");
        responderJson(res, 502, {
            error: "No fue posible consultar Instagram en este momento."
        });
    }
}


module.exports = ultimoGol;
