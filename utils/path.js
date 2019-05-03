const path = require('path');

// process.mainModule.filename(basically is a path to the root file)
// process is a global module(NodeJS process)
// app running root(file/module). in this case app.js
// filename of this root(file/module)

// dirname() returns the directory name of a path
// return the path to the current folder it was called in
module.exports = path.dirname(process.mainModule.filename);