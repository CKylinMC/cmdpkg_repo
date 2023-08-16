const fs = require('fs');
const path = require('path');
const AdmZip = require("adm-zip");
const md5File = require('md5-file');

function refreshPkg(pkg) {
    if (!pkg.name) {
        console.log('Invalid package name:', index);
        return false;
    }
    pkg.name = pkg.name.toLowerCase();
    if (!pkg.path) {
        console.log('Invalid package path:', index, pkg.name);
        return false;
    }
    let pkgPath = path.join(__dirname, 'pkgs', pkg.path);
    let stat = fs.statSync(pkgPath);
    if (!stat.isFile()) {
        console.log('Missing package file:', index, pkg.name);
        return false;
    }
    let size = Math.round(stat.size/10)/100+' KB';
    let md5 = md5File.sync(pkgPath);
    pkg.size = size;
    pkg.md5 = md5;
    return pkg
}

let found = [];
let added = [];
let deleted = [];

let currentList = require("./list.json");
const allsubdirs = fs.readdirSync("pkgs");

for (const dirname of allsubdirs) {
    let subpath = path.join(".", "pkgs", dirname);
    let pkgs = fs.readdirSync(subpath);
    for (let pkgname of pkgs) {
        let pkgpath = `${dirname}/${pkgname}`;
        if (!currentList.pkgs.find(x => x.path === pkgpath)) {
            added.push({ path: pkgpath, pkgname });
        } else {
            found.push({ path: pkgpath });
        }
    }
}
let currentPkgs = [...currentList.pkgs];
for (const pkg of currentPkgs) {
    if (!found.find(x => x.path === pkg.path)) {
        deleted.push(pkg);
    }
}
currentList.pkgs = currentList.pkgs.filter(pkg => !deleted.find(p => p.path === pkg.path));
const temp = ".temp";
if (fs.existsSync(temp)) {
    fs.rmSync(temp, { recursive: true });
}
for (const addpkg of added) {
    fs.mkdirSync(temp);
    let filename = addpkg.pkgname;
    let filepath = path.join(temp, filename);
    let zipname = filename + ".zip";
    let zippath = path.join(temp, zipname);
    fs.copyFileSync(path.join('pkgs', addpkg.path), filepath);
    fs.renameSync(filepath, zippath);
    const zip = new AdmZip(zippath);
    const zipFiles = [...zip.getEntries()].map(entry => ({
        entryName: entry.entryName,
        name: entry.name,
        isDirectory: entry.isDirectory,
        getData: entry.getData
    }));
    const metadataFile = zipFiles.find(entry => entry.name === "metadata.json");
    const metadata = metadataFile ? JSON.parse(metadataFile.getData()) : {};
    const newPkg = {
        name: metadata.name,
        fullname: metadata.fullname ?? metadata.name,
        author: metadata.author,
        path: addpkg.path,
        description: metadata.description
    };
    const refreshed = refreshPkg(newPkg);
    if (!refreshed) {
        console.error("Could not refresh", newPkg.path);
        continue;
    }
    currentList.pkgs.push(refreshed);
    if (fs.existsSync(temp)) {
        fs.rmSync(temp, { recursive: true });
    }
}

console.log("Found\t", found.length, "\tpackages.");
console.log("Added\t", added.length, "\tpackages.");
console.log("Deleted\t", deleted.length, "\tpackages.");

fs.writeFileSync("./list.json", JSON.stringify(currentList, null, 4));
