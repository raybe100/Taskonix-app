import React, { useState, useRef } from 'react';
import { Task } from '../types';
import { 
  exportTasksAsJSON, 
  exportTasksAsCSV, 
  exportTasksAsICal,
  importTasksFromJSON,
  importTasksFromCSV
} from '../lib/exportUtils';

interface ExportImportProps {
  tasks: Task[];
  onImportTasks: (tasks: Task[]) => void;
}

export function ExportImport({ tasks, onImportTasks }: ExportImportProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importFormat, setImportFormat] = useState<'json' | 'csv'>('json');

  const handleExport = async (format: 'json' | 'csv' | 'ical') => {
    if (tasks.length === 0) {
      alert('No tasks to export!');
      return;
    }

    setIsExporting(true);
    try {
      switch (format) {
        case 'json':
          exportTasksAsJSON(tasks);
          break;
        case 'csv':
          exportTasksAsCSV(tasks);
          break;
        case 'ical':
          exportTasksAsICal(tasks);
          break;
      }
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportError(null);

    try {
      let importedTasks: Task[];
      
      if (importFormat === 'json') {
        importedTasks = await importTasksFromJSON(file);
      } else {
        importedTasks = await importTasksFromCSV(file);
      }

      if (importedTasks.length === 0) {
        throw new Error('No valid tasks found in the file');
      }

      const shouldReplace = window.confirm(
        `Found ${importedTasks.length} tasks to import. This will add them to your existing tasks. Continue?`
      );

      if (shouldReplace) {
        onImportTasks(importedTasks);
        alert(`Successfully imported ${importedTasks.length} tasks!`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Import failed';
      setImportError(message);
      console.error('Import failed:', error);
    } finally {
      setIsImporting(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="card-elevated p-6 animate-scale-in">
      <h3 className="text-title-large font-medium text-on-surface mb-6 flex items-center gap-2">
        <span className="text-2xl">📤</span>
        Export / Import Tasks
      </h3>

      {/* Export Section */}
      <div className="space-y-4 mb-8">
        <h4 className="text-title-medium font-medium text-on-surface">Export Tasks</h4>
        <p className="text-body-medium text-on-surface-variant">
          Export your tasks to backup or use in other applications.
        </p>
        
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => handleExport('json')}
            disabled={isExporting || tasks.length === 0}
            className="btn-outlined flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            📄 JSON ({tasks.length} tasks)
          </button>
          
          <button
            onClick={() => handleExport('csv')}
            disabled={isExporting || tasks.length === 0}
            className="btn-outlined flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            📊 CSV Spreadsheet
          </button>
          
          <button
            onClick={() => handleExport('ical')}
            disabled={isExporting || tasks.filter(t => t.start).length === 0}
            className="btn-outlined flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            📅 iCal ({tasks.filter(t => t.start).length} scheduled)
          </button>
        </div>

        {isExporting && (
          <div className="flex items-center gap-2 text-primary-40">
            <div className="w-4 h-4 border-2 border-primary-40 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-body-small">Exporting...</span>
          </div>
        )}
      </div>

      {/* Import Section */}
      <div className="space-y-4 border-t border-outline-variant/20 pt-6">
        <h4 className="text-title-medium font-medium text-on-surface">Import Tasks</h4>
        <p className="text-body-medium text-on-surface-variant">
          Import tasks from a JSON or CSV file. New tasks will be added to your existing ones.
        </p>

        <div className="flex items-center gap-4 mb-4">
          <span className="text-body-medium text-on-surface">Import format:</span>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                value="json"
                checked={importFormat === 'json'}
                onChange={(e) => setImportFormat(e.target.value as 'json')}
                className="text-primary-40"
              />
              <span className="text-body-medium">JSON</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                value="csv"
                checked={importFormat === 'csv'}
                onChange={(e) => setImportFormat(e.target.value as 'csv')}
                className="text-primary-40"
              />
              <span className="text-body-medium">CSV</span>
            </label>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleImportClick}
            disabled={isImporting}
            className="btn-filled flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            📥 Choose File to Import
          </button>
          
          {isImporting && (
            <div className="flex items-center gap-2 text-primary-40">
              <div className="w-4 h-4 border-2 border-primary-40 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-body-small">Importing...</span>
            </div>
          )}
        </div>

        {importError && (
          <div className="p-3 rounded-lg bg-error-40/10 border border-error-40/20 text-error-40 text-body-small">
            <strong>Import Error:</strong> {importError}
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept={importFormat === 'json' ? '.json' : '.csv'}
          onChange={handleFileChange}
          className="hidden"
        />

        <div className="text-body-small text-on-surface-variant">
          <strong>Tips:</strong>
          <ul className="list-disc list-inside mt-1 space-y-1">
            <li>JSON files preserve all task data including categories and descriptions</li>
            <li>CSV files should have columns: Title, Priority, Category, Start Date, Duration, Description, Created At</li>
            <li>Importing will add tasks to your existing ones (won't replace)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}