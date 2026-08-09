"use strict";

const { Redis } = require("@upstash/redis");

function obtenerRedis() {

    const url =
        process.env.KV_REST_API_URL ||
        process.env.UPSTASH_REDIS_REST_URL;

    const token =
        process.env.KV_REST_API_TOKEN ||
        process.env.UPSTASH_REDIS_REST_TOKEN;

    if (!url || !token) {
        throw new Error(
            "Faltan las credenciales de Upstash Redis."
        );
    }

    return new Redis({
        url: url,
        token: token
    });
}

module.exports = {
    obtenerRedis
};