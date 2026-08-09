"use strict";

const header = document.querySelector("#header");
const botonMenu = document.querySelector("#boton-menu");
const menu = document.querySelector("#menu");

const musica = document.querySelector("#musica");
const botonMusica = document.querySelector("#boton-musica");
const iconoMusica = document.querySelector("#icono-musica");

const mensaje = document.querySelector("#mensaje");
const anio = document.querySelector("#anio");

let temporizadorMensaje;


/* ===================== MENSAJES ===================== */

function mostrarMensaje(texto) {
    mensaje.textContent = texto;
    mensaje.classList.add("visible");

    clearTimeout(temporizadorMensaje);

    temporizadorMensaje = setTimeout(function () {
        mensaje.classList.remove("visible");
    }, 2500);
}


/* ===================== HEADER AL DESPLAZARSE ===================== */

function actualizarHeader() {
    if (window.scrollY > 25) {
        header.classList.add("scrolled");
    } else {
        header.classList.remove("scrolled");
    }
}

actualizarHeader();

window.addEventListener("scroll", actualizarHeader, {
    passive: true
});


/* ===================== MENÚ MÓVIL ===================== */

botonMenu.addEventListener("click", function () {
    const estaAbierto = menu.classList.toggle("abierto");

    botonMenu.classList.toggle("activo", estaAbierto);

    botonMenu.setAttribute(
        "aria-expanded",
        String(estaAbierto)
    );

    document.body.classList.toggle(
        "menu-abierto",
        estaAbierto
    );
});


document.querySelectorAll("#menu a").forEach(function (enlace) {
    enlace.addEventListener("click", function () {
        menu.classList.remove("abierto");
        botonMenu.classList.remove("activo");

        botonMenu.setAttribute(
            "aria-expanded",
            "false"
        );

        document.body.classList.remove("menu-abierto");
    });
});


document.addEventListener("keydown", function (evento) {
    if (evento.key === "Escape") {
        menu.classList.remove("abierto");
        botonMenu.classList.remove("activo");

        botonMenu.setAttribute(
            "aria-expanded",
            "false"
        );

        document.body.classList.remove("menu-abierto");
    }
});


/* ===================== MÚSICA ===================== */

musica.volume = 0.3;

botonMusica.addEventListener("click", async function () {

    if (musica.paused) {

        try {
            await musica.play();

            botonMusica.classList.add("reproduciendo");
            botonMusica.setAttribute("aria-pressed", "true");

            iconoMusica.textContent = "Ⅱ";

            mostrarMensaje("Música activada");

        } catch (error) {
            mostrarMensaje(
                "El navegador bloqueó el audio. Intenta nuevamente."
            );
        }

    } else {

        musica.pause();

        botonMusica.classList.remove("reproduciendo");
        botonMusica.setAttribute("aria-pressed", "false");

        iconoMusica.textContent = "♪";

        mostrarMensaje("Música en pausa");
    }

});


musica.addEventListener("error", function () {
    mostrarMensaje("No se pudo cargar la música.");
});


/* ===================== DEEP LINKS ===================== */

document.querySelectorAll(".enlace-app").forEach(function (enlace) {

    enlace.addEventListener("click", function (evento) {

        const esMovil =
            /Android|iPhone|iPad|iPod/i.test(
                navigator.userAgent
            );

        if (!esMovil) {
            return;
        }

        evento.preventDefault();

        const enlaceApp = enlace.dataset.app;
        const enlaceWeb = enlace.dataset.web;

        const inicio = Date.now();

        window.location.href = enlaceApp;

        setTimeout(function () {

            const aplicacionNoAbrio =
                document.visibilityState === "visible" &&
                Date.now() - inicio < 1800;

            if (aplicacionNoAbrio) {
                window.location.href = enlaceWeb;
            }

        }, 1100);

    });

});


/* ===================== REPRODUCTOR DE YOUTUBE ===================== */

const CANAL_ID = "UCMpjfcdM9MLT91pnq2sATUw"; // <-- IMPORTANTE: Pon aquí el ID del canal (empieza con UC)
const VIDEO_DE_RESPALDO = "tJwmj0h9suE"; // ID de la Jornada 8 (Plan B)

