# Tools

## spawn_fish_client.lua

Lua client to spawn fish in the game via TCP socket.

### Requirements
- Lua with [LuaSocket](https://github.com/lunarmodules/luasocket)

Install options:
```bash
# Using luarocks
luarocks install luasocket

# Debian/Ubuntu
sudo apt install lua-socket

# Arch
sudo pacman -S lua-socket
```

### Usage
Make sure the game is running (`npm run dev`) - it starts a socket server on `127.0.0.1:7777`.

```bash
# Basic usage
lua tools/spawn_fish_client.lua [host] [port] [fishType] [scale]

# Examples
lua tools/spawn_fish_client.lua 127.0.0.1 7777 CLOWNFISH 3
lua tools/spawn_fish_client.lua 127.0.0.1 7777 SALMON 1
lua tools/spawn_fish_client.lua 127.0.0.1 7777 BASA 0
lua tools/spawn_fish_client.lua 127.0.0.1 7777 FIGHTERFISH 5
```

### Fish types
Available fish types (from `src/renderer/src/classes/EnumFishTypes.ts`):
- `CLOWNFISH`
- `BLUETANG`
- `SALMON`
- `BASA`
- `FIGHTERFISH`
- `POMFRET`
- `TAUTOG`

### Scale
Scale should be between `0` and `5`. Use `0` for random scale (same behavior as the game's UI).

### Alternative formats
You can also send JSON or pipe data:
```bash
echo '{"fishType":"POMFRET","scale":2}' | lua tools/spawn_fish_client.lua
printf "TAUTOG 4\n" | lua tools/spawn_fish_client.lua
```
