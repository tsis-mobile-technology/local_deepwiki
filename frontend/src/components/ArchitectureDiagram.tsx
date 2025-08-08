import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import { Box, Typography, Button, Select, MenuItem, FormControl, InputLabel, FormControlLabel, Checkbox, Paper, Grid } from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

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

  // Check if architecture data is empty or minimal
  const hasComponents = Object.keys(architectureData.components || {}).length > 0;
  const hasDependencies = (architectureData.dependencies || []).length > 0;

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
      diagram += `    ${nodeId}["${component.name}\n(${component.type})"]\n`;
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
      <Box sx={{
        textAlign: 'center',
        p: 5,
        bgcolor: 'background.paper',
        borderRadius: 3,
        m: 2,
        color: 'text.secondary',
        border: '1px solid', borderColor: 'divider'
      }}>
        <InfoOutlinedIcon sx={{ fontSize: '4rem', mb: 2, color: 'primary.main' }} />
        <Typography variant="h5" component="h3" color="text.primary" gutterBottom>
          No Architecture Data Available
        </Typography>
        <Typography variant="body1" sx={{ lineHeight: 1.6, maxWidth: 600, mx: 'auto', mb: 2 }}>
          This repository appears to be simple or doesn't contain analyzable code files. 
          Architecture diagrams are generated for projects with:
        </Typography>
        <Box component="ul" sx={{
          textAlign: 'left',
          maxWidth: 400,
          mx: 'auto',
          p: 0,
          listStyle: 'none',
          color: 'text.secondary'
        }}>
          <Typography component="li" variant="body2" sx={{ py: 0.5 }}>✓ Multiple source code files</Typography>
          <Typography component="li" variant="body2" sx={{ py: 0.5 }}>✓ Class and function definitions</Typography>
          <Typography component="li" variant="body2" sx={{ py: 0.5 }}>✓ Import/dependency relationships</Typography>
        </Box>
        <Typography variant="body2" color="text.disabled" sx={{ mt: 3 }}>
          Try analyzing a larger project with multiple files and dependencies.
        </Typography>
      </Box>
    );
  }

  return (
    <Paper sx={{ mt: 4, border: '1px solid', borderColor: 'divider', borderRadius: 2, bgcolor: 'background.paper' }}>
      <Box sx={{
        p: 2,
        borderBottom: '1px solid',
        borderColor: 'divider',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <Typography variant="h6" component="h3">🏗️ 프로젝트 아키텍처</Typography>
        
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <FormControl variant="outlined" size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Diagram Type</InputLabel>
            <Select
              value={diagramType}
              label="Diagram Type"
              onChange={(e) => setDiagramType(e.target.value as 'flowchart' | 'graph')}
            >
              <MenuItem value="flowchart">플로우차트</MenuItem>
              <MenuItem value="graph">그래프</MenuItem>
            </Select>
          </FormControl>
          
          <FormControlLabel
            control={
              <Checkbox
                checked={showMetrics}
                onChange={(e) => setShowMetrics(e.target.checked)}
                name="showMetrics"
                color="primary"
              />
            }
            label="메트릭스 표시"
            sx={{ fontSize: '0.875rem' }}
          />
        </Box>
      </Box>

      {/* Metrics Panel */}
      {showMetrics && (
        <Box sx={{
          p: 2,
          bgcolor: 'action.hover',
          borderBottom: '1px solid',
          borderColor: 'divider'
        }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="body2"><strong>전체 컴포넌트:</strong> {architectureData.metrics.total_components}개</Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="body2"><strong>의존성:</strong> {architectureData.metrics.total_dependencies}개</Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="body2"><strong>의존성 밀도:</strong> {architectureData.metrics.dependency_density}</Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="body2"><strong>복잡도:</strong> {architectureData.structure.complexity}</Typography>
            </Grid>
          </Grid>
          
          {architectureData.structure.patterns.length > 0 && (
            <Typography variant="body2" sx={{ mt: 1 }}>
              <strong>감지된 패턴:</strong> {architectureData.structure.patterns.join(', ')}
            </Typography>
          )}
          
          {architectureData.structure.layers.length > 0 && (
            <Typography variant="body2" sx={{ mt: 0.5 }}>
              <strong>아키텍처 레이어:</strong> {architectureData.structure.layers.join(', ')}
            </Typography>
          )}
        </Box>
      )}

      {/* Diagram Container */}
      <Box sx={{
        p: 2,
        bgcolor: 'background.default',
        minHeight: '400px',
        overflow: 'auto'
      }}>
        <Box ref={diagramRef} sx={{ width: '100%', textAlign: 'center' }} />
      </Box>
    </Paper>
  );
};

export default ArchitectureDiagram;
