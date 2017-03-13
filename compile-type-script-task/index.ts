import * as task from 'vsts-task-lib/task';
import * as path from 'path';

function installTypeScript(taskPath: string) {
    let npm = task.tool(task.which('npm', true));
    npm.arg('install').arg('--prefix').arg(taskPath).arg('typescript');
    return npm.execSync();
}

function startCompilation(tsc: string, projectPath: string) {
    console.log('Starting compilation...');
    let result = compile(tsc, projectPath);
    task.debug('tsc exited with code: ' + result.code);
    if (result.error) {
        task.debug('tsc exited with error: ' + result.error);
    }
    if (result.code === 0) {
        console.log('Compilation completed');
    }
    else {
        throw new Error('Compilation failed');
    }
}

function compile(tsc: string, projectPath: string) {
    let compiler = task.tool(task.which('node', true));
    compiler.arg(tsc).arg('-p').arg(projectPath);
    return compiler.execSync();
}

async function run() {
    try {
        let compileType = task.getInput('compileType', true);
        let projectPath = task.getPathInput('projectPath', false, false);

        if (!task.exist(projectPath)){
            throw new Error('Project path \'' + projectPath + '\' does not exist');
        }

        let stats = task.stats(projectPath);
        if (stats.isDirectory()){
            if (!task.exist(path.join(projectPath, 'tsconfig.json'))){
                throw new Error('Project path \'' + projectPath + '\' does not contain a tsconfig.json file');
            }
        }
        if (stats.isFile()){
            if (!(path.basename(projectPath) === 'tsconfig.json')){
                throw new Error('Project path \'' + projectPath + '\' is not a tsconfig.json file');
            }
        }

        let tsc = path.join(__dirname, '/node_modules/typescript/lib/tsc.js');
        task.debug('tsc=' + tsc);

        console.log('Starting TypeScript installation...');

        let result = installTypeScript(__dirname);
        task.debug('npm install typescript exited with code: ' + result.code);

        if (result.code === 0) {
            if (task.exist(tsc)) {
                console.log('TypeScript installation completed');
                startCompilation(tsc, projectPath);
            }
            else {
                task.debug('tsc not found after installation');
                throw new Error('TypeScript installation failed');
            }
        }
        else {
            task.debug('typescript installation failed');
            throw new Error('TypeScript installation failed');
        }

        task.setResult(task.TaskResult.Succeeded, 'TypeScript compiler completed successfully');
    }
    catch (error) {
        task.setResult(task.TaskResult.Failed, error.message);
    }
}

run();