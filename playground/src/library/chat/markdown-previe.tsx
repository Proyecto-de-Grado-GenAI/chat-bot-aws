import React from "react";
import ReactMarkdown from "react-markdown";

const MarkdownPreview = ({ content }:any) => {
  return (
    <div className="markdown-preview">
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  );
};

export default MarkdownPreview;
