import fs from "fs";
const file = "src/styles/admin.css";
let css = fs.readFileSync(file, "utf8");
const marker = "/* --- COFFEE OS ADAPTED --- */";
const parts = css.split(marker);
if (parts.length === 2) {
    let coffee = parts[1];
    let rootRules = "";
    coffee = coffee.replace(/:root\{[^}]+\}/g, match => {
        rootRules += match + "\n";
        return "";
    });
    coffee = `\n${rootRules}\n#admin-root {\n${coffee}\n}`;
    fs.writeFileSync(file, parts[0] + marker + coffee);
    console.log("Successfully wrapped coffee os css");
} else {
    console.log("Could not find marker or already wrapped");
}
