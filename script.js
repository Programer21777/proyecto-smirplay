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

    if (!mensaje) {
        return;
    }

    mensaje.textContent = texto;
    mensaje.classList.add("visible");

    clearTimeout(temporizadorMensaje);

    temporizadorMensaje = setTimeout(
        function () {
            mensaje.classList.remove("visible");
        },
        2500
    );
}


/* ===================== HEADER ===================== */

function actualizarHeader() {

    if (!header) {
        return;
    }

    if (window.scrollY > 25) {
        header.classList.add("scrolled");
    } else {
        header.classList.remove("scrolled");
    }
}

actualizarHeader();

window.addEventListener(
    "scroll",
    actualizarHeader,
    {
        passive: true
    }
);


/* ===================== MENÚ MÓVIL ===================== */

if (botonMenu && menu) {

    botonMenu.addEventListener(
        "click",
        function () {

            const estaAbierto =
                menu.classList.toggle("abierto");

            botonMenu.classList.toggle(
                "activo",
                estaAbierto
            );

            botonMenu.setAttribute(
                "aria-expanded",
                String(estaAbierto)
            );

            document.body.classList.toggle(
                "menu-abierto",
                estaAbierto
            );
        }
    );


    document
        .querySelectorAll("#menu a")
        .forEach(
            function (enlace) {

                enlace.addEventListener(
                    "click",
                    function () {

                        menu.classList.remove(
                            "abierto"
                        );

                        botonMenu.classList.remove(
                            "activo"
                        );

                        botonMenu.setAttribute(
                            "aria-expanded",
                            "false"
                        );

                        document.body.classList.remove(
                            "menu-abierto"
                        );
                    }
                );
            }
        );


    document.addEventListener(
        "keydown",
        function (evento) {

            if (evento.key === "Escape") {

                menu.classList.remove(
                    "abierto"
                );

                botonMenu.classList.remove(
                    "activo"
                );

                botonMenu.setAttribute(
                    "aria-expanded",
                    "false"
                );

                document.body.classList.remove(
                    "menu-abierto"
                );
            }
        }
    );
}


/* ===================== MÚSICA ===================== */

if (
    musica &&
    botonMusica &&
    iconoMusica
) {

    musica.volume = 0.3;


    botonMusica.addEventListener(
        "click",
        async function () {

            if (musica.paused) {

                try {

                    await musica.play();

                    botonMusica.classList.add(
                        "reproduciendo"
                    );

                    botonMusica.setAttribute(
                        "aria-pressed",
                        "true"
                    );

                    iconoMusica.textContent = "Ⅱ";

                    mostrarMensaje(
                        "Música activada"
                    );

                } catch (error) {

                    mostrarMensaje(
                        "El navegador bloqueó el audio. Intenta nuevamente."
                    );
                }

            } else {

                musica.pause();

                botonMusica.classList.remove(
                    "reproduciendo"
                );

                botonMusica.setAttribute(
                    "aria-pressed",
                    "false"
                );

                iconoMusica.textContent = "♪";

                mostrarMensaje(
                    "Música en pausa"
                );
            }
        }
    );


    musica.addEventListener(
        "error",
        function () {

            mostrarMensaje(
                "No se pudo cargar la música."
            );
        }
    );
}


/* ===================== DEEP LINKS ===================== */

document
    .querySelectorAll(".enlace-app")
    .forEach(
        function (enlace) {

            enlace.addEventListener(
                "click",
                function (evento) {

                    const esMovil =
                        /Android|iPhone|iPad|iPod/i.test(
                            navigator.userAgent
                        );

                    if (!esMovil) {
                        return;
                    }

                    evento.preventDefault();

                    const enlaceApp =
                        enlace.dataset.app;

                    const enlaceWeb =
                        enlace.dataset.web;

                    const inicio =
                        Date.now();

                    window.location.href =
                        enlaceApp;

                    setTimeout(
                        function () {

                            const aplicacionNoAbrio =
                                document.visibilityState ===
                                    "visible" &&
                                Date.now() -
                                    inicio <
                                    1800;

                            if (
                                aplicacionNoAbrio
                            ) {

                                window.location.href =
                                    enlaceWeb;
                            }

                        },
                        1100
                    );
                }
            );
        }
    );


