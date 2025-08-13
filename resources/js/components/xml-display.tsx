import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';
import xmlFormatter from 'xml-formatter';

interface XmlDisplayProps {
    xml: string;
    className?: string;
}

export function XmlDisplay({ xml, className = '' }: XmlDisplayProps) {
    // Use the xml-formatter library for proper XML formatting
    const formatXml = (xmlString: string): string => {
        try {
            // First clean out actual newline characters from the content
            const cleanedXml = xmlString.replace(/\n/g, ' ');

            return xmlFormatter(cleanedXml, {
                indentation: '  ',
                collapseContent: true,
                lineSeparator: '\n',
            });
        } catch (error) {
            // Fallback to basic formatting if the library fails
            console.warn('XML formatting failed, using fallback:', error);
            return xmlString;
        }
    };

    const formattedXml = formatXml(xml);

    return (
        <div className={className}>
            <SyntaxHighlighter
                language="xml"
                style={tomorrow}
                customStyle={{
                    fontFamily: 'JetBrains Mono, Monaco, Menlo, monospace',
                    fontSize: '0.875rem',
                    lineHeight: '1.6',
                    background: 'hsl(var(--muted))',
                    borderRadius: '0.375rem',
                    padding: '1.5rem',
                    margin: 0,
                    border: '1px solid hsl(var(--border))',
                }}
            >
                {formattedXml}
            </SyntaxHighlighter>
        </div>
    );
}
