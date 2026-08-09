"use strict";

const crypto = require("node:crypto");

module.exports = async function loginTikTok(req, res) {

    const CLIENT_KEY = process.env.TIKTOK_CLIENT_KEY;
    const REDIRECT_URI = process.env.TIKTOK_REDIRECT_URI;

    if (!CLIENT_KEY || !REDIRECT_URI) {

        res.writeHead(500, {
            "Content-Type": "application/json; charset=utf-8"
        });

        res.end(JSON.stringify({
            error: "Faltan variables de entorno de TikTok."
        }));

        return;
    }

    const state = crypto.randomBytes(24).toString("hex");

    res.setHeader(
        "Set-Cookie",
        `tiktok_oauth_state=${state}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=600`
    );

    const parametros = new URLSearchParams({
        client_key: CLIENT_KEY,
        response_type: "code",
        scope: "user.info.basic,video.list",
        redirect_uri: REDIRECT_URI,
        state: state
    });

    const urlTikTok =
        `https://www.tiktok.com/v2/auth/authorize/?${parametros.toString()}`;

    res.writeHead(302, {
        Location: urlTikTok
    });

    res.end();
};