const fs = require('fs');
const path = require('path');

/**
 * @param {string} dirname - path to task directory, ex 0-module/1-task
 * @return {string} path to real task directory depending on ENV
 */
function getTaskDir(dirname) {
  return process.env.TASK_DEV ? path.join(dirname, 'src') : dirname;
}

/**
 * @param dirname - path to task directory (for ex. 0-module/1-task)
 * @param filename
 * @return {string} - path to file in task directory depending on ENV
 */
function getTaskFile(dirname, filename) {
  return path.join(getTaskDir(dirname), filename);
}

/**
 * Discovers all tasks in taskbook required vue-serve for development.
 *
 * @param {string} rootDir - path to taskbook root
 * @return {Object<task,module>[]} - array of objects with module and task numbers
 */
function discoverVueServeTasksDirs(rootDir = __dirname) {
  const isDir = (filepath) => fs.lstatSync(filepath).isDirectory();
  const getSubDirs = (dir) =>
    fs.readdirSync(dir).filter((name) => isDir(path.join(dir, name)));
  const getDirNum = (dirname) => dirname.split('-')[0];

  return getSubDirs(rootDir)
    .filter((dirname) => dirname.endsWith('-module'))
    .map((dirname) => ({
      dirname,
      path: path.join(rootDir, dirname),
    }))
    .flatMap((moduleDir) =>
      getSubDirs(moduleDir.path)
        .filter((dirname) => dirname.endsWith('-task'))
        .map((dirname) => ({
          dirname,
          path: path.join(moduleDir.path, dirname),
        }))
        .filter((dir) => fs.existsSync(getTaskFile(dir.path, 'App.vue')))
        .map((taskDir) => ({
          module: getDirNum(moduleDir.dirname),
          task: getDirNum(taskDir.dirname),
        })),
    );
}

/**
 * Generates pages config for vue-cli-service depends on task.
 * Each page serves main.js on path /M-module-T-task.
 *
 * @param taskList - array of objects with module and task numbers
 * @return {Object} pages config for vue.config.js
 */
function generatePagesConfig(taskList) {
  return taskList.reduce((pages, { module, task }) => {
    pages[`${module}-module-${task}-task`] = {
      entry: getTaskFile(`./${module}-module/${task}-task`, 'main.js'),
      template: getTaskFile(`./${module}-module/${task}-task`, 'index.html'),
    };
    return pages;
  }, {});
}

module.exports = {
  pages: generatePagesConfig(discoverVueServeTasksDirs(__dirname)),
};
