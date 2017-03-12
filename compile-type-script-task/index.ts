import * as task from 'vsts-task-lib/task';
import * as path from 'path';

function installTypeScript() {
    let npm = task.tool(task.which('npm', true));
    npm.arg('install').arg('--prefix').arg('compile-type-script-task').arg('typescript');
    return npm.execSync();
}

function startCompilation(tsc) {
    console.log('Starting compilation...');
    let result = compile(tsc);
    task.debug('tsc exited with code: ' + result.code);
    if (result.code === 0) {
        console.log('Compilation completed');
    }
    else {
        throw new Error('Compilation failed');
    }
}

function compile(tsc) {
    let compiler = task.tool(tsc);
    return compiler.execSync();
}

async function run() {
    try {
        let cwd = task.getPathInput('cwd', false, false);
        task.debug('cwd=' + cwd);

        let tsc = path.join(__dirname, 'node_modules/typescript/bin/tsc');
        task.debug('tsc=' + tsc);

        task.cd(cwd);

        if (!task.exist(tsc)) {
            console.log('Starting TypeScript installation...');

            let result = installTypeScript();
            task.debug('npm install typescript exited with code: ' + result.code);

            if (result.code === 0) {
                if (task.exist(tsc)){
                    console.log('TypeScript installation completed');
                    startCompilation(tsc);
                }
                else{
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
            startCompilation(tsc);
        }

        task.setResult(task.TaskResult.Succeeded, 'TypeScript compiler completed successfully');
    }
    catch (error) {
        task.setResult(task.TaskResult.Failed, error.message);
    }
}

run();