/* ===================== YOUTUBE ===================== */

const CANAL_ID =
    "UCMpjfcdM9MLT91pnq2sATUw";

const VIDEO_DE_RESPALDO =
    "tJwmj0h9suE";


async function cargarUltimoVideo() {

    const contenedor =
        document.getElementById(
            "youtube-reproductor"
        );

    const pie =
        document.getElementById(
            "yt-pie"
        );

    if (!contenedor) {
        return;
    }


    try {

        const urlRSS =
            `https://www.youtube.com/feeds/videos.xml?channel_id=${CANAL_ID}`;

        const proxy =
            `https://corsproxy.io/?${encodeURIComponent(
                urlRSS
            )}`;


        const respuesta =
            await fetch(proxy);


        if (!respuesta.ok) {

            throw new Error(
                "Error al conectar con YouTube"
            );
        }


        const textoXML =
            await respuesta.text();


        const parser =
            new DOMParser();

        const xmlDoc =
            parser.parseFromString(
                textoXML,
                "text/xml"
            );


        const primerVideo =
            xmlDoc.querySelector("entry");


        if (!primerVideo) {

            throw new Error(
                "El canal no tiene videos publicados."
            );
        }


        const nodoVideoId =
            primerVideo.getElementsByTagName(
                "yt:videoId"
            )[0];


        if (!nodoVideoId) {

            throw new Error(
                "YouTube no devolvió el ID del video."
            );
        }


        const videoId =
            nodoVideoId.textContent;


        const titulo =
            primerVideo
                .querySelector("title")
                ?.textContent ||
            "Última transmisión";


        contenedor.innerHTML = `

            <iframe
                src="https://www.youtube.com/embed/${videoId}"
                allowfullscreen
                style="
                    width:100%;
                    height:100%;
                    border:0;
                "
            ></iframe>
        `;


        if (pie) {
            pie.textContent =
                titulo;
        }


    } catch (error) {

        console.warn(
            "Mostrando Plan B:",
            error
        );


        contenedor.innerHTML = `

            <iframe
                src="https://www.youtube.com/embed/${VIDEO_DE_RESPALDO}"
                allowfullscreen
                style="
                    width:100%;
                    height:100%;
                    border:0;
                "
            ></iframe>
        `;


        if (pie) {

            pie.textContent =
                "Último partido transmitido";
        }
    }
}


cargarUltimoVideo();


/* ===================== INSTAGRAM ===================== */

const contenedorReel =
    document.querySelector(
        "#instagram-reel"
    );

const enlaceInstagramReel =
    document.querySelector(
        "#enlace-instagram-reel"
    );

const metaApiInstagram =
    document.querySelector(
        'meta[name="smirplay-instagram-api"]'
    );

let reelInstagramCargado =
    false;


function obtenerUrlApiInstagram() {

    const urlConfigurada =
        metaApiInstagram?.content.trim();


    if (urlConfigurada) {

        return urlConfigurada;
    }


    return new URL(
        "/api/instagram/ultimo-gol",
        window.location.origin
    ).toString();
}


function crearEstadoReel(
    titulo,
    descripcion,
    tipo
) {

    const estado =
        document.createElement("div");

    const icono =
        document.createElement("span");

    const encabezado =
        document.createElement("h3");

    const texto =
        document.createElement("p");


    estado.className =
        `estado-reel estado-reel-${tipo}`;


    icono.className =
        tipo === "cargando"
            ? "cargador-reel"
            : "icono-estado-reel";


    icono.setAttribute(
        "aria-hidden",
        "true"
    );


    icono.textContent =
        tipo === "cargando"
            ? ""
            : "⚽";


    encabezado.textContent =
        titulo;

    texto.textContent =
        descripcion;


    estado.append(
        icono,
        encabezado,
        texto
    );


    return estado;
}


