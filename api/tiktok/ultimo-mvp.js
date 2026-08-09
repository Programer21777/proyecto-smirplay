"use strict";

module.exports = async function ultimoMvpTikTok(req, res) {

    // Permitimos que tu página de GitHub Pages consulte esta API
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
        res.writeHead(204);
        res.end();
        return;
    }

    if (req.method !== "GET") {
        res.writeHead(405, {
            "Content-Type": "application/json; charset=utf-8"
        });

        res.end(JSON.stringify({
            error: "Método no permitido"
        }));

        return;
    }

    try {

        const ACCESS_TOKEN = process.env.TIKTOK_ACCESS_TOKEN;

        if (!ACCESS_TOKEN) {

            res.writeHead(500, {
                "Content-Type": "application/json; charset=utf-8"
            });

            res.end(JSON.stringify({
                error: "Falta TIKTOK_ACCESS_TOKEN en las variables de entorno."
            }));

            return;
        }


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

        // Revisamos hasta 5 páginas = máximo 100 publicaciones
        while (pagina < 5) {

            pagina++;

            const body = {
                max_count: 20
            };

            if (cursor) {
                body.cursor = cursor;
            }


            const respuesta = await fetch(
                `https://open.tiktokapis.com/v2/video/list/?fields=${CAMPOS}`,
                {
                    method: "POST",

                    headers: {
                        "Authorization": `Bearer ${ACCESS_TOKEN}`,
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify(body)
                }
            );


            const datos = await respuesta.json();


            if (!respuesta.ok) {

                console.error(
                    "Error HTTP TikTok:",
                    respuesta.status,
                    datos
                );

                res.writeHead(respuesta.status, {
                    "Content-Type": "application/json; charset=utf-8"
                });

                res.end(JSON.stringify({
                    error: "TikTok rechazó la solicitud.",
                    detalle: datos
                }));

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

                res.writeHead(500, {
                    "Content-Type": "application/json; charset=utf-8"
                });

                res.end(JSON.stringify({
                    error: "TikTok devolvió un error.",
                    detalle: datos.error
                }));

                return;
            }


            const videos =
                datos.data?.videos || [];


            // TikTok ya los entrega del más reciente al más antiguo.
            const mvp = videos.find(function (video) {

                const descripcion =
                    (
                        video.video_description ||
                        video.title ||
                        ""
                    ).trim();

                return descripcion.startsWith("🏅");
            });


            if (mvp) {

                const descripcion =
                    (
                        mvp.video_description ||
                        mvp.title ||
                        ""
                    ).trim();


                res.writeHead(200, {
                    "Content-Type": "application/json; charset=utf-8",
                    "Cache-Control": "no-store"
                });


                res.end(JSON.stringify({

                    encontrado: true,

                    mvp: {
                        id: mvp.id,
                        descripcion: descripcion,
                        fecha: mvp.create_time,
                        portada: mvp.cover_image_url || null,
                        enlace: mvp.share_url || null,
                        embed: mvp.embed_link || null
                    }

                }));

                return;
            }


            const hayMas =
                datos.data?.has_more === true;

            cursor =
                datos.data?.cursor;


            if (!hayMas || !cursor) {
                break;
            }
        }


        // No encontramos publicación con 🏅
        res.writeHead(200, {
            "Content-Type": "application/json; charset=utf-8",
            "Cache-Control": "no-store"
        });


        res.end(JSON.stringify({
            encontrado: false,
            mensaje:
                "No se encontró una publicación reciente cuya descripción comience con 🏅."
        }));


    } catch (error) {

        console.error(
            "Error consultando último MVP:",
            error
        );


        res.writeHead(500, {
            "Content-Type": "application/json; charset=utf-8"
        });


        res.end(JSON.stringify({
            error:
                "Error interno al consultar el último MVP."
        }));
    }
};