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
    task.debug('tsc exited with error: ' + result.error);
    task.debug('tsc exited with stderror: ' + result.stderr);
    task.debug('tsc exited with stdout: ' + result.stdout);
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
        let cwd = task.getPathInput('cwd', false, false);
        //cwd = path.join(__dirname, 'examples');
        task.debug('cwd=' + cwd);

        let tsc = path.join(__dirname, '/node_modules/typescript/lib/tsc.js');
        task.debug('tsc=' + tsc);

        if (!task.exist(tsc)) {
            console.log('Starting TypeScript installation...');

            let result = installTypeScript(__dirname);
            task.debug('npm install typescript exited with code: ' + result.code);

            if (result.code === 0) {
                if (task.exist(tsc)) {
                    console.log('TypeScript installation completed');
                    startCompilation(tsc, cwd);
                }
                else {
                    task.debug('tsc not found after installation');
                    throw new Error('TypeScript installation failed. Try to manually install TypeScript on the agent.');
                }
            }
            else {
                task.debug('typescript installation failed');
                throw new Error('TypeScript installation failed. Try to manually install TypeScript on the agent.');
            }
        }
        else {
            startCompilation(tsc, cwd);
        }

        task.setResult(task.TaskResult.Succeeded, 'TypeScript compiler completed successfully');
    }
    catch (error) {
        task.setResult(task.TaskResult.Failed, error.message);
    }
}

run();