from tree_sitter import Parser
from tree_sitter_languages import get_language, get_parser
from typing import Dict, Any, List

class AnalysisService:
    def __init__(self):
        self.parsers = {}
        self.languages = {}
        try:
            self.parsers['python'] = get_parser('python')
            self.languages['python'] = get_language('python')
            self.parsers['javascript'] = get_parser('javascript') 
            self.languages['javascript'] = get_language('javascript')
            self.parsers['typescript'] = get_parser('typescript')
            self.languages['typescript'] = get_language('typescript')
        except Exception as e:
            print(f"Warning: Could not load Tree-sitter parsers/languages. Analysis features may be limited: {e}")

    def analyze_code(self, content: str, language: str) -> Dict[str, Any]:
        if language not in self.parsers:
            return {"error": f"Language '{language}' is not supported."}
        
        parser = self.parsers[language]
        tree = parser.parse(bytes(content, "utf8"))
        root_node = tree.root_node

        analysis = {
            "imports": self._find_imports(root_node, language),
            "classes": self._find_classes(root_node, language),
            "functions": self._find_functions(root_node, language),
        }
        return analysis

    def _execute_query(self, node, language, query_string) -> List[Dict]:
        lang_obj = self.languages[language]
        query = lang_obj.query(query_string)
        captures = query.captures(node)
        return captures

    def _find_imports(self, node, language) -> List[str]:
        query_string = "(import_statement) @import" if language == 'python' else "(import_statement) @import"
        captures = self._execute_query(node, language, query_string)
        return [c[0].text.decode('utf8') for c in captures]

    def _find_classes(self, node, language) -> List[Dict]:
        query_string = "(class_definition) @class" if language == 'python' else "(class_declaration) @class"
        captures = self._execute_query(node, language, query_string)
        classes = []
        for c in captures:
            class_node = c[0]
            name_node = class_node.child_by_field_name('name')
            if name_node:
                classes.append({
                    "name": name_node.text.decode('utf8'),
                    "line": name_node.start_point[0] + 1
                })
        return classes

    def _find_functions(self, node, language) -> List[Dict]:
        query_string = "(function_definition) @function" if language == 'python' else "(function_declaration) @function"
        captures = self._execute_query(node, language, query_string)
        functions = []
        for c in captures:
            func_node = c[0]
            name_node = func_node.child_by_field_name('name')
            if name_node:
                functions.append({
                    "name": name_node.text.decode('utf8'),
                    "line": name_node.start_point[0] + 1
                })
        return functions

    def analyze_project_architecture(self, file_analysis: Dict[str, Dict], repo_info: Dict) -> Dict[str, Any]:
        """프로젝트 아키텍처 및 컴포넌트 간 의존성 관계를 분석"""
        try:
            components = {}
            dependencies = []
            
            # 파일별 분석 결과를 기반으로 컴포넌트 추출
            for file_path, analysis in file_analysis.items():
                if "error" in analysis:
                    continue
                    
                file_type = self._get_file_type(file_path)
                component_name = self._extract_component_name(file_path)
                
                # 컴포넌트 정보 수집
                components[component_name] = {
                    "name": component_name,
                    "file_path": file_path,
                    "type": file_type,
                    "classes": analysis.get("classes", []),
                    "functions": analysis.get("functions", []),
                    "imports": analysis.get("imports", []),
                    "lines_count": len(analysis.get("imports", [])) + len(analysis.get("classes", [])) + len(analysis.get("functions", []))
                }
                
                # 의존성 관계 분석 (import 기반)
                for import_stmt in analysis.get("imports", []):
                    dependency = self._parse_dependency(import_stmt, file_path)
                    if dependency:
                        dependencies.append({
                            "from": component_name,
                            "to": dependency["target"],
                            "type": dependency["type"],
                            "import_statement": import_stmt
                        })
            
            # 프로젝트 구조 분석
            project_structure = self._analyze_project_structure(components)
            
            return {
                "project_info": repo_info,
                "components": components,
                "dependencies": dependencies,
                "structure": project_structure,
                "metrics": self._calculate_architecture_metrics(components, dependencies)
            }
            
        except Exception as e:
            print(f"Error analyzing project architecture: {e}")
            return {"error": str(e)}

    def _get_file_type(self, file_path: str) -> str:
        """파일 경로를 기반으로 컴포넌트 타입 결정"""
        if '/test' in file_path or file_path.endswith('_test.py'):
            return 'test'
        elif '/models/' in file_path or '/model/' in file_path:
            return 'model'
        elif '/views/' in file_path or '/view/' in file_path:
            return 'view'
        elif '/controllers/' in file_path or '/controller/' in file_path:
            return 'controller'
        elif '/services/' in file_path or '/service/' in file_path:
            return 'service'
        elif '/utils/' in file_path or '/util/' in file_path:
            return 'utility'
        elif '/config/' in file_path or file_path.endswith('config.py'):
            return 'config'
        elif 'main.py' in file_path or 'app.py' in file_path:
            return 'main'
        else:
            return 'component'

    def _extract_component_name(self, file_path: str) -> str:
        """파일 경로에서 컴포넌트 이름 추출"""
        import os
        return os.path.splitext(os.path.basename(file_path))[0]

    def _parse_dependency(self, import_stmt: str, current_file: str) -> Dict:
        """import 문을 파싱하여 의존성 정보 추출"""
        try:
            import_stmt = import_stmt.strip()
            
            # 상대 import 처리
            if import_stmt.startswith('from .') or import_stmt.startswith('import .'):
                return {
                    "target": "local_module",
                    "type": "relative"
                }
            
            # 절대 import 처리
            if import_stmt.startswith('from '):
                # from module import something
                parts = import_stmt.split(' ')
                if len(parts) >= 2:
                    module = parts[1]
                    return {
                        "target": module.split('.')[0],  # 첫 번째 모듈명만 사용
                        "type": "external" if self._is_external_module(module) else "internal"
                    }
            elif import_stmt.startswith('import '):
                # import module
                module = import_stmt[7:].split(',')[0].strip()  # 첫 번째 모듈만 사용
                return {
                    "target": module.split('.')[0],
                    "type": "external" if self._is_external_module(module) else "internal"
                }
            
            return None
            
        except Exception:
            return None

    def _is_external_module(self, module_name: str) -> bool:
        """외부 모듈인지 확인"""
        external_modules = {
            'os', 'sys', 'json', 'datetime', 'time', 'requests', 'urllib',
            'fastapi', 'pydantic', 'sqlalchemy', 'redis', 'asyncio',
            'typing', 'logging', 'pathlib', 'collections', 'itertools',
            'functools', 'unittest', 'pytest', 'numpy', 'pandas'
        }
        return module_name.lower() in external_modules

    def _analyze_project_structure(self, components: Dict) -> Dict:
        """프로젝트 구조 분석"""
        structure = {
            "layers": [],
            "patterns": [],
            "complexity": "low"
        }
        
        # 컴포넌트 타입별 분류
        type_counts = {}
        for comp in components.values():
            comp_type = comp["type"]
            type_counts[comp_type] = type_counts.get(comp_type, 0) + 1
        
        # 아키텍처 패턴 감지
        if "controller" in type_counts and "service" in type_counts and "model" in type_counts:
            structure["patterns"].append("MVC")
        
        if "service" in type_counts and type_counts["service"] > 1:
            structure["patterns"].append("Service Layer")
        
        # 복잡도 계산
        total_components = len(components)
        if total_components > 20:
            structure["complexity"] = "high"
        elif total_components > 10:
            structure["complexity"] = "medium"
        
        structure["layers"] = list(type_counts.keys())
        
        return structure

    def _calculate_architecture_metrics(self, components: Dict, dependencies: List) -> Dict:
        """아키텍처 메트릭스 계산"""
        total_components = len(components)
        total_dependencies = len(dependencies)
        
        # 의존성 밀도 계산
        dependency_density = total_dependencies / total_components if total_components > 0 else 0
        
        # 가장 많이 의존되는 컴포넌트 찾기
        dependency_targets = {}
        for dep in dependencies:
            target = dep["to"]
            dependency_targets[target] = dependency_targets.get(target, 0) + 1
        
        most_depended = max(dependency_targets.items(), key=lambda x: x[1]) if dependency_targets else ("none", 0)
        
        return {
            "total_components": total_components,
            "total_dependencies": total_dependencies,
            "dependency_density": round(dependency_density, 2),
            "most_depended_component": most_depended[0],
            "max_dependency_count": most_depended[1]
        }
