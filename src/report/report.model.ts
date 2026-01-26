// ─────────────────────────────────────────────────────────────────────────────
// Report Definition Interfaces (from .qr.json files)
// ─────────────────────────────────────────────────────────────────────────────

export interface Parameter {
  id: string;
  type: 'userVariable' | 'list' | 'date' | 'number' | 'string' | 'column';
  source?: string | ParameterListSource;
  description?: string;
  key?: string;
  display?: string;
}

export interface ParameterListSource {
  sql: string[];
  parameters?: Parameter[];
  static?: Array<Record<string, unknown>>;
}

export interface SqlQuery {
  sql: string[];
  parameters?: Parameter[];
}

export interface DataSource {
  connectionName: string;
  query: SqlQuery;
}

export interface Expression {
  expr: string;
  parameters: Parameter[];
}

export interface ReportColumn {
  name: string;
  header: string;
  type: 'date' | 'string' | 'number';
  alignment: 'left' | 'center' | 'right';
  visible?: Expression;
  decimalPlaces?: number;
  aggrFuncInSum?: 'sum' | 'avg' | 'min' | 'max' | 'func' | '';
  function?: Expression;
}

export interface SubReport {
  id: string;
  parameters: Parameter[];
}

export interface ReportDefinition {
  title: string;
  description: string;
  dataSource: DataSource;
  columns?: ReportColumn[];
  subReports?: SubReport[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Report Request/Response Interfaces
// ─────────────────────────────────────────────────────────────────────────────

export interface ReportLoadRequest {
  reportId: string;
}

export interface ReportExecuteRequest {
  reportId: string;
  parameters?: Record<string, unknown>;
}

export interface ReportParameterResponse {
  id: string;
  type: string;
  description?: string;
  key?: string;
  display?: string;
  data?: Array<Record<string, unknown>>;
}

export interface ReportLoadResponse {
  reportId: string;
  title: string;
  description: string;
  requiresParameters: boolean;
  parameters?: ReportParameterResponse[];
}

export interface ReportExecuteResponse {
  reportId: string;
  title: string;
  description: string;
  columns: ReportColumn[];
  data: Array<Record<string, unknown>>;
}