async function cargarUltimoVideo() {
    const contenedor = document.getElementById("youtube-reproductor");
    const pie = document.getElementById("yt-pie");

    if (!contenedor) return;

    try {
        // 1. URL pública de YouTube
        const urlRSS = `https://www.youtube.com/feeds/videos.xml?channel_id=${CANAL_ID}`;
        
        // 2. Usamos un puente súper rápido (corsproxy.io) que nos da el archivo crudo
        const proxy = `https://corsproxy.io/?${encodeURIComponent(urlRSS)}`;

        const respuesta = await fetch(proxy);
        if (!respuesta.ok) throw new Error("Error al conectar con YouTube");
        
        const textoXML = await respuesta.text();
        
        // 3. Traducimos el código en el navegador
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(textoXML, "text/xml");
        
        // 4. Buscamos el video más reciente
        const primerVideo = xmlDoc.querySelector("entry");
        
        if (primerVideo) {
            // Buscamos la etiqueta exacta de YouTube "yt:videoId"
            const videoId = primerVideo.getElementsByTagName("yt:videoId")[0].textContent;
            const titulo = primerVideo.querySelector("title").textContent;

            // Insertamos el video
            contenedor.innerHTML = `<iframe src="https://www.youtube.com/embed/${videoId}" allowfullscreen style="width:100%; height:100%; border:0;"></iframe>`;
            pie.textContent = titulo;
        } else {
            throw new Error("El canal no tiene videos publicados.");
        }

    } catch (error) {
        console.warn("Mostrando Plan B:", error);
        
        // PLAN B (Si falla tu internet o el canal no existe, se muestra esto)
        contenedor.innerHTML = `<iframe src="https://www.youtube.com/embed/${VIDEO_DE_RESPALDO}" allowfullscreen style="width:100%; height:100%; border:0;"></iframe>`;
        pie.textContent = "Último partido transmitido";
    }
}

// Ejecutar
cargarUltimoVideo();


/* ===================== ÚLTIMO GOL DE INSTAGRAM ===================== */

const contenedorReel = document.querySelector("#instagram-reel");
const enlaceInstagramReel = document.querySelector("#enlace-instagram-reel");
const metaApiInstagram = document.querySelector(
    'meta[name="smirplay-instagram-api"]'
);

let reelInstagramCargado = false;


function obtenerUrlApiInstagram() {
    const urlConfigurada = metaApiInstagram?.content.trim();

    if (urlConfigurada) {
        return urlConfigurada;
    }

    return new URL(
        "/api/instagram/ultimo-gol",
        window.location.origin
    ).toString();
}


function crearEstadoReel(titulo, descripcion, tipo) {
    const estado = document.createElement("div");
    const icono = document.createElement("span");
    const encabezado = document.createElement("h3");
    const texto = document.createElement("p");

    estado.className = `estado-reel estado-reel-${tipo}`;
    icono.className = tipo === "cargando"
        ? "cargador-reel"
        : "icono-estado-reel";
    icono.setAttribute("aria-hidden", "true");
    icono.textContent = tipo === "cargando" ? "" : "⚽";
    encabezado.textContent = titulo;
    texto.textContent = descripcion;

    estado.append(icono, encabezado, texto);

    return estado;
}


function mostrarEstadoReel(titulo, descripcion, tipo) {
    contenedorReel.replaceChildren(
        crearEstadoReel(titulo, descripcion, tipo)
    );
}


function mostrarReel(reel) {
    const video = document.createElement("video");
    const informacion = document.createElement("div");
    const descripcion = document.createElement("p");
    const fecha = document.createElement("time");

    video.className = "video-instagram";
    video.controls = true;
    video.playsInline = true;
    video.preload = "metadata";
    video.src = reel.media_url;

    if (reel.thumbnail_url) {
        video.poster = reel.thumbnail_url;
    }

    informacion.className = "informacion-reel";
    descripcion.className = "descripcion-reel";
    descripcion.textContent = reel.caption || "Gol publicado por Smirplay";

    if (reel.timestamp) {
        const fechaPublicacion = new Date(reel.timestamp);

        if (!Number.isNaN(fechaPublicacion.getTime())) {
            fecha.className = "fecha-reel";
            fecha.dateTime = reel.timestamp;
            fecha.textContent = new Intl.DateTimeFormat("es-MX", {
                dateStyle: "long"
            }).format(fechaPublicacion);
            informacion.append(descripcion, fecha);
        } else {
            informacion.append(descripcion);
        }
    } else {
        informacion.append(descripcion);
    }

    contenedorReel.replaceChildren(video, informacion);
    enlaceInstagramReel.href = reel.permalink;
    enlaceInstagramReel.textContent = "Ver Reel en Instagram";
    reelInstagramCargado = true;
}


async function leerMensajeError(respuesta) {
    try {
        const detalle = await respuesta.json();

        if (typeof detalle.error === "string") {
            return detalle.error;
        }
    } catch (error) {
        // La respuesta no contenía JSON; se usa el mensaje general.
    }

    return "Instagram no respondió correctamente.";
}


