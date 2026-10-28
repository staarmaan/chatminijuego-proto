# Plan: Socket-based Fish Spawning (Detailed)

## Objective
Enable spawning fishes through sockets. A Lua client terminal should be able to connect to the game acting as a server and spawn fishes by specifying a fish type from `src/renderer/src/classes/EnumFishTypes.ts` and a scale (0-5).

## Current Architecture Analysis
- **Electron app** (electron-vite): main process in `src/main/index.ts`, preload in `src/preload/*`, renderer in `src/renderer/src/*` with Phaser game
- **Game**: `MainScene` in `src/renderer/src/main.ts` manages `this.fishes` (Phaser Physics.Arcade.Group with `Fish` class). Has UI buttons to spawn fish with selected type/scale
- **Fish types**: Defined in `EnumFishTypes.ts` as numeric enum (CLOWNFISH=0, BLUETANG=1, SALMON=2, BASA=3, FIGHTERFISH=4, POMFRET=5, TAUTOG=6) with `ReverseEnumFishType` mapping values back to names
- **Fish spawning**: `new Fish(scene, x, y, fishType, fishScale)` where fishScale 0 means random (see Fish.ts:52). Scale is rounded via `round(fishScale)` and set via `setScale()`
- **IPC**: Main has basic `ipcMain.on('ping')`, preload exposes `electron` API and empty `api` object

## Implementation Plan

### 1. Main Process - Socket Server (`src/main/index.ts`)
Add TCP socket server listening on `127.0.0.1:7777`:
- Import `net` from Node
- Store reference to `BrowserWindow` instance (`mainWindowRef`)
- Create `startFishSocketServer(port = 7777)` function
- Parse incoming data in multiple formats:
  1. JSON: `{"fishType": "CLOWNFISH", "scale": 3}` or `{"fishType": 0, "scale": 2}`
  2. Space/comma separated: `CLOWNFISH 3`, `spawn SALMON 1`, `fish BASA 0`, etc.
- Forward parsed payload to renderer via `mainWindowRef.webContents.send('spawn-fish', payload)`
- Start server after app ready, before/after creating window

### 2. Preload - Expose IPC API (`src/preload/index.ts`, `src/preload/index.d.ts`)
- Update `index.ts`: import `ipcRenderer`, add `api.onSpawnFish(callback)` that subscribes to `'spawn-fish'` event and returns unsubscribe function
- Update `index.d.ts`: type `SpawnFishPayload = { fishType: string | number, scale?: number | string }`, update `Window.api` type

### 3. Renderer - Handle Socket Spawns (`src/renderer/src/main.ts`)
- Add reference to access scene instance globally or store in class property for external calls
- Add method/helper to spawn fish from payload:
  ```typescript
  private spawnFishFromPayload(payload: {fishType: string|number, scale?: number|string}) {
    // resolve fishType to EnumFishTypes value
    // parse scale (0-5), default 0
    // create Fish at spawn position (e.g., 200, 400 or random near top)
    // add to group
  }
  ```
- Resolve fish type:
  - If number and in valid range [0,6], use directly
  - If string, try case-insensitive match against enum keys: look up `EnumFishTypes[fishTypeName.toUpperCase()]`
  - Fallback to CLOWNFISH if invalid
- Parse scale: convert to number, clamp to 0-5 range (integers). If NaN or undefined, use 0
- Subscribe to socket events in `create()`: `window.api?.onSpawnFish?.((p) => this.spawnFishFromPayload(p))`
- Maybe also make the spawn method accessible for easier testing

### 4. Lua Client Script (`tools/spawn_fish_client.lua`)
Create a standalone Lua script using LuaSocket:
```lua
local socket = require("socket")
local host = arg[1] or "127.0.0.1"
local port = tonumber(arg[2]) or 7777
local fish_type = arg[3] or "CLOWNFISH"
local scale = arg[4] or "0"

local client = assert(socket.tcp())
assert(client:connect(host, port))
client:send(fish_type .. " " .. scale .. "\n")
client:close()
print("Sent spawn command")
```
Also provide usage instructions in a README or comments. Document dependency: `luarocks install luasocket` or system package.

### 5. Additional Considerations
- Use loopback only (127.0.0.1) - already planned
- Handle multiple clients connecting
- Graceful error handling
- Scale is 0-5 as requested (Fish accepts 0 for random behavior; we pass through as-is)
- Fish types must match those in EnumFishTypes

## Files to Create/Modify

**Modify:**
1. `src/main/index.ts` - add socket server
2. `src/preload/index.ts` - add IPC API
3. `src/preload/index.d.ts` - add types
4. `src/renderer/src/main.ts` - handle socket spawns

**Create:**
1. `tools/spawn_fish_client.lua` - Lua client script
2. `tools/README.md` or update docs with usage instructions (optional but helpful)

## Testing Plan
1. Start the app with `npm run dev`
2. In another terminal, run Lua client: `lua tools/spawn_fish_client.lua CLOWNFISH 3`
3. Verify fish spawns in game with correct type and scale
4. Test different formats (JSON, different cases, numeric indices)

## Implementation Notes
- In the renderer, we need access to `MainScene` instance to call spawn method. Can store `let mainScene: MainScene | null = null` and assign in constructor/create, or use `scene` manager.
- Alternatively, make spawn logic a module-level function or attach to window for debugging.
