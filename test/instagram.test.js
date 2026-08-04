"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const {
    comienzaConBalon,
    crearUrlMedios,
    seleccionarUltimoGol
} = require("../lib/instagram");
const ultimoGol = require("../api/instagram/ultimo-gol");


function crearRespuestaFalsa() {
    return {
        body: "",
        headers: {},
        statusCode: 200,
        end(contenido = "") {
            this.body = contenido;
        },
        setHeader(nombre, valor) {
            this.headers[nombre] = valor;
        }
    };
}


test("reconoce el balón con y sin selector de emoji", function () {
    assert.equal(comienzaConBalon("⚽ Gol del partido"), true);
    assert.equal(comienzaConBalon("  ⚽️ Golazo"), true);
    assert.equal(comienzaConBalon("Resumen ⚽"), false);
});


test("selecciona el Reel de gol más reciente", function () {
    const publicaciones = [
        {
            id: "foto",
            caption: "⚽ Foto",
            media_type: "IMAGE",
            timestamp: "2026-08-04T20:00:00Z"
        },
        {
            id: "viejo",
            caption: "⚽ Gol anterior",
            media_type: "VIDEO",
            timestamp: "2026-08-01T20:00:00Z"
        },
        {
            id: "nuevo",
            caption: "⚽️ Gol más reciente",
            media_type: "VIDEO",
            media_product_type: "REELS",
            timestamp: "2026-08-03T20:00:00Z"
        },
        {
            id: "otro",
            caption: "Entrenamiento",
            media_type: "VIDEO",
            timestamp: "2026-08-04T20:00:00Z"
        }
    ];

    assert.equal(seleccionarUltimoGol(publicaciones).id, "nuevo");
});


test("crea la consulta de Meta sin perder los campos necesarios", function () {
    const url = crearUrlMedios({
        instagramId: "12345",
        token: "token-secreto",
        version: "v26.0"
    });

    assert.equal(url.origin, "https://graph.instagram.com");
    assert.equal(url.pathname, "/v26.0/12345/media");
    assert.equal(url.searchParams.get("access_token"), "token-secreto");
    assert.match(url.searchParams.get("fields"), /media_url/);
    assert.match(url.searchParams.get("fields"), /permalink/);
});


test("el endpoint no expone secretos cuando faltan credenciales", async function () {
    const idAnterior = process.env.INSTAGRAM_ID;
    const tokenAnterior = process.env.INSTAGRAM_TOKEN;
    const respuesta = crearRespuestaFalsa();

    delete process.env.INSTAGRAM_ID;
    delete process.env.INSTAGRAM_TOKEN;

    try {
        await ultimoGol({ method: "GET" }, respuesta);
    } finally {
        if (idAnterior === undefined) {
            delete process.env.INSTAGRAM_ID;
        } else {
            process.env.INSTAGRAM_ID = idAnterior;
        }

        if (tokenAnterior === undefined) {
            delete process.env.INSTAGRAM_TOKEN;
        } else {
            process.env.INSTAGRAM_TOKEN = tokenAnterior;
        }
    }

    assert.equal(respuesta.statusCode, 503);
    assert.equal(JSON.parse(respuesta.body).error.includes("configurada"), true);
    assert.equal(respuesta.body.includes("INSTAGRAM_TOKEN"), false);
});


test("el endpoint devuelve únicamente el Reel seleccionado", async function () {
    const idAnterior = process.env.INSTAGRAM_ID;
    const tokenAnterior = process.env.INSTAGRAM_TOKEN;
    const fetchAnterior = globalThis.fetch;
    const respuesta = crearRespuestaFalsa();

    process.env.INSTAGRAM_ID = "12345";
    process.env.INSTAGRAM_TOKEN = "token-secreto";
    globalThis.fetch = async function () {
        return {
            ok: true,
            status: 200,
            async json() {
                return {
                    data: [
                        {
                            id: "gol-1",
                            caption: "⚽ Gol del partido",
                            media_type: "VIDEO",
                            media_product_type: "REELS",
                            media_url: "https://cdn.example/gol.mp4",
                            thumbnail_url: "https://cdn.example/gol.jpg",
                            permalink: "https://instagram.com/reel/gol-1/",
                            timestamp: "2026-08-04T20:00:00Z",
                            access_token: "nunca-debe-salir"
                        }
                    ]
                };
            }
        };
    };

    try {
        await ultimoGol({ method: "GET" }, respuesta);
    } finally {
        globalThis.fetch = fetchAnterior;

        if (idAnterior === undefined) {
            delete process.env.INSTAGRAM_ID;
        } else {
            process.env.INSTAGRAM_ID = idAnterior;
        }

        if (tokenAnterior === undefined) {
            delete process.env.INSTAGRAM_TOKEN;
        } else {
            process.env.INSTAGRAM_TOKEN = tokenAnterior;
        }
    }

    const contenido = JSON.parse(respuesta.body);

    assert.equal(respuesta.statusCode, 200);
    assert.equal(contenido.reel.id, "gol-1");
    assert.equal(respuesta.body.includes("nunca-debe-salir"), false);
    assert.equal(respuesta.body.includes("token-secreto"), false);
});
