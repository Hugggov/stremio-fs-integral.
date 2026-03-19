const { addonBuilder } = require("stremio-addon-sdk");
const axios = require("axios");
const cheerio = require("cheerio");

const genres = ["Action", "Animation", "Aventure", "Comédie", "Crime", "Drame", "Documentaire", "Epouvante-horreur", "Famille", "Fantastique", "Guerre", "Histoire", "Musique", "Policier", "Romance", "Science-fiction", "Thriller", "Western"];

const manifest = {
    id: "org.frenchstream.integral.perso",
    version: "1.0.0",
    name: "FrenchStream Intégral",
    resources: ["catalog"],
    types: ["movie", "series"],
    catalogs: [
        { type: "movie", id: "fs_movies", name: "FS Films", extra: [{ name: "genre", options: genres }, { name: "skip" }] },
        { type: "series", id: "fs_series", name: "FS Séries", extra: [{ name: "skip" }] }
    ]
};

const builder = new addonBuilder(manifest);

builder.defineCatalogHandler(async ({ type, extra }) => {
    const skip = extra.skip || 0;
    const page = Math.floor(skip / 20) + 1; 
    let url = type === "movie" ? `https://fs14.lol{page}/` : `https://fs14.lol{page}/`;
    
    if (extra.genre) {
        const slug = extra.genre.toLowerCase().replace(" ", "-");
        url = `https://fs14.lol{slug}/page/${page}/`;
    }

    try {
        const { data } = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        const $ = cheerio.load(data);
        const metas = $(".short-story").map((i, el) => ({
            id: "fs_" + $(el).find("a").attr("href").split('/').filter(Boolean).pop(),
            type: type,
            name: $(el).find(".short-title").text().trim(),
            poster: "https://fs14.lol" + $(el).find("img").attr("src")
        })).get();
        return { metas };
    } catch (e) { return { metas: [] }; }
});

builder.serve({ port: process.env.PORT || 7000 });
