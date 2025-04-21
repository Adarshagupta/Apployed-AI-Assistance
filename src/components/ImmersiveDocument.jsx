import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

const ImmersiveDocument = ({ content }) => {
  const [activeTab, setActiveTab] = useState({});
  const [copiedId, setCopiedId] = useState(null);

  // Extract immersive content from the response
  const extractImmersiveContent = () => {
    // Updated regex to match the Canvas format with optional spaces and quotes
    const immersiveRegex = /<immersive>\s*id=["']?([^"'\s>]+)["']?\s*type=["']?([^"'\s>]+)["']?\s*title=["']?([^"']+)["']?\s*>([\s\S]*?)<\/immersive>/g;
    const matches = [...content.matchAll(immersiveRegex)];

    if (matches.length === 0) {
      return [];
    }

    return matches.map((match) => {
      const [fullMatch, id, type, title, contentBody] = match;
      let codeContent = contentBody;
      let language = '';
      if (type === 'code') {
        const codeRegex = /```(\w+)\s*([\s\S]*?)```/;
        const codeMatch = contentBody.match(codeRegex);
        if (codeMatch) {
          language = codeMatch[1];
          codeContent = codeMatch[2].trim();
        }
      }
      return {
        id,
        type,
        title,
        content: type === 'code' ? codeContent : contentBody.trim(),
        language: language,
        fullMatch,
      };
    });
  };

  const immersiveDocuments = extractImmersiveContent();

  // If no immersive content is found, render the content as markdown
  if (immersiveDocuments.length === 0) {
    return (
      <div className="immersive-markdown-card">
        <ReactMarkdown
          components={{
            code: ({ node, inline, className, children, ...props }) => {
              const match = /language-(\w+)/.exec(className || '');
              return !inline && match ? (
                <SyntaxHighlighter
                  style={vscDarkPlus}
                  language={match[1]}
                  PreTag="div"
                  {...props}
                >
                  {String(children).replace(/\n$/, '')}
                </SyntaxHighlighter>
              ) : (
                <code className={className} {...props}>
                  {children}
                </code>
              );
            },
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    );
  }

  // Get the non-immersive content (introduction and conclusion)
  const getNonImmersiveContent = () => {
    let nonImmersiveContent = content;
    immersiveDocuments.forEach((doc) => {
      nonImmersiveContent = nonImmersiveContent.replace(doc.fullMatch, '');
    });
    return nonImmersiveContent.trim();
  };

  const nonImmersiveContent = getNonImmersiveContent();

  // Card animation
  const cardAnimation = {
    animation: 'fadeInCard 0.5s',
  };

  return (
    <div className="immersive-document-container">
      {/* Introduction */}
      {nonImmersiveContent && (
        <div className="immersive-markdown-card" style={cardAnimation}>
          <ReactMarkdown>{nonImmersiveContent}</ReactMarkdown>
        </div>
      )}

      {/* Immersive Documents */}
      {immersiveDocuments.map((doc) => (
        <div className="immersive-card" key={doc.id} style={cardAnimation}>
          <div className="immersive-header">
            <div className="immersive-title">
              <span className="document-type">{doc.type === 'code' ? doc.language : 'markdown'}</span>
              {doc.title}
            </div>
            {doc.type === 'code' && (
              <div className="immersive-actions">
                <button
                  onClick={() => setActiveTab((prev) => ({ ...prev, [doc.id]: 'view' }))}
                  className={`immersive-action-button${activeTab[doc.id] !== 'edit' ? ' active' : ''}`}
                >
                  View
                </button>
                <button
                  onClick={() => setActiveTab((prev) => ({ ...prev, [doc.id]: 'edit' }))}
                  className={`immersive-action-button${activeTab[doc.id] === 'edit' ? ' active' : ''}`}
                >
                  Edit
                </button>
                {(doc.language === 'html' || doc.language === 'javascript') && (
                  <button
                    onClick={() => {
                      try {
                        // Create a preview window
                        const previewWindow = window.open('', '_blank');
                        if (!previewWindow) {
                          alert('Please allow popups to see the preview');
                          return;
                        }

                        // Write the HTML content to the preview window
                        previewWindow.document.open();
                        previewWindow.document.write(doc.content);
                        previewWindow.document.close();
                      } catch (error) {
                        console.error('Error running code:', error);
                        alert(`Error running code: ${error.message}`);
                      }
                    }}
                    className="immersive-action-button run"
                  >
                    Run
                  </button>
                )}
                <button
                  onClick={async () => {
                    await navigator.clipboard.writeText(doc.content);
                    setCopiedId(doc.id);
                    setTimeout(() => setCopiedId(null), 1500);
                  }}
                  className="immersive-action-button"
                >
                  {copiedId === doc.id ? 'Copied!' : 'Copy'}
                </button>
              </div>
            )}
          </div>
          <div className="immersive-content">
            {doc.type === 'text/markdown' ? (
              <ReactMarkdown
                components={{
                  code: ({ node, inline, className, children, ...props }) => {
                    const match = /language-(\w+)/.exec(className || '');
                    return !inline && match ? (
                      <SyntaxHighlighter
                        style={vscDarkPlus}
                        language={match[1]}
                        PreTag="div"
                        {...props}
                      >
                        {String(children).replace(/\n$/, '')}
                      </SyntaxHighlighter>
                    ) : (
                      <code className={className} {...props}>
                        {children}
                      </code>
                    );
                  },
                }}
              >
                {doc.content}
              </ReactMarkdown>
            ) : doc.type === 'code' ? (
              activeTab[doc.id] === 'edit' ? (
                <textarea
                  className="immersive-code-edit"
                  defaultValue={doc.content}
                  spellCheck={false}
                />
              ) : (
                <SyntaxHighlighter
                  style={vscDarkPlus}
                  language={doc.language}
                  showLineNumbers
                  customStyle={{ borderRadius: '8px', fontSize: '15px', padding: '18px' }}
                >
                  {doc.content}
                </SyntaxHighlighter>
              )
            ) : (
              <div>{doc.content}</div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ImmersiveDocument;
