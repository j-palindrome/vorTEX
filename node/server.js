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
var import_express = __toESM(require("express"));
var import_node_fs = __toESM(require("node:fs"));
var import_node_path = __toESM(require("node:path"));
var import_socket = require("socket.io");
var import_lodash = require("lodash");
var import_vite_express = __toESM(require("vite-express"));
var import_osc = __toESM(require("osc"));
const app = (0, import_express.default)();
const server = import_vite_express.default.listen(
  app,
  7001,
  () => console.log("Server is listening...")
);
const io = new import_socket.Server(server);
const oscPortOut = new import_osc.default.UDPPort({
  localAddress: "localhost",
  localPort: 11001,
  // receive from Max
  remoteAddress: "localhost",
  remotePort: 11002
  // send to Max
});
oscPortOut.open();
function oscSend(address, ...args) {
  oscPortOut.send({
    address,
    args: args.map((arg) => {
      if (typeof arg === "number")
        return { type: "f", value: arg };
      if (typeof arg === "string")
        return { type: "s", value: arg };
      if (Array.isArray(arg))
        return arg.map((a) => ({
          type: typeof a === "number" ? "f" : "s",
          value: a
        }));
      return { type: "s", value: String(arg) };
    }).flat()
  });
}
const homeDir = process.env.HOME || process.env.USERPROFILE || "/";
const settings = {
  mediaFolder: import_node_path.default.join(homeDir, "Documents/VorTEX_media"),
  presetBackupFolder: import_node_path.default.join(homeDir, "Documents/VorTEX_presets")
};
import_node_fs.default.readdir(import_node_path.default.join(homeDir, "Documents/VorTEX_media"), (err, files2) => {
  files2.forEach((file) => {
    console.log(file);
  });
});
console.log(`media folder: ${settings.mediaFolder}`);
console.log(`preset backup folder: ${settings.presetBackupFolder}`);
oscSend("/folders", settings.mediaFolder, settings.presetBackupFolder);
const ipAdd = (0, import_address.ip)();
oscSend(
  "/message",
  `Go to http://${ipAdd}:7001 from an iPad signed into same WiFi to access UI.`
);
oscSend("/message/ip", `http://${ipAdd}:7001`);
oscSend(
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
oscPortOut.on("message", (msg) => {
  if (msg.address === "/spaceMouse") {
    const data = msg.args.map((a) => a.value);
    io.fetchSockets().then((sockets) => {
      sockets.forEach(
        (socket) => socket.emit("getSpaceMouse", data[0], data.slice(1, 4), data.slice(4))
      );
    });
  }
});
readFiles();
oscPortOut.on("message", (msg) => {
  if (msg.address === "/setPresetsFile") {
    const file = msg.args[0].value;
    try {
      oscSend("/post", "loading presets file", file);
      const fileContents = import_node_fs.default.readFileSync(file, "utf-8");
      import_node_fs.default.writeFileSync(
        import_node_path.default.resolve(process.cwd(), "presets.json"),
        fileContents
      );
      io.fetchSockets().then((sockets) => {
        sockets.forEach((socket) => socket.emit("setPresets", fileContents));
      });
    } catch (err) {
      console.log("failed");
    }
  }
});
let presets = {};
io.on("connection", (socket) => {
  socket.on("set", (route, property, value) => {
    if (value instanceof Array) {
      oscSend(route, property, ...value);
    } else {
      if ((property === "file1" || property === "file2") && value) {
        value = import_node_path.default.resolve(settings.mediaFolder, value);
      }
      oscSend(route, property, value);
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsic3JjL3NlcnZlci9pbmRleC50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiaW1wb3J0IHsgaXAgfSBmcm9tICdhZGRyZXNzJ1xuLy9lLmcgc2VydmVyLmpzXG5cbmltcG9ydCBleHByZXNzIGZyb20gJ2V4cHJlc3MnXG5pbXBvcnQgZnMgZnJvbSAnbm9kZTpmcydcbmltcG9ydCBwYXRoIGZyb20gJ25vZGU6cGF0aCdcbmltcG9ydCB7IFNlcnZlciBhcyBTb2NrZXRTZXJ2ZXIgfSBmcm9tICdzb2NrZXQuaW8nXG5pbXBvcnQgeyByZW1vdmUgfSBmcm9tICdsb2Rhc2gnXG5pbXBvcnQgVml0ZUV4cHJlc3MgZnJvbSAndml0ZS1leHByZXNzJ1xuaW1wb3J0IG9zYyBmcm9tICdvc2MnXG5cbi8vIGNvbnN0IHNlcnZlciA9IGFwcC5saXN0ZW4oNzAwMSwgKCkgPT4gY29uc29sZS5sb2coJ1NlcnZlciBpcyBsaXN0ZW5pbmcuLi4nKSlcbmNvbnN0IGFwcCA9IGV4cHJlc3MoKVxuXG5jb25zdCBzZXJ2ZXIgPSBWaXRlRXhwcmVzcy5saXN0ZW4oYXBwLCA3MDAxLCAoKSA9PlxuICBjb25zb2xlLmxvZygnU2VydmVyIGlzIGxpc3RlbmluZy4uLicpXG4pXG5cbi8vIFNlcnZlIHN0YXRpYyBmaWxlcyBmcm9tIHB1YmxpYyBmb2xkZXJcbi8vIGFwcC51c2UoZXhwcmVzcy5zdGF0aWMocGF0aC5qb2luKHByb2Nlc3MuY3dkKCksICdkaXN0JykpKVxuXG4vLyBTZXJ2ZSBpbmRleC5odG1sIGF0IHRoZSByb290IHJvdXRlXG4vLyBhcHAuZ2V0KCcvJywgKHJlcSwgcmVzKSA9PiB7XG4vLyAgIHJlcy5zZW5kRmlsZShwYXRoLmpvaW4ocHJvY2Vzcy5jd2QoKSwgJ2Rpc3QnLCAnaW5kZXguaHRtbCcpKVxuLy8gfSlcblxuLy8gQW5kIHRoZW4gYXR0YWNoIHRoZSBzb2NrZXQuaW8gc2VydmVyIHRvIHRoZSBIVFRQIHNlcnZlclxuY29uc3QgaW8gPSBuZXcgU29ja2V0U2VydmVyPFNvY2tldEV2ZW50cz4oc2VydmVyKVxuXG4vLyBPU0Mgc2V0dXBcbmNvbnN0IG9zY1BvcnRPdXQgPSBuZXcgb3NjLlVEUFBvcnQoe1xuICBsb2NhbEFkZHJlc3M6ICdsb2NhbGhvc3QnLFxuICBsb2NhbFBvcnQ6IDExMDAxLCAvLyByZWNlaXZlIGZyb20gTWF4XG4gIHJlbW90ZUFkZHJlc3M6ICdsb2NhbGhvc3QnLFxuICByZW1vdGVQb3J0OiAxMTAwMiAvLyBzZW5kIHRvIE1heFxufSlcbm9zY1BvcnRPdXQub3BlbigpXG5cbmZ1bmN0aW9uIG9zY1NlbmQoYWRkcmVzczogc3RyaW5nLCAuLi5hcmdzOiBhbnlbXSkge1xuICBvc2NQb3J0T3V0LnNlbmQoe1xuICAgIGFkZHJlc3MsXG4gICAgYXJnczogYXJnc1xuICAgICAgLm1hcChhcmcgPT4ge1xuICAgICAgICBpZiAodHlwZW9mIGFyZyA9PT0gJ251bWJlcicpIHJldHVybiB7IHR5cGU6ICdmJywgdmFsdWU6IGFyZyB9XG4gICAgICAgIGlmICh0eXBlb2YgYXJnID09PSAnc3RyaW5nJykgcmV0dXJuIHsgdHlwZTogJ3MnLCB2YWx1ZTogYXJnIH1cbiAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkoYXJnKSlcbiAgICAgICAgICByZXR1cm4gYXJnLm1hcChhID0+ICh7XG4gICAgICAgICAgICB0eXBlOiB0eXBlb2YgYSA9PT0gJ251bWJlcicgPyAnZicgOiAncycsXG4gICAgICAgICAgICB2YWx1ZTogYVxuICAgICAgICAgIH0pKVxuICAgICAgICByZXR1cm4geyB0eXBlOiAncycsIHZhbHVlOiBTdHJpbmcoYXJnKSB9XG4gICAgICB9KVxuICAgICAgLmZsYXQoKVxuICB9KVxufVxuXG4vLyBHZXQgdGhlIHVzZXIncyBob21lIGRpcmVjdG9yeVxuY29uc3QgaG9tZURpciA9IHByb2Nlc3MuZW52LkhPTUUgfHwgcHJvY2Vzcy5lbnYuVVNFUlBST0ZJTEUgfHwgJy8nXG5cbmNvbnN0IHNldHRpbmdzID0ge1xuICBtZWRpYUZvbGRlcjogcGF0aC5qb2luKGhvbWVEaXIsICdEb2N1bWVudHMvVm9yVEVYX21lZGlhJyksXG4gIHByZXNldEJhY2t1cEZvbGRlcjogcGF0aC5qb2luKGhvbWVEaXIsICdEb2N1bWVudHMvVm9yVEVYX3ByZXNldHMnKVxufVxuZnMucmVhZGRpcihwYXRoLmpvaW4oaG9tZURpciwgJ0RvY3VtZW50cy9Wb3JURVhfbWVkaWEnKSwgKGVyciwgZmlsZXMpID0+IHtcbiAgZmlsZXMuZm9yRWFjaChmaWxlID0+IHtcbiAgICBjb25zb2xlLmxvZyhmaWxlKVxuICB9KVxufSlcbmNvbnNvbGUubG9nKGBtZWRpYSBmb2xkZXI6ICR7c2V0dGluZ3MubWVkaWFGb2xkZXJ9YClcbmNvbnNvbGUubG9nKGBwcmVzZXQgYmFja3VwIGZvbGRlcjogJHtzZXR0aW5ncy5wcmVzZXRCYWNrdXBGb2xkZXJ9YClcblxub3NjU2VuZCgnL2ZvbGRlcnMnLCBzZXR0aW5ncy5tZWRpYUZvbGRlciwgc2V0dGluZ3MucHJlc2V0QmFja3VwRm9sZGVyKVxuY29uc3QgaXBBZGQgPSBpcCgpXG5vc2NTZW5kKFxuICAnL21lc3NhZ2UnLFxuICBgR28gdG8gaHR0cDovLyR7aXBBZGR9OjcwMDEgZnJvbSBhbiBpUGFkIHNpZ25lZCBpbnRvIHNhbWUgV2lGaSB0byBhY2Nlc3MgVUkuYFxuKVxub3NjU2VuZCgnL21lc3NhZ2UvaXAnLCBgaHR0cDovLyR7aXBBZGR9OjcwMDFgKVxub3NjU2VuZChcbiAgJy9tZXNzYWdlL25hbWUnLFxuICBgbmFtZWAsXG4gIGBwcmVzZXRzXyR7bmV3IERhdGUoKS50b0lTT1N0cmluZygpLnNsaWNlKDAsIDEwKS5yZXBsYWNlKC9bXFwvOl0vZywgJy0nKX0uanNvbmBcbilcblxubGV0IGZpbGVzOiBzdHJpbmdbXSA9IFtdXG5jb25zdCByZWFkRmlsZXMgPSAoc29ja2V0PzogYW55KSA9PiB7XG4gIGlmICghc2V0dGluZ3MubWVkaWFGb2xkZXIpIHJldHVyblxuICB0cnkge1xuICAgIGZpbGVzID0gZnNcbiAgICAgIC5yZWFkZGlyU3luYyhzZXR0aW5ncy5tZWRpYUZvbGRlcilcbiAgICAgIC5maWx0ZXIoZmlsZSA9PlxuICAgICAgICAvXFwuKG1vdnxtcDR8bTRhfHBuZ3xqcGd8YWlmfGdpZnx3ZWJtfHdlYnB8dmxjKSQvLnRlc3QoZmlsZSlcbiAgICAgIClcbiAgICAgIC5maWx0ZXIoZmlsZSA9PiAhZmlsZS5zdGFydHNXaXRoKCcuJykpXG4gIH0gY2F0Y2ggKGVycikge1xuICAgIGZzLm1rZGlyU3luYyhwYXRoLnJlc29sdmUocHJvY2Vzcy5jd2QoKSwgc2V0dGluZ3MubWVkaWFGb2xkZXIpKVxuICAgIGZpbGVzID0gW11cbiAgfVxuICBpZiAoIXNvY2tldCkge1xuICAgIGlvLmZldGNoU29ja2V0cygpLnRoZW4oc29ja2V0cyA9PiB7XG4gICAgICBzb2NrZXRzLmZvckVhY2goc29ja2V0ID0+IHNvY2tldC5lbWl0KCdzZXRGaWxlcycsIFtdKSlcbiAgICB9KVxuICB9XG59XG5cbm9zY1BvcnRPdXQub24oJ21lc3NhZ2UnLCBtc2cgPT4ge1xuICBpZiAobXNnLmFkZHJlc3MgPT09ICcvc3BhY2VNb3VzZScpIHtcbiAgICBjb25zdCBkYXRhID0gbXNnLmFyZ3MubWFwKGEgPT4gYS52YWx1ZSlcbiAgICBpby5mZXRjaFNvY2tldHMoKS50aGVuKHNvY2tldHMgPT4ge1xuICAgICAgc29ja2V0cy5mb3JFYWNoKHNvY2tldCA9PlxuICAgICAgICBzb2NrZXQuZW1pdCgnZ2V0U3BhY2VNb3VzZScsIGRhdGFbMF0sIGRhdGEuc2xpY2UoMSwgNCksIGRhdGEuc2xpY2UoNCkpXG4gICAgICApXG4gICAgfSlcbiAgfVxufSlcblxucmVhZEZpbGVzKClcblxub3NjUG9ydE91dC5vbignbWVzc2FnZScsIG1zZyA9PiB7XG4gIGlmIChtc2cuYWRkcmVzcyA9PT0gJy9zZXRQcmVzZXRzRmlsZScpIHtcbiAgICBjb25zdCBmaWxlID0gbXNnLmFyZ3NbMF0udmFsdWVcbiAgICB0cnkge1xuICAgICAgb3NjU2VuZCgnL3Bvc3QnLCAnbG9hZGluZyBwcmVzZXRzIGZpbGUnLCBmaWxlKVxuICAgICAgY29uc3QgZmlsZUNvbnRlbnRzID0gZnMucmVhZEZpbGVTeW5jKGZpbGUsICd1dGYtOCcpXG4gICAgICBmcy53cml0ZUZpbGVTeW5jKFxuICAgICAgICBwYXRoLnJlc29sdmUocHJvY2Vzcy5jd2QoKSwgJ3ByZXNldHMuanNvbicpLFxuICAgICAgICBmaWxlQ29udGVudHNcbiAgICAgIClcbiAgICAgIGlvLmZldGNoU29ja2V0cygpLnRoZW4oc29ja2V0cyA9PiB7XG4gICAgICAgIHNvY2tldHMuZm9yRWFjaChzb2NrZXQgPT4gc29ja2V0LmVtaXQoJ3NldFByZXNldHMnLCBmaWxlQ29udGVudHMpKVxuICAgICAgfSlcbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgIGNvbnNvbGUubG9nKCdmYWlsZWQnKVxuICAgIH1cbiAgfVxufSlcblxubGV0IHByZXNldHM6IFJlY29yZDxzdHJpbmcsIGFueT4gPSB7fVxuaW8ub24oJ2Nvbm5lY3Rpb24nLCBzb2NrZXQgPT4ge1xuICBzb2NrZXQub24oJ3NldCcsIChyb3V0ZTogc3RyaW5nLCBwcm9wZXJ0eTogc3RyaW5nLCB2YWx1ZTogYW55KSA9PiB7XG4gICAgaWYgKHZhbHVlIGluc3RhbmNlb2YgQXJyYXkpIHtcbiAgICAgIG9zY1NlbmQocm91dGUsIHByb3BlcnR5LCAuLi52YWx1ZSlcbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKChwcm9wZXJ0eSA9PT0gJ2ZpbGUxJyB8fCBwcm9wZXJ0eSA9PT0gJ2ZpbGUyJykgJiYgdmFsdWUpIHtcbiAgICAgICAgdmFsdWUgPSBwYXRoLnJlc29sdmUoc2V0dGluZ3MubWVkaWFGb2xkZXIsIHZhbHVlKVxuICAgICAgfVxuICAgICAgb3NjU2VuZChyb3V0ZSwgcHJvcGVydHksIHZhbHVlKVxuICAgIH1cbiAgfSlcblxuICBzb2NrZXQuZW1pdCgnc2V0RmlsZXMnLCBmaWxlcylcblxuICBzb2NrZXQub24oJ2dldEZpbGVzJywgKCkgPT4ge1xuICAgIHJlYWRGaWxlcyhzb2NrZXQpXG4gICAgc29ja2V0LmVtaXQoJ3NldEZpbGVzJywgZmlsZXMpXG4gIH0pXG5cbiAgY29uc3QgcmVhZFByZXNldHMgPSAoKSA9PiB7XG4gICAgY29uc3QgcHJlc2V0c1BhdGggPSBwYXRoLnJlc29sdmUocHJvY2Vzcy5jd2QoKSwgJ3ByZXNldHMuanNvbicpXG4gICAgaWYgKCFmcy5leGlzdHNTeW5jKHByZXNldHNQYXRoKSkge1xuICAgICAgZnMud3JpdGVGaWxlU3luYyhwcmVzZXRzUGF0aCwgJ3t9JylcbiAgICB9XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHByZXNldHMgPSBKU09OLnBhcnNlKGZzLnJlYWRGaWxlU3luYyhwcmVzZXRzUGF0aCkudG9TdHJpbmcoKSlcbiAgICAgIGZvciAobGV0IHByZXNldCBvZiBPYmplY3Qua2V5cyhwcmVzZXRzKSkge1xuICAgICAgICAvLyBmaXggZm9yIG1lc2ggbGVuZ3Roc1xuICAgICAgICBpZiAocHJlc2V0c1twcmVzZXRdLmxlbmd0aCA+IDQpIHtcbiAgICAgICAgICByZW1vdmUocHJlc2V0c1s0XSlcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIHByZXNldHNcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICBjb25zdCBkZWZhdWx0UHJlc2V0cyA9IHt9XG4gICAgICBmcy53cml0ZUZpbGVTeW5jKHByZXNldHNQYXRoLCBKU09OLnN0cmluZ2lmeShkZWZhdWx0UHJlc2V0cykpXG4gICAgICByZXR1cm4gZGVmYXVsdFByZXNldHNcbiAgICB9XG4gIH1cbiAgcHJlc2V0cyA9IHJlYWRQcmVzZXRzKClcblxuICBzb2NrZXQub24oJ2xvYWRQcmVzZXRzJywgY2FsbGJhY2sgPT4ge1xuICAgIGNhbGxiYWNrKHByZXNldHMpXG4gIH0pXG5cbiAgc29ja2V0Lm9uKCdzYXZlUHJlc2V0cycsIHByZXNldHMgPT4ge1xuICAgIGZzLnByb21pc2VzLndyaXRlRmlsZShcbiAgICAgIHBhdGgucmVzb2x2ZShwcm9jZXNzLmN3ZCgpLCAncHJlc2V0cy5qc29uJyksXG4gICAgICBKU09OLnN0cmluZ2lmeShwcmVzZXRzKVxuICAgIClcbiAgfSlcbn0pXG5cbi8vIGJhY2t1cCBldmVyeSAxMCBtaW5zXG5zZXRJbnRlcnZhbCgoKSA9PiB7XG4gIGNvbnN0IHByZXNldHNGb2xkZXIgPSBwYXRoLnJlc29sdmUoc2V0dGluZ3MucHJlc2V0QmFja3VwRm9sZGVyKVxuICBpZiAoIWZzLmV4aXN0c1N5bmMocHJlc2V0c0ZvbGRlcikpIHtcbiAgICBmcy5ta2RpclN5bmMocHJlc2V0c0ZvbGRlcilcbiAgfVxuXG4gIGZzLndyaXRlRmlsZVN5bmMoXG4gICAgcGF0aC5qb2luKFxuICAgICAgcHJlc2V0c0ZvbGRlcixcbiAgICAgIGAke25ldyBEYXRlKClcbiAgICAgICAgLnRvSVNPU3RyaW5nKClcbiAgICAgICAgLnNsaWNlKDAsIDE5KVxuICAgICAgICAucmVwbGFjZSgvW1xcLzpdL2csICctJyl9X3ByZXNldHMuanNvbmBcbiAgICApLFxuICAgIEpTT04uc3RyaW5naWZ5KHByZXNldHMpXG4gIClcbn0sIDEwMDAgKiA2MCAqIDEwKVxuIl0sCiAgIm1hcHBpbmdzIjogIjs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEscUJBQW1CO0FBR25CLHFCQUFvQjtBQUNwQixxQkFBZTtBQUNmLHVCQUFpQjtBQUNqQixvQkFBdUM7QUFDdkMsb0JBQXVCO0FBQ3ZCLDBCQUF3QjtBQUN4QixpQkFBZ0I7QUFHaEIsTUFBTSxVQUFNLGVBQUFBLFNBQVE7QUFFcEIsTUFBTSxTQUFTLG9CQUFBQyxRQUFZO0FBQUEsRUFBTztBQUFBLEVBQUs7QUFBQSxFQUFNLE1BQzNDLFFBQVEsSUFBSSx3QkFBd0I7QUFDdEM7QUFXQSxNQUFNLEtBQUssSUFBSSxjQUFBQyxPQUEyQixNQUFNO0FBR2hELE1BQU0sYUFBYSxJQUFJLFdBQUFDLFFBQUksUUFBUTtBQUFBLEVBQ2pDLGNBQWM7QUFBQSxFQUNkLFdBQVc7QUFBQTtBQUFBLEVBQ1gsZUFBZTtBQUFBLEVBQ2YsWUFBWTtBQUFBO0FBQ2QsQ0FB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O0FBQzlELFFBQUksQ0FBQyxlQUFBQyxRQUFHLFdBQVcsV0FBVyxHQUFHO0FBQy9CLHFCQUFBQSxRQUFHLGNBQWMsYUFBYSxJQUFJO0FBQUEsSUFDcEM7QUFDQSxRQUFJO0FBQ0YsWUFBTUcsV0FBVSxLQUFLLE1BQU0sZUFBQUgsUUFBRyxhQUFhLFdBQVcsRUFBRSxTQUFTLENBQUM7QUFDbEUsZUFBUyxVQUFVLE9BQU8sS0FBS0csUUFBTyxHQUFHO0FBRXZDLFlBQUlBLFNBQVEsTUFBTSxFQUFFLFNBQVMsR0FBRztBQUM5QixvQ0FBT0EsU0FBUSxDQUFDLENBQUM7QUFBQSxRQUNuQjtBQUFBLE1BQ0Y7QUFDQSxhQUFPQTtBQUFBLElBQ1QsU0FBUyxHQUFHO0FBQ1YsWUFBTSxpQkFBaUIsQ0FBQztBQUN4QixxQkFBQUgsUUFBRyxjQUFjLGFBQWEsS0FBSyxVQUFVLGNBQWMsQ0FBQztBQUM1RCxhQUFPO0FBQUEsSUFDVDtBQUFBLEVBQ0Y7QUFDQSxZQUFVLFlBQVk7QUFFdEIsU0FBTyxHQUFHLGVBQWUsY0FBWTtBQUNuQyxhQUFTLE9BQU87QUFBQSxFQUNsQixDQUFDO0FBRUQsU0FBTyxHQUFHLGVBQWUsQ0FBQUcsYUFBVztBQUNsQyxtQkFBQUgsUUFBRyxTQUFTO0FBQUEsTUFDVixpQkFBQUQsUUFBSyxRQUFRLFFBQVEsSUFBSSxHQUFHLGNBQWM7QUFBQSxNQUMxQyxLQUFLLFVBQVVJLFFBQU87QUFBQSxJQUN4QjtBQUFBLEVBQ0YsQ0FBQztBQUNILENBQUM7QUFHRCxZQUFZLE1BQU07QUFDaEIsUUFBTSxnQkFBZ0IsaUJBQUFKLFFBQUssUUFBUSxTQUFTLGtCQUFrQjtBQUM5RCxNQUFJLENBQUMsZUFBQUMsUUFBRyxXQUFXLGFBQWEsR0FBRztBQUNqQyxtQkFBQUEsUUFBRyxVQUFVLGFBQWE7QUFBQSxFQUM1QjtBQUVBLGlCQUFBQSxRQUFHO0FBQUEsSUFDRCxpQkFBQUQsUUFBSztBQUFBLE1BQ0g7QUFBQSxNQUNBLElBQUcsb0JBQUksS0FBSyxHQUNULFlBQVksRUFDWixNQUFNLEdBQUcsRUFBRSxFQUNYLFFBQVEsVUFBVSxHQUFHLENBQUM7QUFBQSxJQUMzQjtBQUFBLElBQ0EsS0FBSyxVQUFVLE9BQU87QUFBQSxFQUN4QjtBQUNGLEdBQUcsTUFBTyxLQUFLLEVBQUU7IiwKICAibmFtZXMiOiBbImV4cHJlc3MiLCAiVml0ZUV4cHJlc3MiLCAiU29ja2V0U2VydmVyIiwgIm9zYyIsICJwYXRoIiwgImZzIiwgImZpbGVzIiwgInNvY2tldCIsICJwcmVzZXRzIl0KfQo=
