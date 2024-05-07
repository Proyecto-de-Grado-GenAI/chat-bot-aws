
import React from 'react';
import markdownToHtml from '../services/markdownToHtml';

const MarkdownTable = ({ markdown }) => {
  const createMarkup = (html) => {
    return { __html: html };
  };

  return (
    <div dangerouslySetInnerHTML={createMarkup(markdownToHtml(markdown))} />
  );
};

export default MarkdownTable;
