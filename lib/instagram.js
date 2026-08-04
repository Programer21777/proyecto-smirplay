"use strict";

const CAMPOS_REEL = [
    "id",
    "caption",
    "media_type",
    "media_product_type",
    "media_url",
    "thumbnail_url",
    "permalink",
    "timestamp"
];


function comienzaConBalon(descripcion) {
    return /^⚽️?/u.test(String(descripcion || "").trimStart());
}


function esVideo(publicacion) {
    return publicacion?.media_type === "VIDEO" ||
        publicacion?.media_product_type === "REELS";
}


function seleccionarUltimoGol(publicaciones) {
    if (!Array.isArray(publicaciones)) {
        return null;
    }

    return publicaciones
        .filter(function (publicacion) {
            return comienzaConBalon(publicacion.caption) && esVideo(publicacion);
        })
        .sort(function (a, b) {
            return Date.parse(b.timestamp || 0) - Date.parse(a.timestamp || 0);
        })[0] || null;
}


function crearUrlMedios({ instagramId, token, version = "v26.0" }) {
    const url = new URL(
        `https://graph.instagram.com/${version}/${encodeURIComponent(instagramId)}/media`
    );

    url.searchParams.set("fields", CAMPOS_REEL.join(","));
    url.searchParams.set("limit", "100");
    url.searchParams.set("access_token", token);

    return url;
}


async function consultarPublicaciones({
    instagramId,
    token,
    version,
    fetchImpl = globalThis.fetch
}) {
    if (typeof fetchImpl !== "function") {
        throw new Error("Este servidor no incluye la función fetch.");
    }

    const controlador = new AbortController();
    const temporizador = setTimeout(function () {
        controlador.abort();
    }, 10000);

    try {
        const respuesta = await fetchImpl(
            crearUrlMedios({ instagramId, token, version }),
            {
                headers: {
                    Accept: "application/json"
                },
                signal: controlador.signal
            }
        );

        const resultado = await respuesta.json().catch(function () {
            return {};
        });

        if (!respuesta.ok) {
            const error = new Error("Instagram rechazó la consulta.");
            error.codigoInstagram = resultado.error?.code;
            error.estadoHttp = respuesta.status;
            throw error;
        }

        return Array.isArray(resultado.data) ? resultado.data : [];
    } finally {
        clearTimeout(temporizador);
    }
}


function serializarReel(publicacion) {
    return {
        id: publicacion.id,
        caption: publicacion.caption || "",
        media_type: publicacion.media_type,
        media_product_type: publicacion.media_product_type,
        media_url: publicacion.media_url,
        thumbnail_url: publicacion.thumbnail_url || "",
        permalink: publicacion.permalink,
        timestamp: publicacion.timestamp
    };
}


module.exports = {
    CAMPOS_REEL,
    comienzaConBalon,
    consultarPublicaciones,
    crearUrlMedios,
    esVideo,
    seleccionarUltimoGol,
    serializarReel
};
