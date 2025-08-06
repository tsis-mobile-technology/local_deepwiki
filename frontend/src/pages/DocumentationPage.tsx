import React from 'react';

interface DocumentationPageProps {
  documentation: string;
}

const DocumentationPage: React.FC<DocumentationPageProps> = ({ documentation }) => {
  return (
    <div>
      <h1>Documentation</h1>
      {/* TODO: Render markdown documentation here */}
      <p>{documentation}</p>
    </div>
  );
};

export default DocumentationPage;
