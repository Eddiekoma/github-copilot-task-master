import * as vscode from 'vscode';
import { TaskMetrics } from '../tasks/taskTracking';

export class ProgressDashboard {
    private panel: vscode.WebviewPanel;
    private currentMetrics?: TaskMetrics;

    constructor(panel: vscode.WebviewPanel) {
        this.panel = panel;
        this.setupMessageHandlers();
    }

    /**
     * Sets up message handlers for webview communication
     */
    private setupMessageHandlers(): void {
        this.panel.webview.onDidReceiveMessage(
            message => {
                switch (message.command) {
                    case 'refresh':
                        this.refresh();
                        break;
                    case 'exportReport':
                        this.exportReport();
                        break;
                    case 'showChart':
                        this.showChart(message.chartType);
                        break;
                }
            }
        );
    }

    /**
     * Updates the dashboard with new metrics
     */
    updateMetrics(metrics: TaskMetrics): void {
        this.currentMetrics = metrics;
        
        this.panel.webview.postMessage({
            type: 'updateMetrics',
            metrics: {
                totalTasks: metrics.totalTasks,
                completedTasks: metrics.completedTasks,
                inProgressTasks: metrics.inProgressTasks,
                todoTasks: metrics.todoTasks,
                blockedTasks: metrics.blockedTasks,
                completionRate: metrics.completionRate.toFixed(1),
                totalHours: metrics.totalEstimatedHours.toFixed(1),
                completedHours: metrics.completedHours.toFixed(1),
                remainingHours: metrics.remainingHours.toFixed(1)
            }
        });
    }

    /**
     * Updates a specific chart in the dashboard
     */
    updateChart(chartType: string, data: unknown): void {
        this.panel.webview.postMessage({
            type: 'updateChart',
            chartType,
            data
        });
    }

    /**
     * Shows a specific chart view
     */
    private showChart(chartType: string): void {
        if (!this.currentMetrics) {
            return;
        }

        let chartData: unknown;
        
        switch (chartType) {
            case 'status':
                chartData = {
                    labels: ['Completed', 'In Progress', 'Todo', 'Blocked'],
                    data: [
                        this.currentMetrics.completedTasks,
                        this.currentMetrics.inProgressTasks,
                        this.currentMetrics.todoTasks,
                        this.currentMetrics.blockedTasks
                    ],
                    colors: ['#4caf50', '#2196f3', '#ff9800', '#f44336']
                };
                break;
            
            case 'progress':
                chartData = {
                    labels: ['Completed', 'Remaining'],
                    data: [
                        this.currentMetrics.completedHours,
                        this.currentMetrics.remainingHours
                    ],
                    colors: ['#4caf50', '#e0e0e0']
                };
                break;
            
            case 'burndown':
                // This would typically come from historical data
                chartData = {
                    labels: this.generateDateLabels(7),
                    ideal: this.generateIdealBurndown(this.currentMetrics.totalEstimatedHours, 7),
                    actual: this.generateActualBurndown(this.currentMetrics)
                };
                break;
        }

        this.updateChart(chartType, chartData);
    }

    /**
     * Generates date labels for charts
     */
    private generateDateLabels(days: number): string[] {
        const labels: string[] = [];
        const today = new Date();
        
        for (let i = days - 1; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
        }
        
        return labels;
    }

    /**
     * Generates ideal burndown data
     */
    private generateIdealBurndown(totalHours: number, days: number): number[] {
        const data: number[] = [];
        const hoursPerDay = totalHours / days;
        
        for (let i = 0; i < days; i++) {
            data.push(totalHours - (hoursPerDay * i));
        }
        
        return data;
    }

    /**
     * Generates actual burndown data (simplified)
     */
    private generateActualBurndown(metrics: TaskMetrics): number[] {
        // This is a simplified version - in production, you'd track historical data
        const days = 7;
        const data: number[] = [];
        const totalHours = metrics.totalEstimatedHours;
        const completedHours = metrics.completedHours;
        
        // Generate a simple curve
        for (let i = 0; i < days - 1; i++) {
            const progress = i / (days - 1);
            data.push(totalHours - (completedHours * progress * 0.8));
        }
        data.push(metrics.remainingHours);
        
        return data;
    }

    /**
     * Refreshes the dashboard
     */
    private refresh(): void {
        vscode.commands.executeCommand('taskMaster.refreshDashboard');
    }

    /**
     * Exports a report
     */
    private exportReport(): void {
        if (!this.currentMetrics) {
            vscode.window.showWarningMessage('No metrics available to export');
            return;
        }

        const report = this.generateReport(this.currentMetrics);
        
        // Create a new document with the report
        vscode.workspace.openTextDocument({
            content: report,
            language: 'markdown'
        }).then(doc => {
            vscode.window.showTextDocument(doc);
        });
    }

    /**
     * Generates a markdown report from metrics
     */
    private generateReport(metrics: TaskMetrics): string {
        const date = new Date().toLocaleDateString();
        
        let report = `# Progress Report - ${date}\n\n`;
        report += `## Summary\n\n`;
        report += `- **Total Tasks**: ${metrics.totalTasks}\n`;
        report += `- **Completion Rate**: ${metrics.completionRate.toFixed(1)}%\n`;
        report += `- **Hours Completed**: ${metrics.completedHours.toFixed(1)} / ${metrics.totalEstimatedHours.toFixed(1)}\n\n`;
        
        report += `## Task Distribution\n\n`;
        report += `| Status | Count | Percentage |\n`;
        report += `|--------|-------|------------|\n`;
        report += `| Completed | ${metrics.completedTasks} | ${(metrics.completedTasks / metrics.totalTasks * 100).toFixed(1)}% |\n`;
        report += `| In Progress | ${metrics.inProgressTasks} | ${(metrics.inProgressTasks / metrics.totalTasks * 100).toFixed(1)}% |\n`;
        report += `| Todo | ${metrics.todoTasks} | ${(metrics.todoTasks / metrics.totalTasks * 100).toFixed(1)}% |\n`;
        report += `| Blocked | ${metrics.blockedTasks} | ${(metrics.blockedTasks / metrics.totalTasks * 100).toFixed(1)}% |\n\n`;
        
        if (metrics.averageCompletionTime > 0) {
            const avgDays = metrics.averageCompletionTime / (1000 * 60 * 60 * 24);
            report += `## Performance Metrics\n\n`;
            report += `- **Average Completion Time**: ${avgDays.toFixed(1)} days\n`;
            report += `- **Estimated Time Remaining**: ${(metrics.remainingHours / 8).toFixed(1)} working days\n\n`;
        }
        
        return report;
    }

    /**
     * Shows an alert in the dashboard
     */
    showAlert(type: 'info' | 'warning' | 'error', message: string): void {
        this.panel.webview.postMessage({
            type: 'alert',
            alertType: type,
            message
        });
    }

    /**
     * Updates the dashboard title
     */
    updateTitle(projectName: string): void {
        this.panel.title = `Task Master - ${projectName}`;
    }
}