function mostrarEstadoReel(
    titulo,
    descripcion,
    tipo
) {

    if (!contenedorReel) {
        return;
    }


    contenedorReel.replaceChildren(
        crearEstadoReel(
            titulo,
            descripcion,
            tipo
        )
    );
}


function mostrarReel(reel) {

    if (
        !contenedorReel ||
        !enlaceInstagramReel
    ) {
        return;
    }


    const video =
        document.createElement("video");

    const informacion =
        document.createElement("div");

    const descripcion =
        document.createElement("p");

    const fecha =
        document.createElement("time");


    video.className =
        "video-instagram";

    video.controls =
        true;

    video.playsInline =
        true;

    video.preload =
        "metadata";

    video.src =
        reel.media_url;


    if (reel.thumbnail_url) {

        video.poster =
            reel.thumbnail_url;
    }


    informacion.className =
        "informacion-reel";

    descripcion.className =
        "descripcion-reel";

    descripcion.textContent =
        reel.caption ||
        "Gol publicado por Smirplay";


    if (reel.timestamp) {

        const fechaPublicacion =
            new Date(
                reel.timestamp
            );


        if (
            !Number.isNaN(
                fechaPublicacion.getTime()
            )
        ) {

            fecha.className =
                "fecha-reel";

            fecha.dateTime =
                reel.timestamp;

            fecha.textContent =
                new Intl.DateTimeFormat(
                    "es-MX",
                    {
                        dateStyle:
                            "long"
                    }
                ).format(
                    fechaPublicacion
                );


            informacion.append(
                descripcion,
                fecha
            );

        } else {

            informacion.append(
                descripcion
            );
        }

    } else {

        informacion.append(
            descripcion
        );
    }


    contenedorReel.replaceChildren(
        video,
        informacion
    );


    enlaceInstagramReel.href =
        reel.permalink;


    enlaceInstagramReel.textContent =
        "Ver Reel en Instagram";


    reelInstagramCargado =
        true;
}


async function leerMensajeError(
    respuesta
) {

    try {

        const detalle =
            await respuesta.json();


        if (
            typeof detalle.error ===
            "string"
        ) {

            return detalle.error;
        }

    } catch (error) {

        // Respuesta no JSON.
    }


    return (
        "Instagram no respondió correctamente."
    );
}


async function cargarUltimoGol() {

    if (
        !contenedorReel ||
        !enlaceInstagramReel
    ) {
        return;
    }


    if (!reelInstagramCargado) {

        mostrarEstadoReel(
            "BUSCANDO EL ÚLTIMO GOL",
            "Consultando los Reels recientes de Smirplay…",
            "cargando"
        );
    }


    contenedorReel.setAttribute(
        "aria-busy",
        "true"
    );


    try {

        const respuesta =
            await fetch(
                obtenerUrlApiInstagram(),
                {
                    headers: {
                        Accept:
                            "application/json"
                    }
                }
            );


        if (!respuesta.ok) {

            throw new Error(
                await leerMensajeError(
                    respuesta
                )
            );
        }


        const resultado =
            await respuesta.json();


        if (
            !resultado.reel?.media_url ||
            !resultado.reel?.permalink
        ) {

            throw new Error(
                "La API devolvió un Reel incompleto."
            );
        }


        mostrarReel(
            resultado.reel
        );


    } catch (error) {

        console.error(
            "No se pudo cargar el Reel de Instagram:",
            error
        );


        if (!reelInstagramCargado) {

            mostrarEstadoReel(
                "EL GOL NO ESTÁ DISPONIBLE",
                "Publica un Reel cuya descripción comience con ⚽ o abre Instagram para verlo.",
                "error"
            );
        }

    } finally {

        contenedorReel.setAttribute(
            "aria-busy",
            "false"
        );
    }
}


