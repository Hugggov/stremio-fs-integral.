const { addonBuilder } = require("stremio-addon-sdk");
const axios = require("axios");
const cheerio = require("cheerio");

const manifest = {
    id: "org.frenchstream.integral.v1",
    version: "1.0.0",
    name: "FrenchStream Intégral",
    resources: ["catalog"],
    types: ["movie", "series"],
    catalogs: [
        { type: "movie", id: "fs_movies", name: "FS Films", extra: [{ name: "skip" }] },
        { type: "series", id: "fs_series", name: "FS Séries", extra: [{ name: "skip" }] }
    ]
};

const builder = new addonBuilder(manifest);

builder.defineCatalogHandler(async ({ type, extra }) => {
    const page = Math.floor((extra.skip || 0) / 20) + 1;
    const url = `https://fs14.lol{type === "movie" ? "films" : "series"}/page/${page}/`;
    
    try {
        const { data } = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        const $ = cheerio.load(data);
        const metas = [];

        $(".short-story").each((i, el) => {
            const relUrl = $(el).find("a").attr("href");
            if (relUrl) {
                metas.push({
                    id: "fs_" + relUrl.split('/').filter(Boolean).pop(),
                    type: type,
                    name: $(el).find(".short-title").text().trim(),
                    poster: "https://fs14.lol" + $(el).find("img").attr("src")
                });
            }
        });
        return { metas };
    } catch (e) {
        console.error(e);
        return { metas: [] };
    }
});

builder.serve({ port: process.env.PORT || 7000 });
