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
const settings = JSON.parse(
  fs.readFileSync(path.resolve(process.cwd(), "settings.json")).toString()
);
const updateSettings = (newSettings) => {
  for (let key of Object.keys(newSettings)) {
    settings[key] = newSettings[key];
  }
  fs.writeFileSync(
    path.resolve(process.cwd(), "settings.json"),
    JSON.stringify(settings)
  );
};
io.on("connection", (socket) => {
  maxApi.outlet(
    "/message",
    `Go to http://${ip()}:7001 from an iPad signed into same WiFi to access UI.`
  );
  maxApi.outlet("/message/ip", `http://${ip()}:7001`);
  maxApi.outlet(
    "/message/name",
    `name`,
    `presets_${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}.json`
  );
  socket.on("set", (route, property, value) => {
    if (value instanceof Array) {
      maxApi.outlet(route, property, ...value);
    } else {
      if ((property === "file1" || property === "file2") && value) {
        value = path.resolve(settings.mediaFolder, value);
      }
      maxApi.outlet(route, property, value);
    }
  });
  const presets = fs.readFileSync(path.resolve(process.cwd(), "presets.json")).toString();
  socket.on("loadPresets", (callback) => {
    callback(presets);
  });
  socket.on("savePresets", (presets2) => {
    fs.writeFile(
      path.resolve(process.cwd(), "presets.json"),
      JSON.stringify(presets2),
      () => {
      }
    );
  });
  const readFiles = () => {
    if (!settings.mediaFolder)
      return;
    try {
      const files = fs.readdirSync(settings.mediaFolder).filter(
        (file) => /\.(mov|mp4|m4a|png|jpg|aif|gif|webm|webp|vlc)$/.test(file)
      );
      socket.emit("setFiles", files);
    } catch (err) {
      maxApi.post(
        // @ts-ignore
        err.message,
        "Media folder not found; please drop the Media folder again."
      );
    }
  };
  maxApi.addHandler("setMediaFolder", (folder) => {
    try {
      maxApi.post("media folder", folder, folder);
      updateSettings({ mediaFolder: folder });
      readFiles();
    } catch (err) {
      updateSettings({ mediaFolder: "" });
      if (err instanceof Error)
        maxApi.post("ERROR:", err.message);
    }
  });
  maxApi.addHandler("setPresetsFile", (file) => {
    try {
      maxApi.post("loading presets file", file);
      const fileContents = fs.readFileSync(file, "utf-8");
      fs.writeFileSync(
        path.resolve(process.cwd(), "presets.json"),
        fileContents
      );
      socket.emit("setPresets", fileContents);
    } catch (err) {
      console.log("failed");
    }
  });
  readFiles();
  maxApi.addHandler("savePresetsFile", (file) => {
    socket.emit("getPresets", (presets2) => {
      fs.writeFile(file, presets2, () => {
        maxApi.post("presets saved to external file");
      });
    });
  });
  maxApi.addHandler("spaceMouse", (...data) => {
    socket.emit("getSpaceMouse", data.slice(0, 3), data.slice(3, 6));
  });
});
