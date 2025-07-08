"use strict";
"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var import_address = require("address");
var import_express = __toESM(require("express"), 1);
var import_max_api = __toESM(require("max-api"), 1);
var import_node_fs = __toESM(require("node:fs"), 1);
var import_node_path = __toESM(require("node:path"), 1);
var import_socket = require("socket.io");
var import_lodash = require("lodash");
const app = (0, import_express.default)();
const server = app.listen(7001);
app.use(import_express.default.static(import_node_path.default.join(process.cwd(), "dist")));
const io = new import_socket.Server(server);
const settings = {
  mediaFolder: import_node_path.default.join(
    process.cwd().match(/\/Users\/[^\/]+\//)[0],
    "/Documents/VorTEX_media"
  ),
  presetBackupFolder: import_node_path.default.join(
    process.cwd().match(/\/Users\/[^\/]+\//)[0],
    "/Documents/VorTEX_presets"
  )
};
import_max_api.default.post("folders", settings.mediaFolder, settings.presetBackupFolder);
const ipAdd = (0, import_address.ip)();
import_max_api.default.outlet(
  "/message",
  `Go to http://${ipAdd}:7001 from an iPad signed into same WiFi to access UI.`
);
import_max_api.default.outlet("/message/ip", `http://${ipAdd}:7001`);
import_max_api.default.outlet(
  "/message/name",
  `name`,
  `presets_${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10).replace(/[\/:]/g, "-")}.json`
);
let files = [];
const readFiles = (socket) => {
  if (!settings.mediaFolder)
    return;
  try {
    files = import_node_fs.default.readdirSync(settings.mediaFolder).filter(
      (file) => /\.(mov|mp4|m4a|png|jpg|aif|gif|webm|webp|vlc)$/.test(file)
    ).filter((file) => !file.startsWith("."));
  } catch (err) {
    import_node_fs.default.mkdirSync(import_node_path.default.resolve(process.cwd(), settings.mediaFolder));
    files = [];
  }
  if (!socket) {
    io.fetchSockets().then((sockets) => {
      sockets.forEach((socket2) => socket2.emit("setFiles", []));
    });
  }
};
import_max_api.default.addHandler("spaceMouse", (...data) => {
  io.fetchSockets().then((sockets) => {
    sockets.forEach(
      (socket) => socket.emit("getSpaceMouse", data[0], data.slice(1, 4), data.slice(4))
    );
  });
});
readFiles();
import_max_api.default.addHandler("setPresetsFile", (file) => {
  try {
    import_max_api.default.post("loading presets file", file);
    const fileContents = import_node_fs.default.readFileSync(file, "utf-8");
    import_node_fs.default.writeFileSync(import_node_path.default.resolve(process.cwd(), "presets.json"), fileContents);
    io.fetchSockets().then((sockets) => {
      sockets.forEach((socket) => socket.emit("setPresets", fileContents));
    });
  } catch (err) {
    console.log("failed");
  }
});
let presets = {};
io.on("connection", (socket) => {
  socket.on("set", (route, property, value) => {
    if (value instanceof Array) {
      import_max_api.default.outlet(route, property, ...value);
    } else {
      if ((property === "file1" || property === "file2") && value) {
        value = import_node_path.default.resolve(settings.mediaFolder, value);
      }
      import_max_api.default.outlet(route, property, value);
    }
  });
  socket.emit("setFiles", files);
  socket.on("getFiles", () => {
    readFiles(socket);
    socket.emit("setFiles", files);
  });
  const readPresets = () => {
    const presetsPath = import_node_path.default.resolve(process.cwd(), "presets.json");
    if (!import_node_fs.default.existsSync(presetsPath)) {
      import_node_fs.default.writeFileSync(presetsPath, "{}");
    }
    try {
      const presets2 = JSON.parse(import_node_fs.default.readFileSync(presetsPath).toString());
      for (let preset of Object.keys(presets2)) {
        if (presets2[preset].length > 4) {
          (0, import_lodash.remove)(presets2[4]);
        }
      }
      return presets2;
    } catch (e) {
      const defaultPresets = {};
      import_node_fs.default.writeFileSync(presetsPath, JSON.stringify(defaultPresets));
      return defaultPresets;
    }
  };
  presets = readPresets();
  socket.on("loadPresets", (callback) => {
    callback(presets);
  });
  socket.on("savePresets", (presets2) => {
    import_node_fs.default.promises.writeFile(
      import_node_path.default.resolve(process.cwd(), "presets.json"),
      JSON.stringify(presets2)
    );
  });
});
setInterval(() => {
  const presetsFolder = import_node_path.default.resolve(settings.presetBackupFolder);
  if (!import_node_fs.default.existsSync(presetsFolder)) {
    import_node_fs.default.mkdirSync(presetsFolder);
  }
  import_node_fs.default.writeFileSync(
    import_node_path.default.join(
      presetsFolder,
      `${(/* @__PURE__ */ new Date()).toISOString().slice(0, 19).replace(/[\/:]/g, "-")}_presets.json`
    ),
    JSON.stringify(presets)
  );
}, 1e3 * 60 * 10);
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsic3JjL3NlcnZlci9pbmRleC50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiaW1wb3J0IHsgaXAgfSBmcm9tICdhZGRyZXNzJ1xuLy9lLmcgc2VydmVyLmpzXG5cbmltcG9ydCBleHByZXNzIGZyb20gJ2V4cHJlc3MnXG5pbXBvcnQgbWF4QXBpIGZyb20gJ21heC1hcGknXG5pbXBvcnQgZnMgZnJvbSAnbm9kZTpmcydcbmltcG9ydCBwYXRoIGZyb20gJ25vZGU6cGF0aCdcbmltcG9ydCB7IFNlcnZlciBhcyBTb2NrZXRTZXJ2ZXIgfSBmcm9tICdzb2NrZXQuaW8nXG5pbXBvcnQgeyByZW1vdmUgfSBmcm9tICdsb2Rhc2gnXG5pbXBvcnQgVml0ZUV4cHJlc3MgZnJvbSAndml0ZS1leHByZXNzJ1xuXG4vLyBjb25zdCBzZXJ2ZXIgPSBhcHAubGlzdGVuKDcwMDEsICgpID0+IGNvbnNvbGUubG9nKCdTZXJ2ZXIgaXMgbGlzdGVuaW5nLi4uJykpXG5jb25zdCBhcHAgPSBleHByZXNzKClcblxuLy8gY29uc3Qgc2VydmVyID0gVml0ZUV4cHJlc3MubGlzdGVuKGFwcCwgNzAwMSwgKCkgPT5cbi8vICAgY29uc29sZS5sb2coJ1NlcnZlciBpcyBsaXN0ZW5pbmcuLi4nKVxuLy8gKVxuY29uc3Qgc2VydmVyID0gYXBwLmxpc3Rlbig3MDAxKVxuXG4vLyBTZXJ2ZSBzdGF0aWMgZmlsZXMgZnJvbSBwdWJsaWMgZm9sZGVyXG5hcHAudXNlKGV4cHJlc3Muc3RhdGljKHBhdGguam9pbihwcm9jZXNzLmN3ZCgpLCAnZGlzdCcpKSlcblxuLy8gU2VydmUgaW5kZXguaHRtbCBhdCB0aGUgcm9vdCByb3V0ZVxuLy8gYXBwLmdldCgnLycsIChyZXEsIHJlcykgPT4ge1xuLy8gICByZXMuc2VuZEZpbGUocGF0aC5qb2luKHByb2Nlc3MuY3dkKCksICdkaXN0JywgJ2luZGV4Lmh0bWwnKSlcbi8vIH0pXG5cbi8vIEFuZCB0aGVuIGF0dGFjaCB0aGUgc29ja2V0LmlvIHNlcnZlciB0byB0aGUgSFRUUCBzZXJ2ZXJcbmNvbnN0IGlvID0gbmV3IFNvY2tldFNlcnZlcjxTb2NrZXRFdmVudHM+KHNlcnZlcilcblxuLy8gVGhlbiB5b3UgY2FuIHVzZSBgaW9gIHRvIGxpc3RlbiB0aGUgYGNvbm5lY3Rpb25gIGV2ZW50IGFuZCBnZXQgYSBzb2NrZXRcbi8vIGZyb20gYSBjbGllbnRcbmNvbnN0IHNldHRpbmdzID0ge1xuICBtZWRpYUZvbGRlcjogcGF0aC5qb2luKFxuICAgIHByb2Nlc3MuY3dkKCkubWF0Y2goL1xcL1VzZXJzXFwvW15cXC9dK1xcLy8pIVswXSxcbiAgICAnL0RvY3VtZW50cy9Wb3JURVhfbWVkaWEnXG4gICksXG4gIHByZXNldEJhY2t1cEZvbGRlcjogcGF0aC5qb2luKFxuICAgIHByb2Nlc3MuY3dkKCkubWF0Y2goL1xcL1VzZXJzXFwvW15cXC9dK1xcLy8pIVswXSxcbiAgICAnL0RvY3VtZW50cy9Wb3JURVhfcHJlc2V0cydcbiAgKVxufVxuXG5tYXhBcGkucG9zdCgnZm9sZGVycycsIHNldHRpbmdzLm1lZGlhRm9sZGVyLCBzZXR0aW5ncy5wcmVzZXRCYWNrdXBGb2xkZXIpXG5jb25zdCBpcEFkZCA9IGlwKClcbm1heEFwaS5vdXRsZXQoXG4gICcvbWVzc2FnZScsXG4gIGBHbyB0byBodHRwOi8vJHtpcEFkZH06NzAwMSBmcm9tIGFuIGlQYWQgc2lnbmVkIGludG8gc2FtZSBXaUZpIHRvIGFjY2VzcyBVSS5gXG4pXG5tYXhBcGkub3V0bGV0KCcvbWVzc2FnZS9pcCcsIGBodHRwOi8vJHtpcEFkZH06NzAwMWApXG5tYXhBcGkub3V0bGV0KFxuICAnL21lc3NhZ2UvbmFtZScsXG4gIGBuYW1lYCxcbiAgYHByZXNldHNfJHtuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCkuc2xpY2UoMCwgMTApLnJlcGxhY2UoL1tcXC86XS9nLCAnLScpfS5qc29uYFxuKVxuXG5sZXQgZmlsZXM6IHN0cmluZ1tdID0gW11cbmNvbnN0IHJlYWRGaWxlcyA9IChzb2NrZXQ/OiBhbnkpID0+IHtcbiAgaWYgKCFzZXR0aW5ncy5tZWRpYUZvbGRlcikgcmV0dXJuXG4gIHRyeSB7XG4gICAgZmlsZXMgPSBmc1xuICAgICAgLnJlYWRkaXJTeW5jKHNldHRpbmdzLm1lZGlhRm9sZGVyKVxuICAgICAgLmZpbHRlcihmaWxlID0+XG4gICAgICAgIC9cXC4obW92fG1wNHxtNGF8cG5nfGpwZ3xhaWZ8Z2lmfHdlYm18d2VicHx2bGMpJC8udGVzdChmaWxlKVxuICAgICAgKVxuICAgICAgLmZpbHRlcihmaWxlID0+ICFmaWxlLnN0YXJ0c1dpdGgoJy4nKSlcbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgZnMubWtkaXJTeW5jKHBhdGgucmVzb2x2ZShwcm9jZXNzLmN3ZCgpLCBzZXR0aW5ncy5tZWRpYUZvbGRlcikpXG4gICAgZmlsZXMgPSBbXVxuICB9XG4gIGlmICghc29ja2V0KSB7XG4gICAgaW8uZmV0Y2hTb2NrZXRzKCkudGhlbihzb2NrZXRzID0+IHtcbiAgICAgIHNvY2tldHMuZm9yRWFjaChzb2NrZXQgPT4gc29ja2V0LmVtaXQoJ3NldEZpbGVzJywgW10pKVxuICAgIH0pXG4gIH1cbn1cblxubWF4QXBpLmFkZEhhbmRsZXIoJ3NwYWNlTW91c2UnLCAoLi4uZGF0YSkgPT4ge1xuICBpby5mZXRjaFNvY2tldHMoKS50aGVuKHNvY2tldHMgPT4ge1xuICAgIHNvY2tldHMuZm9yRWFjaChzb2NrZXQgPT5cbiAgICAgIHNvY2tldC5lbWl0KCdnZXRTcGFjZU1vdXNlJywgZGF0YVswXSwgZGF0YS5zbGljZSgxLCA0KSwgZGF0YS5zbGljZSg0KSlcbiAgICApXG4gIH0pXG59KVxuXG5yZWFkRmlsZXMoKVxuXG5tYXhBcGkuYWRkSGFuZGxlcignc2V0UHJlc2V0c0ZpbGUnLCAoZmlsZTogc3RyaW5nKSA9PiB7XG4gIHRyeSB7XG4gICAgbWF4QXBpLnBvc3QoJ2xvYWRpbmcgcHJlc2V0cyBmaWxlJywgZmlsZSlcbiAgICBjb25zdCBmaWxlQ29udGVudHMgPSBmcy5yZWFkRmlsZVN5bmMoZmlsZSwgJ3V0Zi04JylcbiAgICBmcy53cml0ZUZpbGVTeW5jKHBhdGgucmVzb2x2ZShwcm9jZXNzLmN3ZCgpLCAncHJlc2V0cy5qc29uJyksIGZpbGVDb250ZW50cylcbiAgICBpby5mZXRjaFNvY2tldHMoKS50aGVuKHNvY2tldHMgPT4ge1xuICAgICAgc29ja2V0cy5mb3JFYWNoKHNvY2tldCA9PiBzb2NrZXQuZW1pdCgnc2V0UHJlc2V0cycsIGZpbGVDb250ZW50cykpXG4gICAgfSlcbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgY29uc29sZS5sb2coJ2ZhaWxlZCcpXG4gIH1cbn0pXG5cbmxldCBwcmVzZXRzOiBSZWNvcmQ8c3RyaW5nLCBhbnk+ID0ge31cbmlvLm9uKCdjb25uZWN0aW9uJywgc29ja2V0ID0+IHtcbiAgc29ja2V0Lm9uKCdzZXQnLCAocm91dGU6IHN0cmluZywgcHJvcGVydHk6IHN0cmluZywgdmFsdWU6IGFueSkgPT4ge1xuICAgIGlmICh2YWx1ZSBpbnN0YW5jZW9mIEFycmF5KSB7XG4gICAgICBtYXhBcGkub3V0bGV0KHJvdXRlLCBwcm9wZXJ0eSwgLi4udmFsdWUpXG4gICAgfSBlbHNlIHtcbiAgICAgIGlmICgocHJvcGVydHkgPT09ICdmaWxlMScgfHwgcHJvcGVydHkgPT09ICdmaWxlMicpICYmIHZhbHVlKSB7XG4gICAgICAgIHZhbHVlID0gcGF0aC5yZXNvbHZlKHNldHRpbmdzLm1lZGlhRm9sZGVyLCB2YWx1ZSlcbiAgICAgIH1cbiAgICAgIG1heEFwaS5vdXRsZXQocm91dGUsIHByb3BlcnR5LCB2YWx1ZSlcbiAgICB9XG4gIH0pXG5cbiAgc29ja2V0LmVtaXQoJ3NldEZpbGVzJywgZmlsZXMpXG5cbiAgc29ja2V0Lm9uKCdnZXRGaWxlcycsICgpID0+IHtcbiAgICByZWFkRmlsZXMoc29ja2V0KVxuICAgIHNvY2tldC5lbWl0KCdzZXRGaWxlcycsIGZpbGVzKVxuICB9KVxuXG4gIGNvbnN0IHJlYWRQcmVzZXRzID0gKCkgPT4ge1xuICAgIGNvbnN0IHByZXNldHNQYXRoID0gcGF0aC5yZXNvbHZlKHByb2Nlc3MuY3dkKCksICdwcmVzZXRzLmpzb24nKVxuICAgIGlmICghZnMuZXhpc3RzU3luYyhwcmVzZXRzUGF0aCkpIHtcbiAgICAgIGZzLndyaXRlRmlsZVN5bmMocHJlc2V0c1BhdGgsICd7fScpXG4gICAgfVxuICAgIHRyeSB7XG4gICAgICBjb25zdCBwcmVzZXRzID0gSlNPTi5wYXJzZShmcy5yZWFkRmlsZVN5bmMocHJlc2V0c1BhdGgpLnRvU3RyaW5nKCkpXG4gICAgICBmb3IgKGxldCBwcmVzZXQgb2YgT2JqZWN0LmtleXMocHJlc2V0cykpIHtcbiAgICAgICAgLy8gZml4IGZvciBtZXNoIGxlbmd0aHNcbiAgICAgICAgaWYgKHByZXNldHNbcHJlc2V0XS5sZW5ndGggPiA0KSB7XG4gICAgICAgICAgcmVtb3ZlKHByZXNldHNbNF0pXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiBwcmVzZXRzXG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgY29uc3QgZGVmYXVsdFByZXNldHMgPSB7fVxuICAgICAgZnMud3JpdGVGaWxlU3luYyhwcmVzZXRzUGF0aCwgSlNPTi5zdHJpbmdpZnkoZGVmYXVsdFByZXNldHMpKVxuICAgICAgcmV0dXJuIGRlZmF1bHRQcmVzZXRzXG4gICAgfVxuICB9XG4gIHByZXNldHMgPSByZWFkUHJlc2V0cygpXG5cbiAgc29ja2V0Lm9uKCdsb2FkUHJlc2V0cycsIGNhbGxiYWNrID0+IHtcbiAgICBjYWxsYmFjayhwcmVzZXRzKVxuICB9KVxuXG4gIHNvY2tldC5vbignc2F2ZVByZXNldHMnLCBwcmVzZXRzID0+IHtcbiAgICBmcy5wcm9taXNlcy53cml0ZUZpbGUoXG4gICAgICBwYXRoLnJlc29sdmUocHJvY2Vzcy5jd2QoKSwgJ3ByZXNldHMuanNvbicpLFxuICAgICAgSlNPTi5zdHJpbmdpZnkocHJlc2V0cylcbiAgICApXG4gIH0pXG59KVxuXG4vLyBiYWNrdXAgZXZlcnkgMTAgbWluc1xuc2V0SW50ZXJ2YWwoKCkgPT4ge1xuICBjb25zdCBwcmVzZXRzRm9sZGVyID0gcGF0aC5yZXNvbHZlKHNldHRpbmdzLnByZXNldEJhY2t1cEZvbGRlcilcbiAgaWYgKCFmcy5leGlzdHNTeW5jKHByZXNldHNGb2xkZXIpKSB7XG4gICAgZnMubWtkaXJTeW5jKHByZXNldHNGb2xkZXIpXG4gIH1cblxuICBmcy53cml0ZUZpbGVTeW5jKFxuICAgIHBhdGguam9pbihcbiAgICAgIHByZXNldHNGb2xkZXIsXG4gICAgICBgJHtuZXcgRGF0ZSgpXG4gICAgICAgIC50b0lTT1N0cmluZygpXG4gICAgICAgIC5zbGljZSgwLCAxOSlcbiAgICAgICAgLnJlcGxhY2UoL1tcXC86XS9nLCAnLScpfV9wcmVzZXRzLmpzb25gXG4gICAgKSxcbiAgICBKU09OLnN0cmluZ2lmeShwcmVzZXRzKVxuICApXG59LCAxMDAwICogNjAgKiAxMClcbiJdLAogICJtYXBwaW5ncyI6ICI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLHFCQUFtQjtBQUduQixxQkFBb0I7QUFDcEIscUJBQW1CO0FBQ25CLHFCQUFlO0FBQ2YsdUJBQWlCO0FBQ2pCLG9CQUF1QztBQUN2QyxvQkFBdUI7QUFJdkIsTUFBTSxVQUFNLGVBQUFBLFNBQVE7QUFLcEIsTUFBTSxTQUFTLElBQUksT0FBTyxJQUFJO0FBRzlCLElBQUksSUFBSSxlQUFBQSxRQUFRLE9BQU8saUJBQUFDLFFBQUssS0FBSyxRQUFRLElBQUksR0FBRyxNQUFNLENBQUMsQ0FBQztBQVF4RCxNQUFNLEtBQUssSUFBSSxjQUFBQyxPQUEyQixNQUFNO0FBSWhELE1BQU0sV0FBVztBQUFBLEVBQ2YsYUFBYSxpQkFBQUQsUUFBSztBQUFBLElBQ2hCLFFBQVEsSUFBSSxFQUFFLE1BQU0sbUJBQW1CLEVBQUcsQ0FBQztBQUFBLElBQzNDO0FBQUEsRUFDRjtBQUFBLEVBQ0Esb0JBQW9CLGlCQUFBQSxRQUFLO0FBQUEsSUFDdkIsUUFBUSxJQUFJLEVBQUUsTUFBTSxtQkFBbUIsRUFBRyxDQUFDO0FBQUEsSUFDM0M7QUFBQSxFQUNG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QUYsUUFBSyxRQUFRLFFBQVEsSUFBSSxHQUFHLGNBQWM7QUFDOUQsUUFBSSxDQUFDLGVBQUFHLFFBQUcsV0FBVyxXQUFXLEdBQUc7QUFDL0IscUJBQUFBLFFBQUcsY0FBYyxhQUFhLElBQUk7QUFBQSxJQUNwQztBQUNBLFFBQUk7QUFDRixZQUFNRSxXQUFVLEtBQUssTUFBTSxlQUFBRixRQUFHLGFBQWEsV0FBVyxFQUFFLFNBQVMsQ0FBQztBQUNsRSxlQUFTLFVBQVUsT0FBTyxLQUFLRSxRQUFPLEdBQUc7QUFFdkMsWUFBSUEsU0FBUSxNQUFNLEVBQUUsU0FBUyxHQUFHO0FBQzlCLG9DQUFPQSxTQUFRLENBQUMsQ0FBQztBQUFBLFFBQ25CO0FBQUEsTUFDRjtBQUNBLGFBQU9BO0FBQUEsSUFDVCxTQUFTLEdBQUc7QUFDVixZQUFNLGlCQUFpQixDQUFDO0FBQ3hCLHFCQUFBRixRQUFHLGNBQWMsYUFBYSxLQUFLLFVBQVUsY0FBYyxDQUFDO0FBQzVELGFBQU87QUFBQSxJQUNUO0FBQUEsRUFDRjtBQUNBLFlBQVUsWUFBWTtBQUV0QixTQUFPLEdBQUcsZUFBZSxjQUFZO0FBQ25DLGFBQVMsT0FBTztBQUFBLEVBQ2xCLENBQUM7QUFFRCxTQUFPLEdBQUcsZUFBZSxDQUFBRSxhQUFXO0FBQ2xDLG1CQUFBRixRQUFHLFNBQVM7QUFBQSxNQUNWLGlCQUFBSCxRQUFLLFFBQVEsUUFBUSxJQUFJLEdBQUcsY0FBYztBQUFBLE1BQzFDLEtBQUssVUFBVUssUUFBTztBQUFBLElBQ3hCO0FBQUEsRUFDRixDQUFDO0FBQ0gsQ0FBQztBQUdELFlBQVksTUFBTTtBQUNoQixRQUFNLGdCQUFnQixpQkFBQUwsUUFBSyxRQUFRLFNBQVMsa0JBQWtCO0FBQzlELE1BQUksQ0FBQyxlQUFBRyxRQUFHLFdBQVcsYUFBYSxHQUFHO0FBQ2pDLG1CQUFBQSxRQUFHLFVBQVUsYUFBYTtBQUFBLEVBQzVCO0FBRUEsaUJBQUFBLFFBQUc7QUFBQSxJQUNELGlCQUFBSCxRQUFLO0FBQUEsTUFDSDtBQUFBLE1BQ0EsSUFBRyxvQkFBSSxLQUFLLEdBQ1QsWUFBWSxFQUNaLE1BQU0sR0FBRyxFQUFFLEVBQ1gsUUFBUSxVQUFVLEdBQUcsQ0FBQztBQUFBLElBQzNCO0FBQUEsSUFDQSxLQUFLLFVBQVUsT0FBTztBQUFBLEVBQ3hCO0FBQ0YsR0FBRyxNQUFPLEtBQUssRUFBRTsiLAogICJuYW1lcyI6IFsiZXhwcmVzcyIsICJwYXRoIiwgIlNvY2tldFNlcnZlciIsICJtYXhBcGkiLCAiZnMiLCAic29ja2V0IiwgInByZXNldHMiXQp9Cg==
