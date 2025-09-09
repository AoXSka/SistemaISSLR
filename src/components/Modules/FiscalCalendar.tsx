import React, { useState, useEffect } from 'react';
import { useFiscalConfig } from '../../hooks/useFiscalConfig';
import { 
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Plus,
  Filter,
  Eye,
  Bell,
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
  DollarSign,
  Building2,
  Target,
  Flag,
  Bookmark,
  X
} from 'lucide-react';
import { formatDate, formatCurrency } from '../../utils/formatters';
import { FiscalEvent } from '../../types';

const monthNames = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export default function FiscalCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const { fiscalYear } = useFiscalConfig();
  const [loading, setLoading] = useState(true);
  const [fiscalEvents, setFiscalEvents] = useState<FiscalEvent[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showNewEventForm, setShowNewEventForm] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<FiscalEvent | null>(null);
  const [viewType, setViewType] = useState<'month' | 'year'>('month');
  const [filterType, setFilterType] = useState<string>('ALL');

  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    date: '',
    type: 'deadline' as 'declaration' | 'payment' | 'deadline' | 'holiday',
    priority: 'medium' as 'low' | 'medium' | 'high'
  });

  useEffect(() => {
    const loadFiscalEvents = async () => {
      try {
        setLoading(true);
        
        // Load events from localStorage
        const savedEvents = localStorage.getItem('contave-fiscal-events');
        if (savedEvents) {
          setFiscalEvents(JSON.parse(savedEvents));
        } else {
          // Generate default fiscal events for current fiscal year
          const defaultEvents = generateDefaultFiscalEvents(fiscalYear || new Date().getFullYear());
          setFiscalEvents(defaultEvents);
        }
      } catch (error) {
        console.error('Error loading fiscal events:', error);
        setFiscalEvents([]);
      } finally {
        setLoading(false);
      }
    };

    loadFiscalEvents();
  }, []);
  
  // Generate default fiscal events for Venezuelan tax calendar
  const generateDefaultFiscalEvents = (year: number) => {
    const events = [];
    
    // Monthly IVA declarations (15th of each month)
    for (let month = 1; month <= 12; month++) {
      events.push({
        id: Date.now() + month,
        title: `Declaración IVA ${new Date(year, month - 1).toLocaleDateString('es-VE', { month: 'long' })}`,
        description: `Declaración mensual del IVA correspondiente al período ${month.toString().padStart(2, '0')}/${year}`,
        date: `${year}-${month.toString().padStart(2, '0')}-15`,
        type: 'declaration' as const,
        priority: 'high' as const,
        completed: false
      });
    }
    
    return events;
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const getEventsForDate = (dateStr: string) => {
    return fiscalEvents.filter(event => event.date === dateStr);
  };

  const getFilteredEvents = () => {
    if (filterType === 'ALL') return fiscalEvents;
    return fiscalEvents.filter(event => event.type === filterType);
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(month - 1);
    } else {
      newDate.setMonth(month + 1);
    }
    setCurrentDate(newDate);
  };

  const navigateYear = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    newDate.setFullYear(year + (direction === 'next' ? 1 : -1));
    setCurrentDate(newDate);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'declaration': return <FileText className="h-4 w-4" />;
      case 'payment': return <DollarSign className="h-4 w-4" />;
      case 'deadline': return <Clock className="h-4 w-4" />;
      case 'holiday': return <Flag className="h-4 w-4" />;
      default: return <Calendar className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'declaration': return 'text-blue-600';
      case 'payment': return 'text-green-600';
      case 'deadline': return 'text-orange-600';
      case 'holiday': return 'text-purple-600';
      default: return 'text-gray-600';
    }
  };

  const upcomingEvents = fiscalEvents
    .filter(event => new Date(event.date) >= new Date() && !event.completed)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5);

  const criticalDeadlines = fiscalEvents
    .filter(event => {
      const eventDate = new Date(event.date);
      const today = new Date();
      const daysDiff = Math.ceil((eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return daysDiff <= 7 && daysDiff >= 0 && !event.completed && event.priority === 'high';
    });

  const handleEventClick = (event: FiscalEvent) => {
    setSelectedEvent(event);
    setShowEventModal(true);
  };

  const handleMarkCompleted = (eventId: number) => {
    // In a real app, this would update the database
    alert(`Evento marcado como completado`);
  };

  const handleAddEvent = () => {
    const newEventWithId: FiscalEvent = {
      id: Date.now(),
      title: newEvent.title,
      description: newEvent.description,
      date: newEvent.date,
      type: newEvent.type,
      priority: newEvent.priority,
      completed: false
    };
    
    const updatedEvents = [...fiscalEvents, newEventWithId];
    setFiscalEvents(updatedEvents);
    localStorage.setItem('contave-fiscal-events', JSON.stringify(updatedEvents));
    
    setShowNewEventForm(false);
    setNewEvent({
      title: '',
      description: '',
      date: '',
      type: 'deadline',
      priority: 'medium'
    });
  };

  if (loading) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-lg font-semibold text-gray-700">Cargando calendario fiscal...</p>
        </div>
      </div>
    );
  }
  const renderCalendarGrid = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = [];

    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-20 border border-gray-200"></div>);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
      const dayEvents = getEventsForDate(dateStr);
      const isToday = dateStr === new Date().toISOString().split('T')[0];
      const isSelected = selectedDate === dateStr;

      days.push(
        <div 
          key={day} 
          onClick={() => setSelectedDate(isSelected ? null : dateStr)}
          className={`
            h-20 border border-gray-200 p-1 cursor-pointer transition-all duration-200 hover:shadow-md
            ${isToday ? 'bg-blue-50 border-blue-300' : 'bg-white hover:bg-gray-50'}
            ${isSelected ? 'ring-2 ring-blue-500' : ''}
          `}
        >
          <div className={`text-sm font-semibold mb-1 ${isToday ? 'text-blue-600' : 'text-gray-900'}`}>
            {day}
          </div>
          <div className="space-y-0.5">
            {dayEvents.slice(0, 2).map(event => (
              <div
                key={event.id}
                onClick={(e) => {
                  e.stopPropagation();
                  handleEventClick(event);
                }}
                className={`
                  text-xs px-1 py-0.5 rounded cursor-pointer transition-colors
                  ${event.completed ? 'bg-green-100 text-green-700 line-through' : getPriorityColor(event.priority)}
                  hover:shadow-sm
                `}
              >
                {event.title.length > 10 ? `${event.title.substring(0, 10)}...` : event.title}
              </div>
            ))}
            {dayEvents.length > 2 && (
              <div className="text-xs text-gray-500 font-medium">
                +{dayEvents.length - 2} más
              </div>
            )}
          </div>
        </div>
      );
    }

    return days;
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Calendario Fiscal
            </h1>
            <p className="text-gray-600">
              Control de obligaciones tributarias y fechas importantes
            </p>
          </div>
          
          <div className="flex space-x-3">
            <button 
              onClick={() => setShowNewEventForm(true)}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Evento
            </button>
            <button className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-200 shadow-lg hover:shadow-xl">
              <Download className="h-4 w-4 mr-2" />
              Exportar Calendario
            </button>
          </div>
        </div>
      </div>

      {/* Critical Alerts */}
      {criticalDeadlines.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
          <div className="flex items-center mb-3">
            <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
            <h3 className="text-lg font-semibold text-red-900">Vencimientos Críticos</h3>
          </div>
          <div className="space-y-2">
            {criticalDeadlines.map(event => (
              <div key={event.id} className="flex items-center justify-between bg-white rounded-lg p-3 border border-red-200">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${getTypeColor(event.type)}`}>
                    {getTypeIcon(event.type)}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{event.title}</p>
                    <p className="text-sm text-gray-600">{formatDate(event.date)}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleMarkCompleted(event.id)}
                  className="px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                >
                  Marcar Completado
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
            {/* Calendar Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">
                    {monthNames[month]} {year}
                  </h2>
                  <p className="text-blue-100">
                    {getFilteredEvents().length} eventos programados
                  </p>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setViewType(viewType === 'month' ? 'year' : 'month')}
                    className="px-3 py-1 bg-blue-500 rounded-lg hover:bg-blue-400 text-sm"
                  >
                    Vista {viewType === 'month' ? 'Anual' : 'Mensual'}
                  </button>
                  <button
                    onClick={() => navigateMonth('prev')}
                    className="p-2 hover:bg-blue-500 rounded-lg"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setCurrentDate(new Date())}
                    className="px-3 py-1 bg-blue-500 rounded-lg hover:bg-blue-400 text-sm"
                  >
                    Hoy
                  </button>
                  <button
                    onClick={() => navigateMonth('next')}
                    className="p-2 hover:bg-blue-500 rounded-lg"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="p-4">
              {/* Day Headers */}
              <div className="grid grid-cols-7 mb-2">
                {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(day => (
                  <div key={day} className="text-center text-sm font-semibold text-gray-700 py-2">
                    {day}
                  </div>
                ))}
              </div>
              
              {/* Calendar Days */}
              <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-lg overflow-hidden">
                {renderCalendarGrid()}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Filters */}
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Filtros</h3>
            <div className="space-y-3">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">Todos los Eventos</option>
                <option value="declaration">Declaraciones</option>
                <option value="payment">Pagos</option>
                <option value="deadline">Vencimientos</option>
                <option value="holiday">Feriados</option>
              </select>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="hideCompleted"
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="hideCompleted" className="text-sm text-gray-700">
                  Ocultar completados
                </label>
              </div>
            </div>
          </div>

          {/* Upcoming Events */}
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Próximos Eventos</h3>
              <Bell className="h-5 w-5 text-gray-400" />
            </div>
            
            <div className="space-y-3">
              {upcomingEvents.map(event => (
                <div
                  key={event.id}
                  onClick={() => handleEventClick(event)}
                  className="p-3 rounded-lg border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-2">
                      <div className={`p-1 rounded ${getTypeColor(event.type)}`}>
                        {getTypeIcon(event.type)}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{event.title}</p>
                        <p className="text-xs text-gray-600">{formatDate(event.date)}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(event.priority)}`}>
                      {event.priority === 'high' ? 'Alta' : event.priority === 'medium' ? 'Media' : 'Baja'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Estadísticas del Mes</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Total Eventos</span>
                <span className="font-semibold">{fiscalEvents.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Completados</span>
                <span className="font-semibold text-green-600">
                  {fiscalEvents.filter(e => e.completed).length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Pendientes</span>
                <span className="font-semibold text-red-600">
                  {fiscalEvents.filter(e => !e.completed).length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Alta Prioridad</span>
                <span className="font-semibold text-orange-600">
                  {fiscalEvents.filter(e => e.priority === 'high' && !e.completed).length}
                </span>
              </div>
            </div>
          </div>

          {/* Venezuelan Fiscal Dates */}
          <div className="bg-gradient-to-br from-red-50 to-yellow-50 rounded-xl p-6 shadow-lg border-2 border-yellow-200">
            <div className="flex items-center mb-4">
              <Flag className="h-5 w-5 text-red-600 mr-2" />
              <h3 className="text-lg font-semibold text-red-900">Fechas Fiscales Venezuela</h3>
            </div>
            
            <div className="space-y-2">
              <div className="bg-white rounded-lg p-3 border border-red-200">
                <p className="text-sm font-medium text-red-900">IVA Mensual</p>
                <p className="text-xs text-red-700">Hasta el 15 de cada mes</p>
              </div>
              <div className="bg-white rounded-lg p-3 border border-red-200">
                <p className="text-sm font-medium text-red-900">ISLR Quincenal</p>
                <p className="text-xs text-red-700">15 y último día del mes</p>
              </div>
              <div className="bg-white rounded-lg p-3 border border-red-200">
                <p className="text-sm font-medium text-red-900">Declaración Anual</p>
                <p className="text-xs text-red-700">Hasta el 31 de enero</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Event Modal */}
      {showEventModal && selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Detalles del Evento</h2>
              <button
                onClick={() => setShowEventModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className={`p-3 rounded-lg ${getTypeColor(selectedEvent.type)} bg-gray-100`}>
                  {getTypeIcon(selectedEvent.type)}
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">{selectedEvent.title}</h3>
                  <p className="text-gray-600">{formatDate(selectedEvent.date)}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getPriorityColor(selectedEvent.priority)}`}>
                  Prioridad {selectedEvent.priority === 'high' ? 'Alta' : selectedEvent.priority === 'medium' ? 'Media' : 'Baja'}
                </span>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">Descripción</h4>
                <p className="text-gray-700">{selectedEvent.description}</p>
              </div>

              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <h4 className="font-semibold text-blue-900 mb-2">Estado</h4>
                <div className="flex items-center space-x-2">
                  {selectedEvent.completed ? (
                    <>
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      <span className="text-green-800 font-medium">Completado</span>
                    </>
                  ) : (
                    <>
                      <Clock className="h-5 w-5 text-orange-600" />
                      <span className="text-orange-800 font-medium">Pendiente</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              {!selectedEvent.completed && (
                <button
                  onClick={() => {
                    handleMarkCompleted(selectedEvent.id);
                    setShowEventModal(false);
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Marcar como Completado
                </button>
              )}
              <button
                onClick={() => setShowEventModal(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Event Form Modal */}
      {showNewEventForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Nuevo Evento Fiscal</h2>
              <button
                onClick={() => setShowNewEventForm(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Título del Evento</label>
                <input
                  type="text"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({...newEvent, title: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Ej: Declaración IVA Diciembre"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
                <input
                  type="date"
                  value={newEvent.date}
                  onChange={(e) => setNewEvent({...newEvent, date: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                <select
                  value={newEvent.type}
                  onChange={(e) => setNewEvent({...newEvent, type: e.target.value as any})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="declaration">Declaración</option>
                  <option value="payment">Pago</option>
                  <option value="deadline">Vencimiento</option>
                  <option value="holiday">Feriado</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Prioridad</label>
                <select
                  value={newEvent.priority}
                  onChange={(e) => setNewEvent({...newEvent, priority: e.target.value as any})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="low">Baja</option>
                  <option value="medium">Media</option>
                  <option value="high">Alta</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                <textarea
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({...newEvent, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Descripción detallada del evento..."
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setShowNewEventForm(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddEvent}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Guardar Evento
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}