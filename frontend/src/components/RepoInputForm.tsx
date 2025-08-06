import React, { useState } from 'react';

interface RepoInputFormProps {
  onSubmit: (repoUrl: string) => void;
}

const RepoInputForm: React.FC<RepoInputFormProps> = ({ onSubmit }) => {
  const [repoUrl, setRepoUrl] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(repoUrl);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={repoUrl}
        onChange={(e) => setRepoUrl(e.target.value)}
        placeholder="Enter GitHub repository URL"
      />
      <button type="submit">Analyze</button>
    </form>
  );
};

export default RepoInputForm;
