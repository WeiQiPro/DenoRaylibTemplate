import {Window, Drawing, Timing, AudioDevice as Audio, WHITE } from "raylib";

const RL = {Window, Drawing, Timing, Audio, WHITE };

type METADATA = {
    SCREEN_WIDTH: number;
    SCREEN_HEIGHT: number;
    SCREEN_TITLE: string;
    ENTRY_POINT: string;
};

type GAMEDATA = {
    tick: ()=> void;
    draw: ()=> void;
};

const META_PATH: string = "./src/metadata.ts";
const FLAGS: Record<string, boolean> = {
    initialize: false,
    resize: false,
    title: false,
    game: false,
    meta: false,
};

let metadata: METADATA;
let gamedata: GAMEDATA;

// Load initial metadata and game data
metadata = await loadMetaDataFromFile(META_PATH);

const metaWatcher: Deno.FsWatcher = Deno.watchFs(META_PATH);
const metaIterator = metaWatcher[Symbol.asyncIterator]();

gamedata = await loadFromFile(metadata.ENTRY_POINT);
let gameWatcher: Deno.FsWatcher = Deno.watchFs(metadata.ENTRY_POINT);
let gameIterator = gameWatcher[Symbol.asyncIterator]();

async function loadMetaDataFromFile(path: string) {
    const version = path + `?version=${Date.now()}`;
    const data = await import(version) as METADATA;

    if (metadata) {
        if (data.SCREEN_TITLE !== metadata.SCREEN_TITLE) {
            FLAGS.title = true;
        }

        if (
            data.SCREEN_WIDTH !== metadata.SCREEN_WIDTH ||
            data.SCREEN_HEIGHT !== metadata.SCREEN_HEIGHT
        ) {
            FLAGS.resize = true;
        }

        if (data.ENTRY_POINT !== metadata.ENTRY_POINT) {
            FLAGS.game = true;
            gameWatcher.close();
            gameWatcher = Deno.watchFs(data.ENTRY_POINT);
            gameIterator = gameWatcher[Symbol.asyncIterator]();
        }
    }
    return data;
}

async function loadFromFile(path: string) {
    const version = path + `?version=${Date.now()}`;
    const data = await import(version);
    return data as GAMEDATA;
}

async function checkFlags() {
    if (FLAGS.resize) {
        resizeWindow();
    }

    if (FLAGS.title) {
        renameWindow();
    }

    if (FLAGS.game) {
        gamedata = await loadFromFile(metadata.ENTRY_POINT);
        FLAGS.game = false;
    }

    if (FLAGS.meta) {
        metadata = await loadMetaDataFromFile(META_PATH);
        FLAGS.meta = false;
    }
}

function resizeWindow() {
    RL.Window.setSize(metadata.SCREEN_WIDTH, metadata.SCREEN_HEIGHT);
    FLAGS.resize = false;
}

function renameWindow() {
    RL.Window.setTitle(metadata.SCREEN_TITLE);
    FLAGS.title = false;
}

function initializeRaylib() {
    RL.Window.init(
        metadata.SCREEN_WIDTH,
        metadata.SCREEN_HEIGHT,
        metadata.SCREEN_TITLE,
    );
    RL.Audio.init();
    RL.Timing.setTargetFPS(60);
}

async function checkMetaFile() {
    while (true) {
        const metaEvent = await metaIterator.next();
        if (metaEvent.done) break;
        if (metaEvent.value.kind === "modify" && !FLAGS.meta) {
            console.log("Change detected in metadata");
            FLAGS.meta = true;
        }
    }
}

async function checkGameFiles() {
    while (true) {
        const gameEvent = await gameIterator.next();
        if (gameEvent.done) break;
        if (gameEvent.value.kind === "modify" && !FLAGS.game) {
            console.log("Change detected in gamedata");
            FLAGS.game = true;
        }
    }
}

function hotReloadRaylibDrawing() {
    if (!RL.Window.shouldClose()) {
        checkMetaFile();
        checkGameFiles();
        checkFlags();

        gamedata?.tick();

        RL.Drawing.beginDrawing();
        RL.Drawing.clearBackground(RL.WHITE);

        gamedata?.draw();

        RL.Drawing.endDrawing();

        setTimeout(hotReloadRaylibDrawing, 1000 / 60);
    } else {
        RL.Window.close();
        RL.Audio.close();
    }
}

initializeRaylib();
hotReloadRaylibDrawing();
