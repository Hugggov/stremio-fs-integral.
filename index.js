const { addonBuilder, serveHTTP } = require("stremio-addon-sdk");
const axios = require("axios");
const cheerio = require("cheerio");

const manifest = {
    id: "org.frenchstream.integral.final",
    version: "1.0.0",
    name: "FS Intégral (30 pages)",
    resources: ["catalog"],
    types: ["movie", "series"],
    catalogs: [
        { type: "movie", id: "fs_movies", name: "FS Films", extra: [{ name: "skip" }] },
        { type: "series", id: "fs_series", name: "FS Séries", extra: [{ name: "skip" }] }
    ]
};

const builder = new addonBuilder(manifest);

builder.defineCatalogHandler(async ({ type, extra }) => {
    const skip = extra.skip || 0;
    const page = Math.floor(skip / 20) + 1;

    // Limite à 30 pages
    if (page > 30) return { metas: [] };

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
        return { metas: [] };
    }
});

// Cette commande remplace tout le bloc Express et gère tout toute seule
serveHTTP(builder.getInterface(), { port: process.env.PORT || 7000 });
