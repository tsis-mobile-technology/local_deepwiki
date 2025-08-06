import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';

interface Component {
  name: string;
  type: string;
  file_path: string;
  classes: any[];
  functions: any[];
}

interface Dependency {
  from: string;
  to: string;
  type: string;
}

interface ArchitectureData {
  components: Record<string, Component>;
  dependencies: Dependency[];
  structure: {
    layers: string[];
    patterns: string[];
    complexity: string;
  };
  metrics: {
    total_components: number;
    total_dependencies: number;
    dependency_density: number;
    most_depended_component: string;
  };
}

interface ArchitectureDiagramProps {
  architectureData: ArchitectureData;
}

const ArchitectureDiagram: React.FC<ArchitectureDiagramProps> = ({ architectureData }) => {
  const diagramRef = useRef<HTMLDivElement>(null);
  const [diagramType, setDiagramType] = useState<'flowchart' | 'graph'>('flowchart');
  const [showMetrics, setShowMetrics] = useState(true);

  useEffect(() => {
    mermaid.initialize({ 
      startOnLoad: true,
      theme: 'default',
      flowchart: {
        useMaxWidth: true,
        htmlLabels: true
      }
    });
  }, []);

  useEffect(() => {
    if (diagramRef.current && architectureData) {
      generateDiagram();
    }
  }, [architectureData, diagramType]);

  const generateDiagram = () => {
    if (!diagramRef.current) return;

    const diagramDefinition = diagramType === 'flowchart' 
      ? generateFlowchartDiagram() 
      : generateGraphDiagram();

    // Clear previous diagram
    diagramRef.current.innerHTML = '';

    // Generate new diagram
    const diagramId = `diagram-${Date.now()}`;
    mermaid.render(diagramId, diagramDefinition).then(({ svg }) => {
      if (diagramRef.current) {
        diagramRef.current.innerHTML = svg;
      }
    }).catch(error => {
      console.error('Error rendering Mermaid diagram:', error);
      if (diagramRef.current) {
        diagramRef.current.innerHTML = `
          <div style="padding: 20px; text-align: center; color: #666; border: 1px solid #ddd; border-radius: 4px;">
            <p>다이어그램 생성 중 오류가 발생했습니다.</p>
            <p style="font-size: 12px; margin-top: 10px;">아키텍처가 복잡하거나 의존성이 많은 경우 발생할 수 있습니다.</p>
          </div>
        `;
      }
    });
  };

  const generateFlowchartDiagram = (): string => {
    let diagram = 'flowchart TD\n';
    
    // Add nodes with styling based on component type
    Object.values(architectureData.components).forEach(component => {
      const nodeId = component.name.replace(/[^a-zA-Z0-9]/g, '_');
      const nodeStyle = getNodeStyle(component.type);
      diagram += `    ${nodeId}["${component.name}\\n(${component.type})"]\n`;
      diagram += `    ${nodeId} --> ${nodeId}Style[${nodeStyle}]\n`;
    });

    // Add dependencies (only internal ones to avoid clutter)
    architectureData.dependencies
      .filter(dep => dep.type === 'internal')
      .forEach(dep => {
        const fromId = dep.from.replace(/[^a-zA-Z0-9]/g, '_');
        const toId = dep.to.replace(/[^a-zA-Z0-9]/g, '_');
        
        // Only add if both components exist
        if (architectureData.components[dep.from] && architectureData.components[dep.to]) {
          diagram += `    ${fromId} --> ${toId}\n`;
        }
      });

    // Add styling
    diagram += `
    classDef main fill:#e1f5fe,stroke:#01579b,stroke-width:2px
    classDef service fill:#f3e5f5,stroke:#4a148c,stroke-width:2px
    classDef config fill:#fff3e0,stroke:#e65100,stroke-width:2px
    classDef component fill:#f1f8e9,stroke:#33691e,stroke-width:2px
    classDef utility fill:#fce4ec,stroke:#880e4f,stroke-width:2px
    `;

    return diagram;
  };

  const generateGraphDiagram = (): string => {
    let diagram = 'graph TD\n';
    
    // Group components by type for better visualization
    const componentsByType: Record<string, Component[]> = {};
    Object.values(architectureData.components).forEach(component => {
      if (!componentsByType[component.type]) {
        componentsByType[component.type] = [];
      }
      componentsByType[component.type].push(component);
    });

    // Add subgraphs for each component type
    Object.entries(componentsByType).forEach(([type, components]) => {
      diagram += `    subgraph ${type.toUpperCase()}\n`;
      components.forEach(component => {
        const nodeId = component.name.replace(/[^a-zA-Z0-9]/g, '_');
        diagram += `        ${nodeId}["${component.name}"]\n`;
      });
      diagram += `    end\n`;
    });

    // Add dependencies
    architectureData.dependencies
      .filter(dep => dep.type !== 'external')
      .forEach(dep => {
        const fromId = dep.from.replace(/[^a-zA-Z0-9]/g, '_');
        const toId = dep.to.replace(/[^a-zA-Z0-9]/g, '_');
        
        if (architectureData.components[dep.from] && architectureData.components[dep.to]) {
          diagram += `    ${fromId} --> ${toId}\n`;
        }
      });

    return diagram;
  };

  const getNodeStyle = (type: string): string => {
    const styles = {
      'main': 'main',
      'service': 'service', 
      'config': 'config',
      'utility': 'utility',
      'component': 'component'
    };
    return styles[type] || 'component';
  };

  if (!architectureData || Object.keys(architectureData.components).length === 0) {
    return (
      <div style={{ 
        padding: '20px', 
        textAlign: 'center', 
        color: '#666',
        border: '1px solid #ddd',
        borderRadius: '8px',
        margin: '20px 0'
      }}>
        아키텍처 분석 데이터를 로드할 수 없습니다.
      </div>
    );
  }

  return (
    <div style={{ 
      marginTop: '30px', 
      border: '1px solid #ddd', 
      borderRadius: '8px',
      backgroundColor: '#fafafa'
    }}>
      <div style={{ 
        padding: '15px', 
        borderBottom: '1px solid #ddd',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h3 style={{ margin: 0 }}>🏗️ 프로젝트 아키텍처</h3>
        
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <select
            value={diagramType}
            onChange={(e) => setDiagramType(e.target.value as 'flowchart' | 'graph')}
            style={{
              padding: '5px 10px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              backgroundColor: 'white'
            }}
          >
            <option value="flowchart">플로우차트</option>
            <option value="graph">그래프</option>
          </select>
          
          <label style={{ fontSize: '14px', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <input
              type="checkbox"
              checked={showMetrics}
              onChange={(e) => setShowMetrics(e.target.checked)}
            />
            메트릭스 표시
          </label>
        </div>
      </div>

      {/* Metrics Panel */}
      {showMetrics && (
        <div style={{ 
          padding: '15px', 
          backgroundColor: '#f5f5f5',
          borderBottom: '1px solid #ddd'
        }}>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: '15px' 
          }}>
            <div>
              <strong>전체 컴포넌트:</strong> {architectureData.metrics.total_components}개
            </div>
            <div>
              <strong>의존성:</strong> {architectureData.metrics.total_dependencies}개
            </div>
            <div>
              <strong>의존성 밀도:</strong> {architectureData.metrics.dependency_density}
            </div>
            <div>
              <strong>복잡도:</strong> {architectureData.structure.complexity}
            </div>
          </div>
          
          {architectureData.structure.patterns.length > 0 && (
            <div style={{ marginTop: '10px' }}>
              <strong>감지된 패턴:</strong> {architectureData.structure.patterns.join(', ')}
            </div>
          )}
          
          {architectureData.structure.layers.length > 0 && (
            <div style={{ marginTop: '5px' }}>
              <strong>아키텍처 레이어:</strong> {architectureData.structure.layers.join(', ')}
            </div>
          )}
        </div>
      )}

      {/* Diagram Container */}
      <div style={{ 
        padding: '20px', 
        backgroundColor: 'white',
        minHeight: '400px',
        overflow: 'auto'
      }}>
        <div ref={diagramRef} style={{ width: '100%', textAlign: 'center' }} />
      </div>
    </div>
  );
};

export default ArchitectureDiagram;