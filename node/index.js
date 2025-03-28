"use strict";
import { ip } from "address";
import express from "express";
import maxApi from "max-api";
import fs from "node:fs";
import path from "node:path";
import { Server as SocketServer } from "socket.io";
import ViteExpress from "vite-express";
const app = express();
const server = ViteExpress.listen(
  app,
  7001,
  () => console.log("Server is listening...")
);
const io = new SocketServer(server);
const settings = {
  mediaFolder: path.resolve(process.cwd(), "../media"),
  presetBackupFolder: path.resolve(process.cwd(), "../../presets")
};
const ipAdd = ip();
maxApi.outlet(
  "/message",
  `Go to http://${ipAdd}:7001 from an iPad signed into same WiFi to access UI.`
);
maxApi.outlet("/message/ip", `http://${ipAdd}:7001`);
maxApi.outlet(
  "/message/name",
  `name`,
  `presets_${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}.json`
);
let files = [];
const readFiles = (socket) => {
  if (!settings.mediaFolder)
    return;
  try {
    files = fs.readdirSync(settings.mediaFolder).filter(
      (file) => /\.(mov|mp4|m4a|png|jpg|aif|gif|webm|webp|vlc)$/.test(file)
    ).filter((file) => !file.startsWith("."));
  } catch (err) {
    fs.mkdirSync(path.resolve(process.cwd(), "../media"));
    files = [];
  }
  if (!socket) {
    io.fetchSockets().then((sockets) => {
      sockets.forEach((socket2) => socket2.emit("setFiles", []));
    });
  }
};
maxApi.addHandler("spaceMouse", (...data) => {
  io.fetchSockets().then((sockets) => {
    sockets.forEach(
      (socket) => socket.emit("getSpaceMouse", data[0], data.slice(1, 4), data.slice(4))
    );
  });
});
readFiles();
maxApi.addHandler("setPresetsFile", (file) => {
  try {
    maxApi.post("loading presets file", file);
    const fileContents = fs.readFileSync(file, "utf-8");
    fs.writeFileSync(path.resolve(process.cwd(), "presets.json"), fileContents);
    io.fetchSockets().then((sockets) => {
      sockets.forEach((socket) => socket.emit("setPresets", fileContents));
    });
  } catch (err) {
    console.log("failed");
  }
});
let presets;
io.on("connection", (socket) => {
  socket.on("set", (route, property, value) => {
    if (value instanceof Array) {
      maxApi.outlet(route, property, ...value);
    } else {
      if (settings.mediaFolder) {
        if ((property === "file1" || property === "file2") && value) {
          value = path.resolve(settings.mediaFolder, value);
        }
        maxApi.outlet(route, property, value);
      } else {
        maxApi.post("No media folder selected; please drop Media Folder in.");
      }
    }
  });
  socket.emit("setFiles", files);
  const readPresets = () => {
    const presetsPath = path.resolve(process.cwd(), "presets.json");
    if (!fs.existsSync(presetsPath)) {
      fs.writeFileSync(presetsPath, "{}");
    }
    try {
      return JSON.parse(fs.readFileSync(presetsPath).toString());
    } catch (e) {
      const defaultPresets = {};
      fs.writeFileSync(presetsPath, JSON.stringify(defaultPresets));
      return defaultPresets;
    }
  };
  presets = readPresets();
  socket.on("loadPresets", (callback) => {
    callback(presets);
  });
  socket.on("savePresets", (presets2) => {
    fs.promises.writeFile(
      path.resolve(process.cwd(), "presets.json"),
      JSON.stringify(presets2)
    );
  });
});
setInterval(() => {
  const presetsFolder = path.resolve(process.cwd(), `../../presets`);
  if (!fs.existsSync(presetsFolder)) {
    fs.mkdirSync(presetsFolder);
  }
  fs.writeFileSync(
    path.join(
      presetsFolder,
      `${(/* @__PURE__ */ new Date()).toISOString().slice(0, 19).replace(/\//g, "-")}_presets.json`
    ),
    JSON.stringify(presets)
  );
}, 1e3 * 60 * 10);
