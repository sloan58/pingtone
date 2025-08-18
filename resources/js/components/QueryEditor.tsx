import { sql } from '@codemirror/lang-sql';
import { oneDark } from '@codemirror/theme-one-dark';
import CodeMirror from '@uiw/react-codemirror';
import React from 'react';

interface QueryEditorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
}

const QueryEditor: React.FC<QueryEditorProps> = ({ value, onChange, placeholder }) => {
    return (
        <div className="border rounded-md overflow-hidden min-h-[200px]">
            <CodeMirror
                value={value}
                height="200px"
                minHeight="200px"
                maxHeight="400px"
                theme={oneDark}
                extensions={[sql()]}
                basicSetup={{ 
                    lineNumbers: true, 
                    lineWrapping: true,
                    searchKeymap: true,
                    foldGutter: true,
                    dropCursor: false,
                    allowMultipleSelections: false,
                    indentOnInput: true,
                    bracketMatching: true,
                    closeBrackets: true,
                    autocompletion: true,
                    highlightSelectionMatches: false,
                }}
                placeholder={placeholder || 'Enter your SQL query here...'}
                onChange={(val) => onChange(val)}
                className="text-sm"
            />
        </div>
    );
};

export default QueryEditor;
