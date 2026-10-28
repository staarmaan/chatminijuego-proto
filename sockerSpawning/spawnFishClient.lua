-- Lua client to spawn fishes in the chatminijuego-proto game via sockets
-- Requires LuaSocket (luasocket). Install with: luarocks install luasocket
-- Or on some systems: apt install lua-socket
--
-- Usage:
--   lua spawn_fish_client.lua [host] [port] [fishType] [scale]
-- Examples:
--   lua spawn_fish_client.lua 127.0.0.1 7777 CLOWNFISH 3
--   lua spawn_fish_client.lua 127.0.0.1 7777 SALMON 1
--   lua spawn_fish_client.lua 127.0.0.1 7777 BASA 0
--   echo '{"fishType":"FIGHTERFISH","scale":4}' | lua spawn_fish_client.lua

local socket = require("socket")

local host = arg[1] or "127.0.0.1"
local port = tonumber(arg[2]) or 7777
local fish_type = arg[3]
local scale = arg[4]

local client = socket.tcp()
if not client then
  print("Failed to create socket")
  os.exit(1)
end

local ok, err = client:connect(host, port)
if not ok then
  print("Failed to connect to " .. host .. ":" .. port)
  print("Error: " .. tostring(err))
  os.exit(1)
end

client:settimeout(2)

local msg = nil
if fish_type and scale then
  msg = fish_type .. " " .. scale
elseif fish_type and not scale then
  msg = fish_type
else
  -- Try to read from stdin
  local input = io.read("*a")
  if input and input ~= "" then
    msg = input:gsub("\n", " "):gsub("\r", " ")
  else
    msg = "CLOWNFISH 0"
  end
end

client:send(msg .. "\n")
client:close()
print("Sent: " .. msg)
