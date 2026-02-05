import { Buffer } from "buffer";
import { Platform } from "react-native";
import * as FileSystem from "expo-file-system/legacy";
import { usePlayerStore } from "../store/playerStore";
import { useSongStore } from "../store/songStore";
import { usePlaylistStore } from "../store/playlistStore";
import { getTopGenres, getProfileItem } from "./database";

const PORT = 3001;
let serverIp = "localhost";

function convertFilePathToUrl(filePath: string): string {
  if (!filePath || !filePath.startsWith("file://")) {
    return filePath;
  }
  const encoded = encodeURIComponent(filePath);
  return `http://${serverIp}:${PORT}/api/image?path=${encoded}`;
}

function sendJson(
  respond: (status: number, contentType: string, body: string) => void,
  status: number,
  data: object
) {
  respond(status, "application/json", JSON.stringify(data));
}

async function handleRequest(
  request: { url: string; type: string; postData?: string },
  respond: (status: number, contentType: string, body: string) => void,
  socket?: any
) {
  const fullUrl = request.url;
  const path = fullUrl.split("?")[0];
  const store = usePlayerStore.getState();

  if (request.type === "GET" && path === "/") {
    sendJson(respond, 200, {
      name: "Inami API",
      endpoints: [
        "/api/player/status",
        "/api/player/queue",
        "/api/songs",
        "/api/playlists",
        "/api/profile",
        "/api/genres",
        "/api/trending/albums",
        "/api/trending/artists",
        "/api/image?path=<encoded-file-path>",
      ],
      usage: "Call the server using http://<this-ip>:3001",
    });
    return;
  }

  if (request.type === "GET" && path === "/api/image") {
    try {
      const queryString = fullUrl.split("?")[1] || "";
      const params = new URLSearchParams(queryString);
      const filePath = params.get("path");

      if (!filePath || !filePath.startsWith("file://")) {
        sendJson(respond, 400, { error: "Invalid file path" });
        return;
      }

      const base64 = await FileSystem.readAsStringAsync(filePath, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const ext = filePath.toLowerCase().split(".").pop();
      let mimeType = "image/jpeg";
      if (ext === "png") mimeType = "image/png";
      else if (ext === "webp") mimeType = "image/webp";
      else if (ext === "gif") mimeType = "image/gif";

      const imageBuffer = Buffer.from(base64, "base64");
      const len = imageBuffer.length;

      const corsHeaders =
        "Access-Control-Allow-Origin: *\r\n" +
        "Access-Control-Allow-Methods: GET\r\n" +
        "Cache-Control: public, max-age=86400\r\n";

      const response = [
        `HTTP/1.1 200 OK\r\n`,
        corsHeaders,
        `Content-Type: ${mimeType}\r\n`,
        "Connection: close\r\n",
        `Content-Length: ${len}\r\n`,
        "\r\n",
      ].join("");

      if (socket?.write) {
        const headerBuffer = Buffer.from(response, "utf8");
        const fullResponse = Buffer.concat([headerBuffer, imageBuffer]);
        socket.write(fullResponse, "binary", () => {
          try {
            socket.destroy();
          } catch {}
        });
      } else {
        respond(
          500,
          "application/json",
          JSON.stringify({ error: "Socket unavailable" })
        );
      }
      return;
    } catch (error) {
      console.warn("Failed to serve image:", error);
      sendJson(respond, 500, { error: "Failed to load image" });
      return;
    }
  }

  if (request.type === "GET" && path === "/api/player/status") {
    let currentSong = store.currentSong;
    if (currentSong?.artwork && currentSong.artwork.startsWith("file://")) {
      currentSong = {
        ...currentSong,
        artwork: convertFilePathToUrl(currentSong.artwork),
      };
    }

    const queueWithUrls = store.queue.map((song) => {
      if (song.artwork && song.artwork.startsWith("file://")) {
        return {
          ...song,
          artwork: convertFilePathToUrl(song.artwork),
        };
      }
      return song;
    });

    sendJson(respond, 200, {
      currentSong,
      isPlaying: store.isPlaying,
      position: store.position,
      duration: store.duration,
      shuffle: store.shuffle,
      repeat: store.repeat,
      queue: queueWithUrls,
      currentIndex: store.currentIndex,
      ok: true,
    });
    return;
  }

  if (request.type === "GET" && path === "/api/player/queue") {
    const queueWithUrls = store.queue.map((song) => {
      if (song.artwork && song.artwork.startsWith("file://")) {
        return {
          ...song,
          artwork: convertFilePathToUrl(song.artwork),
        };
      }
      return song;
    });

    sendJson(respond, 200, {
      queue: queueWithUrls,
      currentIndex: store.currentIndex,
    });
    return;
  }

  if (request.type === "GET" && path === "/api/songs") {
    const songStore = useSongStore.getState();

    const songsWithUrls = songStore.songs.map((song) => {
      if (song.artwork && song.artwork.startsWith("file://")) {
        return {
          ...song,
          artwork: convertFilePathToUrl(song.artwork),
        };
      }
      return song;
    });

    sendJson(respond, 200, {
      songs: songsWithUrls,
      total: songsWithUrls.length,
    });
    return;
  }

  if (request.type === "GET" && path === "/api/playlists") {
    const playlistStore = usePlaylistStore.getState();
    const playlists = await Promise.all(
      playlistStore.playlists.map(async (playlist) => {
        const songs = await playlistStore.getPlaylistSongs(playlist.id);

        const songsWithUrls = songs.map((song: any) => {
          if (song.artwork && song.artwork.startsWith("file://")) {
            return {
              ...song,
              artwork: convertFilePathToUrl(song.artwork),
            };
          }
          return song;
        });

        return {
          ...playlist,
          songs: songsWithUrls,
        };
      })
    );
    sendJson(respond, 200, {
      playlists,
      total: playlists.length,
    });
    return;
  }

  if (request.type === "GET" && path === "/api/trending/albums") {
    const songStore = useSongStore.getState();
    const songs = songStore.songs;

    const albumCount: {
      [key: string]: { count: number; artist: string; artwork: string };
    } = {};
    songs.forEach((song: any) => {
      const album = song.album || "Unknown Album";
      if (!albumCount[album]) {
        albumCount[album] = {
          count: 0,
          artist: song.artist || "Unknown Artist",
          artwork: song.artwork,
        };
      }
      albumCount[album].count++;
    });

    const topAlbums = Object.entries(albumCount)
      .sort(([, a], [, b]) => b.count - a.count)
      .slice(0, 10)
      .map(([album, data]) => ({
        title: album,
        artist: data.artist,
        songCount: data.count,
        artwork:
          data.artwork && data.artwork.startsWith("file://")
            ? convertFilePathToUrl(data.artwork)
            : data.artwork,
      }));

    sendJson(respond, 200, {
      albums: topAlbums,
      total: topAlbums.length,
    });
    return;
  }

  if (request.type === "GET" && path === "/api/trending/artists") {
    const songStore = useSongStore.getState();
    const songs = songStore.songs;

    const artistCount: { [key: string]: { count: number; artwork: string } } =
      {};
    songs.forEach((song: any) => {
      const artist = song.artist || "Unknown Artist";
      if (!artistCount[artist]) {
        artistCount[artist] = { count: 0, artwork: song.artwork };
      }
      artistCount[artist].count++;
    });

    const topArtists = Object.entries(artistCount)
      .sort(([, a], [, b]) => b.count - a.count)
      .slice(0, 10)
      .map(([artist, data]) => ({
        name: artist,
        songCount: data.count,
        artwork:
          data.artwork && data.artwork.startsWith("file://")
            ? convertFilePathToUrl(data.artwork)
            : data.artwork,
      }));

    sendJson(respond, 200, {
      artists: topArtists,
      total: topArtists.length,
    });
    return;
  }

  if (request.type === "GET" && path === "/api/profile") {
    try {
      const profile = await getProfileItem();
      if (profile) {
        sendJson(respond, 200, {
          username: profile.username || "User",
          playcount: profile.playcount || "0",
          profile_picture: profile.profile_picture
            ? convertFilePathToUrl(profile.profile_picture)
            : null,
        });
      } else {
        sendJson(respond, 200, {
          username: "User",
          playcount: "0",
          profile_picture: null,
        });
      }
    } catch (err) {
      console.error("Error fetching profile:", err);
      sendJson(respond, 500, {
        error: "Failed to fetch profile",
        username: "User",
        playcount: "0",
      });
    }
    return;
  }

  if (request.type === "GET" && path === "/api/genres") {
    try {
      const topGenres = await getTopGenres(50);
      const genres = topGenres.map((g: any) => g.text);

      sendJson(respond, 200, {
        genres: genres,
        total: genres.length,
      });
    } catch (err) {
      console.error("Error fetching genres:", err);
      sendJson(respond, 500, {
        error: "Failed to fetch genres",
        genres: [],
        total: 0,
      });
    }
    return;
  }

  if (request.type === "POST" && path === "/api/player/toggle") {
    store.togglePlayPause().catch(() => {});
    sendJson(respond, 200, { success: true });
    return;
  }

  if (request.type === "POST" && path === "/api/player/next") {
    store.playNext().catch(() => {});
    sendJson(respond, 200, { success: true });
    return;
  }

  if (request.type === "POST" && path === "/api/player/previous") {
    store.playPrevious().catch(() => {});
    sendJson(respond, 200, { success: true });
    return;
  }

  if (request.type === "POST" && path === "/api/player/shuffle") {
    store.toggleShuffle();
    sendJson(respond, 200, { success: true });
    return;
  }

  if (request.type === "POST" && path === "/api/player/repeat") {
    store.toggleRepeat();
    sendJson(respond, 200, { success: true });
    return;
  }

  if (request.type === "POST" && path.startsWith("/api/player/seek")) {
    let body: { position?: number } = {};
    try {
      if (request.postData) body = JSON.parse(request.postData);
    } catch {}
    if (typeof body.position !== "number") {
      sendJson(respond, 400, { error: "Position must be a number" });
      return;
    }
    store.seekTo(body.position).catch(() => {});
    sendJson(respond, 200, { success: true });
    return;
  }

  const playMatch = path.match(/^\/api\/player\/play\/(.+)$/);
  if (request.type === "POST" && playMatch) {
    const songId = decodeURIComponent(playMatch[1]);
    const song = store.queue.find((s) => s.id === songId);
    if (!song) {
      sendJson(respond, 404, { error: "Song not found" });
      return;
    }
    store.playSong(song).catch(() => {});
    sendJson(respond, 200, { success: true });
    return;
  }

  sendJson(respond, 404, { error: "Not found" });
}

function parseHttpRequest(
  raw: string
): { method: string; path: string; postData?: string } | null {
  const crlf = "\r\n";
  const idx = raw.indexOf(crlf + crlf);
  if (idx === -1) return null;
  const head = raw.slice(0, idx);
  const bodyStart = idx + 2 * crlf.length;
  const body = raw.slice(bodyStart);
  const firstLine = head.split(crlf)[0];
  if (!firstLine) return null;
  const parts = firstLine.split(" ");
  const method = (parts[0] ?? "GET").toUpperCase();
  const path = parts[1] ?? "/";
  const clMatch = head.match(/content-length:\s*(\d+)/i);
  const contentLength = clMatch ? parseInt(clMatch[1], 10) : 0;
  if (contentLength > 0 && body.length < contentLength) return null;
  let postData: string | undefined;
  if (contentLength > 0) postData = body.slice(0, contentLength);
  else if (body.length > 0) postData = body;
  return { method, path, postData };
}

const CORS_HEADERS =
  "Access-Control-Allow-Origin: *\r\n" +
  "Access-Control-Allow-Methods: GET, POST, OPTIONS\r\n" +
  "Access-Control-Allow-Headers: Content-Type\r\n";

function buildResponse(
  status: number,
  contentType: string,
  body: string
): string {
  const statusText =
    status === 200
      ? "OK"
      : status === 404
      ? "Not Found"
      : status === 400
      ? "Bad Request"
      : "Internal Server Error";
  const len = Buffer.byteLength(body, "utf8");
  return [
    `HTTP/1.1 ${status} ${statusText}\r\n`,
    CORS_HEADERS,
    `Content-Type: ${contentType}\r\n`,
    "Connection: close\r\n",
    `Content-Length: ${len}\r\n`,
    "\r\n",
    body,
  ].join("");
}

function buildCorsOnlyResponse(): string {
  return [
    "HTTP/1.1 204 No Content\r\n",
    CORS_HEADERS,
    "Connection: close\r\n",
    "Content-Length: 0\r\n",
    "\r\n",
  ].join("");
}

let tcpServer: { close: (cb?: () => void) => void } | null = null;
let serverStarted = false;

export function startMusicControlServer(): void {
  if (Platform.OS === "web") return;
  if (serverStarted) return;

  try {
    const mod = require("react-native-tcp-socket");
    const TcpSocket = mod?.default ?? mod;
    if (!TcpSocket?.createServer) {
      if (__DEV__)
        console.warn(
          "[Music remote] react-native-tcp-socket createServer not available. Ensure the native module is linked (e.g. run npx expo prebuild)."
        );
      return;
    }

    const server = TcpSocket.createServer(
      (socket: {
        on: (e: string, fn: (d: Buffer | string) => void) => void;
        write: (
          data: string | Buffer,
          encoding?: string,
          cb?: () => void
        ) => void;
        destroy: () => void;
        setEncoding?: (enc: string) => void;
        address?: () => { address: string; port: number } | undefined;
      }) => {
        try {
          const addr = socket.address?.();
          if (
            addr?.address &&
            addr.address !== "0.0.0.0" &&
            addr.address !== "127.0.0.1"
          ) {
            serverIp = addr.address;
          }
        } catch {}

        let buffer = "";
        socket.setEncoding?.("utf8");
        socket.on("data", (data: Buffer | string) => {
          buffer += typeof data === "string" ? data : data.toString("utf8");
          const req = parseHttpRequest(buffer);
          if (!req) return;
          buffer = "";
          const respond = (
            status: number,
            contentType: string,
            body: string
          ) => {
            const res = buildResponse(status, contentType, body);
            socket.write(res, "utf8", () => {
              try {
                socket.destroy();
              } catch {}
            });
          };
          try {
            if (req.method === "OPTIONS") {
              socket.write(buildCorsOnlyResponse(), "utf8", () => {
                try {
                  socket.destroy();
                } catch {}
              });
              return;
            }
            handleRequest(
              { url: req.path, type: req.method, postData: req.postData },
              respond,
              socket
            ).catch((err) => {
              if (__DEV__)
                console.warn("[Music remote] Request handler error:", err);
              respond(
                500,
                "application/json",
                JSON.stringify({ error: "Internal error" })
              );
            });
          } catch (err) {
            if (__DEV__)
              console.warn("[Music remote] Request handler error:", err);
            respond(
              500,
              "application/json",
              JSON.stringify({ error: "Internal error" })
            );
          }
        });
      }
    );

    server.listen({ port: PORT, host: "0.0.0.0" }, () => {
      serverStarted = true;
      tcpServer = server;

      try {
        const NetworkInfo = require("react-native-network-info");
        NetworkInfo.default?.getIPAddress?.()?.then?.((ip: string) => {
          if (ip) {
            serverIp = ip;
            if (__DEV__) {
              console.log(
                `[Music remote] Server is running on http://${ip}:${PORT}`
              );
            }
          }
        });
      } catch {
        if (__DEV__) {
          console.log(
            `[Music remote] Server is set on http://<this-device-ip>:${PORT}.`
          );
        }
      }
    });

    server.on("error", (err: Error) => {
      if (__DEV__) console.warn("[Music remote] Server error:", err);
      serverStarted = false;
      tcpServer = null;
    });
  } catch (e) {
    if (__DEV__) console.warn(e);
  }
}

export function stopMusicControlServer(): void {
  if (Platform.OS === "web" || !tcpServer) return;
  try {
    tcpServer.close(() => {
      serverStarted = false;
      tcpServer = null;
    });
  } catch {
    serverStarted = false;
    tcpServer = null;
  }
}

export function isMusicControlServerRunning(): boolean {
  return serverStarted;
}

export function setServerIp(ip: string): void {
  serverIp = ip;
  if (__DEV__) {
    console.log(`[Music remote] Server IP set to: ${ip}`);
  }
}

export function getServerInfo(): {
  ip: string;
  port: number;
  running: boolean;
} {
  return {
    ip: serverIp,
    port: PORT,
    running: serverStarted,
  };
}
