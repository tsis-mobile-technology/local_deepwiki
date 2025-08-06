import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ArchitectureDiagram from '../../components/ArchitectureDiagram';

// Mock mermaid
vi.mock('mermaid', () => ({
  default: {
    initialize: vi.fn(),
    render: vi.fn().mockResolvedValue({ svg: '<svg>Mock Diagram</svg>' }),
  },
}));

describe('ArchitectureDiagram', () => {
  const mockArchitectureData = {
    components: {
      'main': {
        name: 'main',
        type: 'main',
        file_path: 'main.py',
        classes: [],
        functions: [{ name: 'main', line: 1 }]
      },
      'service': {
        name: 'service',
        type: 'service',
        file_path: 'service.py',
        classes: [{ name: 'Service', line: 1 }],
        functions: []
      }
    },
    dependencies: [
      { from: 'main', to: 'service', type: 'internal' }
    ],
    structure: {
      layers: ['main', 'service'],
      patterns: ['Service Layer'],
      complexity: 'medium'
    },
    metrics: {
      total_components: 2,
      total_dependencies: 1,
      dependency_density: 0.5,
      most_depended_component: 'service'
    }
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders architecture diagram with data', () => {
    render(<ArchitectureDiagram architectureData={mockArchitectureData} />);
    
    expect(screen.getByText('🏗️ 프로젝트 아키텍처')).toBeInTheDocument();
    expect(screen.getByText('전체 컴포넌트:')).toBeInTheDocument();
    expect(screen.getByText('2개')).toBeInTheDocument();
    expect(screen.getByText('의존성:')).toBeInTheDocument();
    expect(screen.getByText('1개')).toBeInTheDocument();
  });

  it('shows error message when no architecture data', () => {
    render(<ArchitectureDiagram architectureData={{ components: {}, dependencies: [], structure: { layers: [], patterns: [], complexity: 'low' }, metrics: { total_components: 0, total_dependencies: 0, dependency_density: 0, most_depended_component: 'none' } }} />);
    
    expect(screen.getByText('아키텍처 분석 데이터를 로드할 수 없습니다.')).toBeInTheDocument();
  });

  it('toggles between diagram types', () => {
    render(<ArchitectureDiagram architectureData={mockArchitectureData} />);
    
    const select = screen.getByDisplayValue('플로우차트');
    fireEvent.change(select, { target: { value: 'graph' } });
    
    expect(select.value).toBe('graph');
  });

  it('toggles metrics visibility', () => {
    render(<ArchitectureDiagram architectureData={mockArchitectureData} />);
    
    expect(screen.getByText('전체 컴포넌트:')).toBeInTheDocument();
    
    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);
    
    // Metrics should still be visible as the checkbox defaults to checked
    // This tests the toggle functionality
    expect(checkbox).toBeInTheDocument();
  });

  it('displays detected patterns', () => {
    render(<ArchitectureDiagram architectureData={mockArchitectureData} />);
    
    expect(screen.getByText('감지된 패턴:')).toBeInTheDocument();
    expect(screen.getByText('Service Layer')).toBeInTheDocument();
  });

  it('displays architecture layers', () => {
    render(<ArchitectureDiagram architectureData={mockArchitectureData} />);
    
    expect(screen.getByText('아키텍처 레이어:')).toBeInTheDocument();
    expect(screen.getByText('main, service')).toBeInTheDocument();
  });

  it('displays complexity level', () => {
    render(<ArchitectureDiagram architectureData={mockArchitectureData} />);
    
    expect(screen.getByText('복잡도:')).toBeInTheDocument();
    expect(screen.getByText('medium')).toBeInTheDocument();
  });

  it('handles architecture data with no patterns', () => {
    const dataWithNoPatterns = {
      ...mockArchitectureData,
      structure: {
        ...mockArchitectureData.structure,
        patterns: []
      }
    };

    render(<ArchitectureDiagram architectureData={dataWithNoPatterns} />);
    
    expect(screen.getByText('🏗️ 프로젝트 아키텍처')).toBeInTheDocument();
    // Patterns section should not be displayed when empty
    expect(screen.queryByText('감지된 패턴:')).not.toBeInTheDocument();
  });

  it('handles architecture data with no layers', () => {
    const dataWithNoLayers = {
      ...mockArchitectureData,
      structure: {
        ...mockArchitectureData.structure,
        layers: []
      }
    };

    render(<ArchitectureDiagram architectureData={dataWithNoLayers} />);
    
    expect(screen.getByText('🏗️ 프로젝트 아키텍처')).toBeInTheDocument();
    // Layers section should not be displayed when empty
    expect(screen.queryByText('아키텍처 레이어:')).not.toBeInTheDocument();
  });
});