cargarUltimoGol();

window.setInterval(
    cargarUltimoGol,
    300000
);


/* ===================== AÑO ===================== */

if (anio) {

    anio.textContent =
        new Date().getFullYear();
}


/* ===================== TIKTOK MVP ===================== */

const contenedorTikTok =
    document.getElementById(
        "tiktok-mvp"
    );

const enlaceTikTok =
    document.getElementById(
        "enlace-tiktok-mvp"
    );

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


    return (
        "https://proyecto-smirplay.vercel.app/api/tiktok/ultimo-mvp"
    );
}


function mostrarEstadoMvp(
    titulo,
    descripcion
) {

    if (!contenedorTikTok) {
        return;
    }


    contenedorTikTok.innerHTML = `

        <div class="estado-reel">

            <h3>
                ${titulo}
            </h3>

            <p>
                ${descripcion}
            </p>

        </div>
    `;
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
                    },

                    cache:
                        "no-store"
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


        /*
         * Para mostrar el MVP
         * necesitamos al menos:
         *
         * - portada
         * - enlace
         */

        if (
            !mvp.portada ||
            !mvp.enlace
        ) {

            throw new Error(
                "La publicación MVP no contiene portada o enlace."
            );
        }


        /*
         * Mostramos la portada GRANDE.
         * Al tocarla abre TikTok.
         */

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
                    loading="eager"
                >

            </a>


            <div class="info-tiktok">

                <p>
                    ${
                        mvp.descripcion ||
                        "Jugador MVP del partido"
                    }
                </p>

            </div>
        `;


        if (enlaceTikTok) {

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


        mostrarEstadoMvp(
            "NO HAY MVP PUBLICADO",
            "Todavía no se encontró una publicación cuya descripción comience con 🏅."
        );


        /*
         * Si falla la API,
         * el botón vuelve al perfil.
         */

        if (enlaceTikTok) {

            enlaceTikTok.href =
                "https://www.tiktok.com/@smirplay2";

            enlaceTikTok.textContent =
                "ABRIR TIKTOK";
        }


    } finally {

        contenedorTikTok.setAttribute(
            "aria-busy",
            "false"
        );
    }
}


cargarUltimoMVP();


window.setInterval(
    cargarUltimoMVP,
    300000
);
/* ===================== MARCADORES AUTOMÁTICOS ===================== */

const metaApiMarcadores =
    document.querySelector(
        'meta[name="smirplay-marcadores-api"]'
    );

const grupoMarcadores1 =
    document.getElementById(
        "score-group-1"
    );

const grupoMarcadores2 =
    document.getElementById(
        "score-group-2"
    );


function obtenerUrlApiMarcadores() {

    const url =
        metaApiMarcadores?.content.trim();

    return url || "";
}


/* ===================== LOGO ===================== */

function crearLogoMarcador(url, nombre) {

    const imagen =
        document.createElement("img");

    imagen.className =
        "team-logo";

    imagen.alt =
        `Escudo ${nombre}`;

    imagen.loading =
        "eager";

    imagen.src =
        url || "smirplay kick.png";


    imagen.addEventListener(
        "error",
        function () {

            imagen.src =
                "smirplay kick.png";
        },
        {
            once: true
        }
    );


    return imagen;
}


/* ===================== EQUIPO ===================== */

function crearEquipoMarcador(
    nombre,
    logo,
    clase
) {

    const equipo =
        document.createElement("div");

    equipo.className =
        `equipo-marcador ${clase}`;


    const imagen =
        crearLogoMarcador(
            logo,
            nombre
        );


    const texto =
        document.createElement("span");

    texto.className =
        "team-name";

    texto.textContent =
        nombre;


    equipo.append(
        imagen,
        texto
    );


    return equipo;
}


/* ===================== TARJETA ===================== */

function crearTarjetaMarcador(partido) {

    const tarjeta =
        document.createElement("article");

    tarjeta.className =
        "score-item score-partido";


    const equipo1 =
        crearEquipoMarcador(
            partido.equipo1 || "Equipo 1",
            partido.logo1,
            "equipo-local"
        );


    const centro =
        document.createElement("div");

    centro.className =
        "centro-marcador";


    const resultado =
        document.createElement("strong");

    resultado.className =
        "score";


    resultado.textContent =
        partido.centro ||
        (
            partido.goles1 !== "" &&
            partido.goles2 !== ""
                ? `${partido.goles1} - ${partido.goles2}`
                : "VS"
        );


    const detalle =
        document.createElement("span");

    detalle.className =
        "match-meta";

    detalle.textContent =
        partido.detalle ||
        partido.dia ||
        "";


    centro.append(
        resultado,
        detalle
    );


    const equipo2 =
        crearEquipoMarcador(
            partido.equipo2 || "Equipo 2",
            partido.logo2,
            "equipo-visitante"
        );


    tarjeta.append(
        equipo1,
        centro,
        equipo2
    );


    return tarjeta;
}


/* ===================== MOSTRAR PARTIDOS ===================== */

function mostrarMarcadores(partidos) {

    if (
        !grupoMarcadores1 ||
        !grupoMarcadores2
    ) {
        return;
    }


    grupoMarcadores1.replaceChildren();
    grupoMarcadores2.replaceChildren();


    partidos.forEach(
        function (partido) {

            grupoMarcadores1.appendChild(
                crearTarjetaMarcador(partido)
            );

            grupoMarcadores2.appendChild(
                crearTarjetaMarcador(partido)
            );
        }
    );
}


/* ===================== ESTADO VACÍO ===================== */

function mostrarMarcadoresVacios(mensaje) {

    if (
        !grupoMarcadores1 ||
        !grupoMarcadores2
    ) {
        return;
    }


    grupoMarcadores1.replaceChildren();
    grupoMarcadores2.replaceChildren();


    const tarjeta =
        document.createElement("article");

    tarjeta.className =
        "score-item score-cargando";


    const texto =
        document.createElement("div");

    texto.className =
        "score-loading-text";


    const titulo =
        document.createElement("strong");

    titulo.textContent =
        mensaje;


    texto.appendChild(titulo);

    tarjeta.appendChild(texto);

    grupoMarcadores1.appendChild(
        tarjeta
    );
}


/* ===================== CONSULTAR GOOGLE SHEETS ===================== */

async function cargarMarcadores() {

    if (
        !grupoMarcadores1 ||
        !grupoMarcadores2
    ) {
        return;
    }


    const url =
        obtenerUrlApiMarcadores();


    if (!url) {

        mostrarMarcadoresVacios(
            "API DE MARCADORES NO CONFIGURADA"
        );

        return;
    }


    try {

        const respuesta =
            await fetch(
                url,
                {
                    method: "GET",
                    cache: "no-store"
                }
            );


        if (!respuesta.ok) {

            throw new Error(
                "No se pudo consultar Google Sheets."
            );
        }


        const datos =
            await respuesta.json();


        if (!datos.ok) {

            throw new Error(
                datos.error ||
                "La API devolvió un error."
            );
        }


        const partidos =
            Array.isArray(datos.partidos)
                ? datos.partidos
                : [];


        if (partidos.length === 0) {

            mostrarMarcadoresVacios(
                "NO HAY PARTIDOS PROGRAMADOS"
            );

            return;
        }


        mostrarMarcadores(partidos);


    } catch (error) {

        console.error(
            "Error cargando marcadores:",
            error
        );


        mostrarMarcadoresVacios(
            "NO SE PUDIERON CARGAR LOS PARTIDOS"
        );
    }
}


/* ===================== INICIAR ===================== */

cargarMarcadores();


window.setInterval(
    cargarMarcadores,
    60000
);