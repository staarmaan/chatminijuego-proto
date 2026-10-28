# Plan: Socket-based fish spawning

## Goal
Allow spawning fish from a Lua client terminal by connecting as client to a socket server started by the game (Electron). The client should be able to pass a fish type from `src/renderer/src/classes/EnumFishTypes.ts` and a scale (0 to 5). The game listens as a server.

## Architecture
- **Main process (Electron)**: run a TCP socket server (e.g., `net` module) on `127.0.0.1:7777` (or configurable). Parse incoming text/JSON messages and forward to renderer via `webContents.send('spawn-fish', payload)`. 
- **Preload**: expose `window.api.onSpawnFish(cb)` (using `ipcRenderer.on` with contextBridge) so renderer can subscribe to spawn events.
- **Renderer (Phaser)**: in the main scene, listen for socket spawn events. For each event, parse `fishType` (by name/key matching EnumFishTypes or by numeric index) and `scale` (0-5; 0 means random as Fish already does). Create a new `Fish` instance at a spawn position (e.g., top/center) and add to the `fishes` group. Expose a helper `spawnFish(fishType, scale)` to centralize logic and also keep existing UI buttons working.
- **Lua client**: provide a simple Lua script (e.g., `tools/spawn_fish_client.lua`) using `socket.tcp()` (LuaSocket) that connects to localhost:7777 and sends commands. Support formats like `CLOWNFISH 3`, `{"fishType":"SALMON","scale":2}`, etc. Document usage.

## Files to modify
- `src/main/index.ts`: add net server, store window ref, forward parsed payloads to renderer via `spawn-fish` IPC
- `src/preload/index.ts`: add `onSpawnFish` API via contextBridge
- `src/preload/index.d.ts`: update type definitions for `window.api.onSpawnFish`
- `src/renderer/src/main.ts`: import API/types, subscribe to spawn events, add `spawnFishFromSocket(payload)` helper that resolves fish type (string/number), validates/clamps scale (0-5), instantiates Fish and adds to group

## Fish type resolution
EnumFishTypes keys/names: CLOWNFISH, BLUETANG, SALMON, BASA, FIGHTERFISH, POMFRET, TAUTOG (values are numeric). In renderer, can use `EnumFishTypes[fishTypeName]` if passed as string name, or accept numeric index. Also can map against `ReverseEnumFishType` / existing texture keys. Need to be tolerant of case.

## Scale
Fish constructor already accepts `fishScale = 0` and if 0/random logic applies (rounds rpow). User wants scale 0-5 explicitly; pass through as number (0-5). Clamping to [0,5] is safe.

## Spawn position
Use a reasonable default (e.g., scene center/top like existing buttons do `x: 200, y: 400`) or random near top edge. Can match current button behavior for consistency.

## Client (Lua)
Create `tools/spawn_fish_client.lua` using LuaSocket:
```lua
local socket = require("socket")
local c = assert(socket.connect("127.0.0.1", 7777))
c:send("CLOWNFISH 3\n")
c:close()
```
Also maybe a CLI wrapper. Document how to run with `lua`.

## Testing
- Run game (`npm run dev`)
- Connect with Lua client and spawn various types/scales
- Verify fish appears with correct sprite/scale

## Notes
- Keep sandbox false in BrowserWindow (already set) to allow preload.
- Use contextIsolation true (default in Electron toolkit) so must use contextBridge.
- Only listen on loopback (127.0.0.1) for safety.
