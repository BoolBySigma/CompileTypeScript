import * as task from 'vsts-task-lib/task';
import * as path from 'path';

async function run() {
    try {
        let compileType = task.getInput('compileType', true);
        let typeScriptVersion = task.getInput('typeScriptVersion');
        let projectPath = task.getPathInput('projectPath', false, false);
        let filesPath = task.getPathInput('filesPath', false);
        let files = task.getDelimitedInput('files', ' ', false);

        if (compileType === '1') {
            task.debug('compileType=project');

            task.debug('ensure project path exist');
            if (!task.exist(projectPath)) {
                throw new Error('Project path \'' + projectPath + '\' does not exist');
            }

            let stats = task.stats(projectPath);
            if (stats.isDirectory()) {
                task.debug('ensure project path contains tsconfig.json file');
                if (!task.exist(path.join(projectPath, 'tsconfig.json'))) {
                    throw new Error('Project path \'' + projectPath + '\' does not contain a tsconfig.json file');
                }
            }
            if (stats.isFile()) {
                task.debug('ensure project file is a tsconfig.json file');
                if (!(path.basename(projectPath) === 'tsconfig.json')) {
                    throw new Error('Project path \'' + projectPath + '\' is not a tsconfig.json file');
                }
            }
        }
        else {
            task.debug('compileType=files');

            task.debug('ensure files path exist');
            if (!task.exist(filesPath)) {
                throw new Error('Files path \'' + filesPath + '\' does not exist');
            }

            let stats = task.stats(filesPath);
            if (stats.isFile()) {
                task.debug('files path is absolute path to file');
                task.debug('using file directory as files path');
                filesPath = path.dirname(filesPath);
            }

            task.debug('files:');
            files.forEach((file, index, files) => {
                files[index] = path.join(filesPath, file);
                task.debug(files[index]);
            });
        }

        let tsc = path.join(__dirname, '/node_modules/typescript/lib/tsc.js');
        task.debug('tsc=' + tsc);

        console.log('Starting TypeScript installation...');

        let result = installTypeScript(__dirname, typeScriptVersion);
        task.debug('npm install typescript exited with code: ' + result.code);

        if (result.code === 0) {
            if (task.exist(tsc)) {
                console.log('TypeScript installation completed');
                console.log('Starting compilation...');
                if (compileType === '1'){
                    compileProject(tsc, projectPath);
                }
                else{
                    compileFiles(tsc, filesPath, files);
                }
                console.log('Compilation completed');
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

function installTypeScript(taskPath: string, typeScriptVersion: string) {
    task.debug('function=installTypeScript');

    let npm = task.tool(task.which('npm', true));
    npm.arg('install').arg('--prefix').arg(taskPath).arg('typescript' + (typeScriptVersion ? '@' + typeScriptVersion : ''));
    return npm.execSync();
}

function compileProject(tsc: string, path: string){
    task.debug('function=compileProject');

    let compiler = task.tool(task.which('node', true));
    compiler.arg(tsc).arg('-p').arg(path);
    let result = compiler.execSync();

    task.debug('tsc exited with code: ' + result.code);
    if (result.error) {
        task.debug('tsc exited with error: ' + result.error);
    }
    if (result.code === 1) {
        throw new Error('Compilation of project failed');
    }
}

function compileFiles(tsc: string, filesPath: string, files: string[]){
    task.debug('function=compileFiles');

    let compiler = task.tool(task.which('node', true));
    compiler.arg(tsc);
    files.forEach(file => {
        compiler.arg(file);
    });
    let result = compiler.execSync();

    task.debug('tsc exited with code: ' + result.code);
    if (result.error) {
        task.debug('tsc exited with error: ' + result.error);
    }
    if (result.code === 1) {
        throw new Error('Compilation of files failed');
    }
}

run();
