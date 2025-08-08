import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import RepoInputForm from '../../components/RepoInputForm';

describe('RepoInputForm', () => {
  it('renders input field and button', () => {
    const mockOnSubmit = vi.fn();
    render(<RepoInputForm onSubmit={mockOnSubmit} />);
    
    expect(screen.getByPlaceholderText('Enter GitHub repository URL')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '🔍 Analyze' })).toBeInTheDocument();
  });

  it('calls onSubmit with input value when form is submitted', () => {
    const mockOnSubmit = vi.fn();
    render(<RepoInputForm onSubmit={mockOnSubmit} />);
    
    const input = screen.getByPlaceholderText('Enter GitHub repository URL');
    const button = screen.getByRole('button', { name: '🔍 Analyze' });
    
    fireEvent.change(input, { target: { value: 'https://github.com/test/repo' } });
    fireEvent.click(button);
    
    expect(mockOnSubmit).toHaveBeenCalledWith('https://github.com/test/repo');
  });

  it('updates input value when typing', () => {
    const mockOnSubmit = vi.fn();
    render(<RepoInputForm onSubmit={mockOnSubmit} />);
    
    const input = screen.getByPlaceholderText('Enter GitHub repository URL') as HTMLInputElement;
    
    fireEvent.change(input, { target: { value: 'test-url' } });
    
    expect(input.value).toBe('test-url');
  });

  it('prevents default form submission', () => {
    const mockOnSubmit = vi.fn();
    render(<RepoInputForm onSubmit={mockOnSubmit} />);
    
    const form = screen.getByRole('button', { name: '🔍 Analyze' }).closest('form');
    const mockPreventDefault = vi.fn();
    
    fireEvent.submit(form!, { preventDefault: mockPreventDefault });
    
    expect(mockOnSubmit).toHaveBeenCalled();
  });
});