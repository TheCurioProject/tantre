const fs = require("fs");
const b = require("./src/lib/generated/brand.json");
fs.writeFileSync("dot-idle.txt", b["state-menu-dot-idle"] ? b["state-menu-dot-idle"].content : "NOT FOUND");
