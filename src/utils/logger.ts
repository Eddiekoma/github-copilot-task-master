import * as vscode from 'vscode';

export class Logger {
    private static outputChannel: vscode.OutputChannel;

    static initialize(channelName: string = 'Task Master'): void {
        if (!Logger.outputChannel) {
            Logger.outputChannel = vscode.window.createOutputChannel(channelName);
        }
    }

    static log(message: string, ...args: any[]): void {
        const timestamp = new Date().toISOString();
        const formattedMessage = `[${timestamp}] ${message}`;
        
        console.log(formattedMessage, ...args);
        Logger.outputChannel?.appendLine(formattedMessage);
        
        if (args.length > 0) {
            Logger.outputChannel?.appendLine(JSON.stringify(args, null, 2));
        }
    }

    static error(message: string, error?: any): void {
        const timestamp = new Date().toISOString();
        const formattedMessage = `[${timestamp}] ERROR: ${message}`;
        
        console.error(formattedMessage, error);
        Logger.outputChannel?.appendLine(formattedMessage);
        
        if (error) {
            Logger.outputChannel?.appendLine(error.toString());
            if (error.stack) {
                Logger.outputChannel?.appendLine(error.stack);
            }
        }
    }

    static warn(message: string, ...args: any[]): void {
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