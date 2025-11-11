import * as vscode from 'vscode';

export class Logger {
    private static outputChannel: vscode.OutputChannel;

    static initialize(channelName: string = 'Task Master'): void {
        if (!Logger.outputChannel) {
            Logger.outputChannel = vscode.window.createOutputChannel(channelName);
        }
    }

    static log(message: string, ...args: unknown[]): void {
        const timestamp = new Date().toISOString();
        const formattedMessage = `[${timestamp}] ${message}`;
        
        console.log(formattedMessage, ...args);
        Logger.outputChannel?.appendLine(formattedMessage);
        
        if (args.length > 0) {
            Logger.outputChannel?.appendLine(JSON.stringify(args, null, 2));
        }
    }

    static error(message: string, error?: unknown): void {
        const timestamp = new Date().toISOString();
        const formattedMessage = `[${timestamp}] ERROR: ${message}`;
        
        console.error(formattedMessage, error);
        Logger.outputChannel?.appendLine(formattedMessage);
        
        if (error) {
            const err = error as Error;
            Logger.outputChannel?.appendLine(err.toString());
            if (err.stack) {
                Logger.outputChannel?.appendLine(err.stack);
            }
        }
    }

    static warn(message: string, ...args: unknown[]): void {
        const timestamp = new Date().toISOString();
        const formattedMessage = `[${timestamp}] WARN: ${message}`;
        
        console.warn(formattedMessage, ...args);
        Logger.outputChannel?.appendLine(formattedMessage);
        
        if (args.length > 0) {
            Logger.outputChannel?.appendLine(JSON.stringify(args, null, 2));
        }
    }

    static show(): void {
        Logger.outputChannel?.show();
    }

    static dispose(): void {
        Logger.outputChannel?.dispose();
    }
}