async function cargarUltimoGol() {
    if (!contenedorReel || !enlaceInstagramReel) {
        return;
    }

    if (!reelInstagramCargado) {
        mostrarEstadoReel(
            "BUSCANDO EL ÚLTIMO GOL",
            "Consultando los Reels recientes de Smirplay…",
            "cargando"
        );
    }

    contenedorReel.setAttribute("aria-busy", "true");

    try {
        const respuesta = await fetch(obtenerUrlApiInstagram(), {
            headers: {
                Accept: "application/json"
            }
        });

        if (!respuesta.ok) {
            throw new Error(await leerMensajeError(respuesta));
        }

        const resultado = await respuesta.json();

        if (!resultado.reel?.media_url || !resultado.reel?.permalink) {
            throw new Error("La API devolvió un Reel incompleto.");
        }

        mostrarReel(resultado.reel);
    } catch (error) {
        console.error("No se pudo cargar el Reel de Instagram:", error);

        if (!reelInstagramCargado) {
            mostrarEstadoReel(
                "EL GOL NO ESTÁ DISPONIBLE",
                "Publica un Reel cuya descripción comience con ⚽ o abre Instagram para verlo.",
                "error"
            );
        }
    } finally {
        contenedorReel.setAttribute("aria-busy", "false");
    }
}


cargarUltimoGol();

window.setInterval(cargarUltimoGol, 300000);


/* ===================== AÑO AUTOMÁTICO ===================== */

anio.textContent = new Date().getFullYear();

/* ===================== ÚLTIMO MVP DE TIKTOK ===================== */

const contenedorTikTok =
    document.getElementById("tiktok-mvp");

const enlaceTikTok =
    document.getElementById("enlace-tiktok-mvp");

const metaApiTikTok =
    document.querySelector(
        'meta[name="smirplay-tiktok-api"]'
    );


function obtenerUrlApiTikTok() {

    const urlConfigurada =
        metaApiTikTok?.content.trim();

    if (urlConfigurada) {
        return urlConfigurada;
    }

    return "https://proyecto-smirplay.vercel.app/api/tiktok/ultimo-mvp";
}


async function cargarUltimoMVP() {

    if (!contenedorTikTok) {
        return;
    }


    contenedorTikTok.setAttribute(
        "aria-busy",
        "true"
    );


    try {

        const respuesta =
            await fetch(
                obtenerUrlApiTikTok(),
                {
                    headers: {
                        Accept:
                            "application/json"
                    }
                }
            );


        if (!respuesta.ok) {

            throw new Error(
                "La API de TikTok no respondió correctamente."
            );
        }


        const resultado =
            await respuesta.json();


        if (
            !resultado.encontrado ||
            !resultado.mvp
        ) {

            throw new Error(
                resultado.mensaje ||
                "No hay MVP publicado."
            );
        }


        const mvp =
            resultado.mvp;


        if (!mvp.embed) {

            throw new Error(
                "La publicación no tiene enlace de reproducción."
            );
        }


        contenedorTikTok.innerHTML = `

    <a
        href="${mvp.enlace}"
        target="_blank"
        rel="noopener noreferrer"
        class="enlace-imagen-mvp"
    >
        <img
            class="imagen-tiktok-mvp"
            src="${mvp.portada}"
            alt="Jugador MVP de Smirplay"
        >
    </a>

    <div class="info-tiktok">
        <p>
            ${mvp.descripcion || "Jugador MVP del partido"}
        </p>
    </div>
`;


        if (
            enlaceTikTok &&
            mvp.enlace
        ) {

            enlaceTikTok.href =
                mvp.enlace;

            enlaceTikTok.textContent =
                "VER PUBLICACIÓN EN TIKTOK";

            enlaceTikTok.target =
                "_blank";

            enlaceTikTok.rel =
                "noopener noreferrer";
        }


    } catch (error) {

        console.error(
            "No se pudo cargar el MVP:",
            error
        );


        contenedorTikTok.innerHTML = `

            <div class="estado-reel">

                <h3>
                    NO HAY MVP PUBLICADO
                </h3>

                <p>
                    Todavía no se encontró una publicación
                    cuya descripción comience con 🏅.
                </p>

            </div>
        `;

    } finally {

        contenedorTikTok.setAttribute(
            "aria-busy",
            "false"
        );
    }
}


cargarUltimoMVP();


setInterval(
    cargarUltimoMVP,
    300000
);