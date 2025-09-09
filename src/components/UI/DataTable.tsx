import React, { ReactNode, useState } from 'react';
import { ChevronLeft, ChevronRight, ChevronUp, ChevronDown, Search, Filter, CheckSquare, Square } from 'lucide-react';

export interface Column<T> {
  key: keyof T | string;
  title: string;
  render?: (value: any, record: T, index: number) => ReactNode;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
  width?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  loading?: boolean;
  searchable?: boolean;
  searchPlaceholder?: string;
  pageSize?: number;
  onRowSelect?: (record: T, index: number) => void;
  selectedRows?: Set<number>;
  onSelectionChange?: (selectedRows: Set<number>) => void;
  emptyMessage?: string;
  className?: string;
}

export default function DataTable<T extends Record<string, any>>({
  data,
  columns,
  loading = false,
  searchable = false,
  searchPlaceholder = 'Buscar en la tabla...',
  pageSize = 10,
  onRowSelect,
  selectedRows,
  onSelectionChange,
  emptyMessage = 'No hay datos para mostrar',
  className = ''
}: DataTableProps<T>) {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortKey, setSortKey] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Filter data based on search term
  const filteredData = searchable && searchTerm
    ? data.filter(record =>
        Object.values(record).some(value =>
          String(value).toLowerCase().includes(searchTerm.toLowerCase())
        )
      )
    : data;

  // Sort data
  const sortedData = sortKey
    ? [...filteredData].sort((a, b) => {
        const aVal = a[sortKey];
        const bVal = b[sortKey];
        
        let comparison = 0;
        if (aVal < bVal) comparison = -1;
        if (aVal > bVal) comparison = 1;
        
        return sortDirection === 'desc' ? -comparison : comparison;
      })
    : filteredData;

  // Paginate data
  const totalPages = Math.ceil(sortedData.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedData = sortedData.slice(startIndex, startIndex + pageSize);

  const handleSort = (key: string, sortable?: boolean) => {
    if (!sortable) return;
    
    if (sortKey === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  const handleSelectAll = () => {
    if (!onSelectionChange) return;
    
    const currentPageIndices = new Set(
      Array.from({ length: paginatedData.length }, (_, i) => startIndex + i)
    );
    
    const isAllSelected = paginatedData.every((_, i) => 
      selectedRows?.has(startIndex + i)
    );

    if (isAllSelected) {
      const newSelection = new Set(selectedRows);
      currentPageIndices.forEach(index => newSelection.delete(index));
      onSelectionChange(newSelection);
    } else {
      const newSelection = new Set(selectedRows || []);
      currentPageIndices.forEach(index => newSelection.add(index));
      onSelectionChange(newSelection);
    }
  };

  const handleRowSelect = (index: number) => {
    if (!onSelectionChange || !selectedRows) return;
    
    const actualIndex = startIndex + index;
    const newSelection = new Set(selectedRows);
    
    if (newSelection.has(actualIndex)) {
      newSelection.delete(actualIndex);
    } else {
      newSelection.add(actualIndex);
    }
    
    onSelectionChange(newSelection);
  };

  if (loading) {
    return (
      <div className={`card-premium ${className}`}>
        <div className="p-12">
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="relative">
              <div className="w-12 h-12 border-4 border-primary-200 dark:border-primary-800 border-t-primary-600 dark:border-t-primary-400 rounded-full animate-spin"></div>
              <div className="absolute inset-2 w-8 h-8 border-4 border-accent-200 dark:border-accent-800 border-b-accent-600 dark:border-b-accent-400 rounded-full animate-spin animation-delay-75"></div>
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold text-neutral-600 dark:text-neutral-400">Cargando datos</p>
              <p className="text-sm text-neutral-500 dark:text-neutral-500">Procesando información...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`card-premium overflow-hidden ${className}`}>
      {/* Header with search */}
      {searchable && (
        <div className="p-6 border-b border-neutral-200 dark:border-neutral-700 bg-gradient-to-r from-neutral-50 to-neutral-100 dark:from-neutral-800 dark:to-neutral-700">
          <div className="relative group max-w-md">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-neutral-400 group-focus-within:text-primary-500 transition-colors duration-200" />
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-12 pr-4 py-3 bg-white dark:bg-neutral-800 border-2 border-neutral-200 dark:border-neutral-600 rounded-xl text-sm font-medium placeholder:text-neutral-500 focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all duration-200 shadow-sm hover:shadow-md"
            />
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gradient-to-r from-neutral-100 to-neutral-50 dark:from-neutral-700 dark:to-neutral-800 border-b-2 border-neutral-200 dark:border-neutral-600">
            <tr>
              {/* Selection column */}
              {onSelectionChange && (
                <th className="px-6 py-4 w-12">
                  <button
                    onClick={handleSelectAll}
                    className="p-1 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/30 transition-colors duration-200"
                  >
                    {selectedRows && paginatedData.length > 0 && paginatedData.every((_, i) => selectedRows.has(startIndex + i)) ? (
                      <CheckSquare className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                    ) : (
                      <Square className="h-5 w-5 text-neutral-400" />
                    )}
                  </button>
                </th>
              )}
              
              {columns.map((column, index) => (
                <th
                  key={index}
                  className={`px-6 py-4 text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-widest ${
                    column.align === 'center' ? 'text-center' :
                    column.align === 'right' ? 'text-right' : 'text-left'
                  }`}
                  style={column.width ? { width: column.width } : undefined}
                >
                  {column.sortable ? (
                    <button
                      onClick={() => handleSort(column.key as string, column.sortable)}
                      className="flex items-center space-x-1 hover:text-primary-600 dark:hover:text-primary-400 transition-colors duration-200 group"
                    >
                      <span>{column.title}</span>
                      <div className="flex flex-col opacity-50 group-hover:opacity-100 transition-opacity duration-200">
                        <ChevronUp className={`h-3 w-3 ${
                          sortKey === column.key && sortDirection === 'asc' 
                            ? 'text-primary-600 dark:text-primary-400' : 'text-neutral-400'
                        }`} />
                        <ChevronDown className={`h-3 w-3 -mt-1 ${
                          sortKey === column.key && sortDirection === 'desc' 
                            ? 'text-primary-600 dark:text-primary-400' : 'text-neutral-400'
                        }`} />
                      </div>
                    </button>
                  ) : (
                    column.title
                  )}
                </th>
              ))}
            </tr>
          </thead>
          
          <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700">
            {paginatedData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (onSelectionChange ? 1 : 0)}
                  className="px-6 py-16 text-center"
                >
                  <div className="flex flex-col items-center space-y-4">
                    <div className="p-6 bg-neutral-100 dark:bg-neutral-800 rounded-2xl">
                      <Filter className="h-12 w-12 text-neutral-400" />
                    </div>
                    <div className="text-center">
                      <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
                        No hay datos
                      </h3>
                      <p className="text-sm text-neutral-500 dark:text-neutral-400">
                        {emptyMessage}
                      </p>
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedData.map((record, index) => (
                <tr
                  key={index}
                  className={`
                    group transition-all duration-200 hover:bg-gradient-to-r hover:from-primary-50 hover:to-transparent dark:hover:from-primary-900/10 dark:hover:to-transparent
                    ${onRowSelect ? 'cursor-pointer' : ''} 
                    ${selectedRows?.has(startIndex + index) ? 'bg-primary-50 dark:bg-primary-900/20' : ''}
                    ${index % 2 === 0 ? 'bg-neutral-50/50 dark:bg-neutral-800/30' : 'bg-white dark:bg-neutral-800/50'}
                  `}
                  onClick={() => onRowSelect?.(record, startIndex + index)}
                >
                  {/* Selection column */}
                  {onSelectionChange && (
                    <td className="px-6 py-4">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRowSelect(index);
                        }}
                        className="p-1 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/30 transition-colors duration-200"
                      >
                        {selectedRows?.has(startIndex + index) ? (
                          <CheckSquare className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                        ) : (
                          <Square className="h-5 w-5 text-neutral-400 group-hover:text-neutral-600" />
                        )}
                      </button>
                    </td>
                  )}
                  
                  {columns.map((column, colIndex) => (
                    <td
                      key={colIndex}
                      className={`px-6 py-4 text-sm font-medium text-neutral-900 dark:text-neutral-100 ${
                        column.align === 'center' ? 'text-center' :
                        column.align === 'right' ? 'text-right' : 'text-left'
                      }`}
                    >
                      {column.render
                        ? column.render(record[column.key as keyof T], record, startIndex + index)
                        : String(record[column.key as keyof T] || '')
                      }
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Enterprise */}
      {totalPages > 1 && (
        <div className="px-6 py-5 border-t border-neutral-200 dark:border-neutral-700 bg-gradient-to-r from-neutral-50 to-neutral-100 dark:from-neutral-800 dark:to-neutral-700">
          <div className="flex items-center justify-between">
            <div className="text-sm text-neutral-600 dark:text-neutral-400 font-medium">
              Mostrando <span className="font-bold text-neutral-900 dark:text-neutral-100">{startIndex + 1}</span> a{' '}
              <span className="font-bold text-neutral-900 dark:text-neutral-100">{Math.min(startIndex + pageSize, filteredData.length)}</span> de{' '}
              <span className="font-bold text-neutral-900 dark:text-neutral-100">{filteredData.length}</span> registros
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border-2 border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md disabled:transform-none enabled:hover:scale-105"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              
              {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 7) {
                  pageNum = i + 1;
                } else if (currentPage <= 4) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 3) {
                  pageNum = totalPages - 6 + i;
                } else {
                  pageNum = currentPage - 3 + i;
                }
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`
                      px-4 py-2 rounded-lg font-semibold transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-105 border-2
                      ${currentPage === pageNum
                        ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white border-primary-600 shadow-lg'
                        : 'border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300'
                      }
                    `}
                  >
                    {pageNum}
                  </button>
                );
              })}
              
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border-2 border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md disabled:transform-none enabled:hover:scale-105"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}