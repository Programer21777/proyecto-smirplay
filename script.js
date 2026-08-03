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


/* ===================== AÑO AUTOMÁTICO ===================== */

anio.textContent = new Date().getFullYear();