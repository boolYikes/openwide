import * as vscode from 'vscode';
import { exec } from 'child_process';

export function activate(context: vscode.ExtensionContext) {

	let disposable = vscode.commands.registerCommand('openwide.gitSign', async () => {
		const terminal = vscode.window.activeTerminal;

		if (!terminal) {
			vscode.window.showErrorMessage('No active terminal found');
			return ;
		}

		let commitMessage = await vscode.window.showInputBox({
			placeHolder: 'Enter your message or leave it be.',
			prompt: 'Commit message'
		});
		commitMessage = (commitMessage + '').replace('undefined', '').replace(/"/g, '\\"');
		const wasTerminalVisible = vscode.window.terminals.length > 0;

		vscode.commands.executeCommand('workbench.action.terminal.focus');
		vscode.commands.executeCommand('workbench.action.toggleMaximizedPanel');

		runGitWithSign(commitMessage)
			.then(() => {
				if (!wasTerminalVisible) {
					vscode.commands.executeCommand('workbench.action.closePanel');
				} else {
					vscode.commands.executeCommand('workbench.action.toggleMaximizedPanel');
				}
			})
			.catch((err) => {
				vscode.window.showErrorMessage(`Git commit failed: ${err}`);
			});
	});

	context.subscriptions.push(disposable);
}

export function deactivate() {}

function runGitWithSign(commitMessage: string): Promise<void> {
	return new Promise((resolve, reject) => {
		const command = `git commit -S -m "${commitMessage}"`;

		const gitProcess = exec(command, (error, stdout, stderr) => {
			if (error) {
				reject(error.message);
				return;
			}
			if (stderr) {
				reject(stderr);
				return;
			}
			resolve();
		});

		gitProcess.stdout?.on('data', (data) => {
			vscode.window.activeTerminal?.sendText(data, true);
		});
		gitProcess.stderr?.on('data', (data) => {
			vscode.window.activeTerminal?.sendText(data, true);
		});
	});
}
