import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo
    });

    // Registrar error en servicio de monitoreo en producción
    console.error('ContaVe Pro Error:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 flex items-center justify-center p-4">
          <div className="max-w-lg w-full bg-white dark:bg-neutral-800 rounded-2xl shadow-xl border border-neutral-200 dark:border-neutral-700 p-8">
            <div className="text-center">
              {/* Icono de Error */}
              <div className="mx-auto w-16 h-16 bg-error-100 dark:bg-error-900/30 rounded-full flex items-center justify-center mb-6">
                <AlertTriangle className="h-8 w-8 text-error-600 dark:text-error-400" />
              </div>

              {/* Título del Error */}
              <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-3">
                ¡Ups! Algo salió mal
              </h1>

              {/* Descripción del Error */}
              <p className="text-neutral-600 dark:text-neutral-400 mb-6">
                Se produjo un error inesperado en ContaVe Pro. Nuestro equipo ha sido notificado automáticamente.
              </p>

              {/* Detalles del Error (Desarrollo) */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="mb-6 p-4 bg-neutral-50 dark:bg-neutral-900 rounded-lg text-left">
                  <div className="flex items-center mb-2">
                    <Bug className="h-4 w-4 text-error-600 mr-2" />
                    <span className="text-sm font-semibold text-error-700 dark:text-error-400">
                      Detalles del Error (Desarrollo)
                    </span>
                  </div>
                  <pre className="text-xs text-neutral-600 dark:text-neutral-400 overflow-auto">
                    {this.state.error.message}
                  </pre>
                  {this.state.errorInfo && (
                    <details className="mt-2">
                      <summary className="text-xs text-neutral-500 cursor-pointer">
                        Stack Trace
                      </summary>
                      <pre className="text-xs text-neutral-500 mt-1 overflow-auto">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </details>
                  )}
                </div>
              )}

              {/* Botones de Acción */}
              <div className="space-y-3">
                <button
                  onClick={this.handleReload}
                  className="w-full flex items-center justify-center px-4 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors font-medium"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Recargar Aplicación
                </button>

                <button
                  onClick={this.handleGoHome}
                  className="w-full flex items-center justify-center px-4 py-3 bg-neutral-200 hover:bg-neutral-300 dark:bg-neutral-700 dark:hover:bg-neutral-600 text-neutral-700 dark:text-neutral-300 rounded-lg transition-colors font-medium"
                >
                  <Home className="h-4 w-4 mr-2" />
                  Ir al Dashboard
                </button>
              </div>

              {/* Información de Soporte */}
              <div className="mt-8 pt-6 border-t border-neutral-200 dark:border-neutral-700">
                <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-2">
                  ¿Necesita ayuda adicional?
                </p>
                <div className="text-xs text-neutral-400 dark:text-neutral-500 space-y-1">
                  <p>📧 soporte@contavepro.com</p>
                  <p>📱 WhatsApp: +58-212-555-0199</p>
                  <p>🌐 www.contavepro.com/soporte</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;