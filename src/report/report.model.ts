export interface Parameter {
    id: string;
    type: string;
    source?: string | SqlQuery;
}

export interface SqlQuery {
    sql: string[];
    parameters: Parameter[];
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
    aggrFuncInSum?: 'sum' | 'avg' | 'min' | 'max' | 'func';
    function?: Expression; // for calculated columns
}

export interface Report {
    title: string;
    description: string;
    dataSource: DataSource;
    columns: ReportColumn[];
}

export default Report;