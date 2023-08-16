const md5File = require('md5-file');
const fs = require('fs');
const path = require('path');
const list = require('./list.json');
const pkgs = list.pkgs;

let index = -1;
let listName = [];
let listPath = [];
let error = false;
for (let pkg of pkgs) {
    index++;
    if (!pkg.name) {
        console.log('Invalid package name:', index);
        error = true;
        continue;
    }
    pkg.name = pkg.name.toLowerCase();
    if (!pkg.path) {
        console.log('Invalid package path:', index, pkg.name);
        error = true;
        continue;
    }
    let pkgPath = path.join(__dirname, 'pkgs', pkg.path);
    let stat = fs.statSync(pkgPath);
    if (!stat.isFile()) {
        console.log('Missing package file:', index, pkg.name);
        error = true;
        continue;
    }
    let size = Math.round(stat.size/10)/100+' KB';
    let md5 = md5File.sync(pkgPath);
    pkg.size = size;
    pkg.md5 = md5;
    pkg.fullname = pkg.fullname || pkg.name;
    pkg.description = pkg.description || "No description";
    pkg.author = pkg.author || "Anonymous";
    if (listName.includes(pkg.name)) {
        console.log('Duplicate package name:', index, pkg.name);
        error = true;
    }
    if (listPath.includes(pkg.path)) {
        console.log('Duplicate package path:', index, pkg.name);
        error = true;
    }
    listName.push(pkg.name.toLowerCase());
    listPath.push(pkg.path);
}

fs.writeFileSync(path.join(__dirname, 'list.json'), JSON.stringify(list, null, 2));

if (error) throw new Error("Error in package list");
else console.log(`${index + 1} package(s) refreshed`);

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
