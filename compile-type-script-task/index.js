"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const task = require("vsts-task-lib/task");
function installTypeScript() {
    let npm = task.tool(task.which('npm', true));
    npm.arg('install').arg('-g').line('typescript');
    return npm.execSync();
}
function startCompilation(tsc) {
    console.log('Starting compilation...');
    let result = compile(tsc);
    if (result.code === 0) {
        console.log('Compilation completed');
    }
    else {
        task.error(result.error.message);
        throw new Error('Compilation failed');
    }
}
function compile(tsc) {
    let compiler = task.tool(tsc);
    return compiler.execSync();
}
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let cwd = task.getPathInput('cwd', false, false);
            task.cd(cwd);
            let tsc = task.which('tsc', false);
            if (!task.exist(tsc)) {
                task.debug('tsc not installed');
                task.debug('installing typescript');
                task.warning('TypeScript is not installed');
                console.log('Starting TypeScript installation...');
                let installResult = installTypeScript();
                if (installResult.code === 0) {
                    task.debug('typescript installation completed');
                    try {
                        tsc = task.which('tsc', true);
                        console.log('TypeScript installation completed');
                        startCompilation(tsc);
                    }
                    catch (installError) {
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
    });
}
run();
