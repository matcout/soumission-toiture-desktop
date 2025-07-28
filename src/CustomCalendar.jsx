// CustomCalendar.jsx - Calendrier intégré pour app desktop
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, Trash2, Edit3, GripVertical, Calendar as CalendarIcon } from 'lucide-react';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, serverTimestamp, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from './firebase';

// Utilitaires pour les dates
const getMonthName = (month) => {
  const months = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];
  return months[month];
};

const getDayName = (day) => {
  const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
  return days[day];
};

const isSameDay = (date1, date2) => {
  return date1.getFullYear() === date2.getFullYear() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getDate() === date2.getDate();
};

const formatDate = (date) => {
  return date.toISOString().split('T')[0];
};

const parseDate = (dateString) => {
  return new Date(dateString + 'T00:00:00');
};

// Composant Task draggable
const TaskItem = ({ task, onEdit, onDelete, isDragging, onDragStart, onDragEnd }) => {
  const handleDragStart = (e) => {
    e.dataTransfer.setData('text/plain', JSON.stringify(task));
    e.dataTransfer.effectAllowed = 'move';
    onDragStart(task);
  };

  const colorClasses = {
    blue: 'bg-blue-500 hover:bg-blue-600',
    green: 'bg-green-500 hover:bg-green-600',
    orange: 'bg-orange-500 hover:bg-orange-600',
    purple: 'bg-purple-500 hover:bg-purple-600',
    red: 'bg-red-500 hover:bg-red-600',
    indigo: 'bg-indigo-500 hover:bg-indigo-600'
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={onDragEnd}
      className={`
        ${colorClasses[task.color] || 'bg-blue-500 hover:bg-blue-600'} 
        text-white text-xs p-2 rounded mb-1 cursor-move relative group
        transition-all select-none
        ${isDragging ? 'opacity-50 scale-95' : ''}
      `}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-1 flex-1 min-w-0">
          <GripVertical className="w-3 h-3 flex-shrink-0 opacity-60" />
          <span className="truncate font-medium">{task.title}</span>
        </div>
        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onEdit(task);
            }}
            className="w-4 h-4 hover:bg-white hover:bg-opacity-20 rounded flex items-center justify-center"
          >
            <Edit3 className="w-3 h-3" />
          </button>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onDelete(task.id);
            }}
            className="w-4 h-4 hover:bg-red-500 rounded flex items-center justify-center"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>
      {task.description && (
        <div className="text-xs opacity-80 mt-1 truncate">
          {task.description}
        </div>
      )}
    </div>
  );
};

// Composant Modal pour créer/éditer une tâche
const TaskModal = ({ isOpen, onClose, onSave, task, selectedDates }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    color: 'blue'
  });

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title || '',
        description: task.description || '',
        startDate: task.startDate || '',
        endDate: task.endDate || '',
        color: task.color || 'blue'
      });
    } else if (selectedDates.length > 0) {
      const sortedDates = [...selectedDates].sort();
      setFormData({
        title: '',
        description: '',
        startDate: sortedDates[0],
        endDate: sortedDates[sortedDates.length - 1],
        color: 'blue'
      });
    }
  }, [task, selectedDates, isOpen]);

  const handleSubmit = () => {
    if (!formData.title.trim()) return;
    
    onSave({
      ...task,
      ...formData,
      id: task?.id || Date.now().toString()
    });
    onClose();
  };

  if (!isOpen) return null;

  const colors = [
    { name: 'blue', label: 'Bleu', class: 'bg-blue-500' },
    { name: 'green', label: 'Vert', class: 'bg-green-500' },
    { name: 'orange', label: 'Orange', class: 'bg-orange-500' },
    { name: 'purple', label: 'Violet', class: 'bg-purple-500' },
    { name: 'red', label: 'Rouge', class: 'bg-red-500' },
    { name: 'indigo', label: 'Indigo', class: 'bg-indigo-500' }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-lg font-semibold mb-4">
          {task ? 'Modifier la tâche' : 'Nouvelle tâche'}
        </h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Titre *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ex: Job 441 Verdun"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="3"
              placeholder="Détails optionnels..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date début
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date fin
              </label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Couleur
            </label>
            <div className="flex space-x-2">
              {colors.map((color) => (
                <button
                  key={color.name}
                  type="button"
                  onClick={() => setFormData({ ...formData, color: color.name })}
                  className={`
                    w-8 h-8 rounded-full ${color.class}
                    ${formData.color === color.name ? 'ring-2 ring-gray-400 ring-offset-2' : ''}
                  `}
                  title={color.label}
                />
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              {task ? 'Modifier' : 'Créer'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Composant principal Calendar
const CustomCalendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDates, setSelectedDates] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [draggedTask, setDraggedTask] = useState(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  

  // Charger les tâches depuis Firebase au démarrage
  useEffect(() => {
    const loadTasksFromFirebase = async () => {
      try {
        const tasksSnapshot = await getDocs(collection(db, 'calendar_tasks'));
        const loadedTasks = tasksSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setTasks(loadedTasks);
        setIsLoading(false);
      } catch (error) {
        console.error('❌ Erreur chargement tâches:', error);
        setIsLoading(false);
      }
    };

    loadTasksFromFirebase();

    // Écouter les changements en temps réel
    const unsubscribe = onSnapshot(collection(db, 'calendar_tasks'), (snapshot) => {
      const updatedTasks = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setTasks(updatedTasks);
    });

    return () => unsubscribe();
  }, []);

  // Calculer le premier jour du mois et générer le calendrier
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  const startDate = new Date(firstDayOfMonth);
  startDate.setDate(startDate.getDate() - firstDayOfMonth.getDay());

  const calendarDays = [];
  const current = new Date(startDate);
  
  for (let i = 0; i < 42; i++) {
    calendarDays.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }

  // Navigation mois
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    setSelectedDates([]);
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    setSelectedDates([]);
  };

  // Gestion de la sélection de dates
  const handleDateMouseDown = (date) => {
    const dateStr = formatDate(date);
    setIsSelecting(true);
    setSelectionStart(dateStr);
    setSelectedDates([dateStr]);
  };

  const handleDateMouseEnter = (date) => {
    if (!isSelecting || !selectionStart) return;
    
    const dateStr = formatDate(date);
    const start = parseDate(selectionStart);
    const end = parseDate(dateStr);
    
    const minDate = start < end ? start : end;
    const maxDate = start < end ? end : start;
    
    const selectedRange = [];
    const current = new Date(minDate);
    
    while (current <= maxDate) {
      selectedRange.push(formatDate(current));
      current.setDate(current.getDate() + 1);
    }
    
    setSelectedDates(selectedRange);
  };

  const handleDateMouseUp = () => {
    setIsSelecting(false);
    setSelectionStart(null);
  };

  // Sauvegarder une tâche dans Firebase
  // Sauvegarder une tâche dans Firebase
const saveTaskToFirebase = async (taskData) => {
  try {
    // Vérifier si c'est une tâche existante (ID Firebase réel)
    const existingTask = tasks.find(t => t.id === taskData.id);
    
    if (existingTask && typeof taskData.id === 'string' && !taskData.id.match(/^\d+$/)) {
      // C'est une tâche existante avec un vrai ID Firebase (pas juste des chiffres)
      console.log('🔄 Mise à jour tâche existante:', taskData.id);
      
      await updateDoc(doc(db, 'calendar_tasks', taskData.id), {
        title: taskData.title,
        description: taskData.description,
        startDate: taskData.startDate,
        endDate: taskData.endDate,
        color: taskData.color,
        updatedAt: serverTimestamp()
      });
    } else {
      // C'est une nouvelle tâche OU une tâche avec ID temporaire
      console.log('✨ Création nouvelle tâche');
      
      const docRef = await addDoc(collection(db, 'calendar_tasks'), {
        title: taskData.title,
        description: taskData.description,
        startDate: taskData.startDate,
        endDate: taskData.endDate,
        color: taskData.color,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      // Retourner le nouvel ID pour mise à jour locale
      return { ...taskData, id: docRef.id };
    }
  } catch (error) {
    console.error('❌ Erreur sauvegarde tâche:', error);
    throw error;
  }
};

  // Gestion des tâches
  const handleSaveTask = async (taskData) => {
    await saveTaskToFirebase(taskData);
    setEditingTask(null);
  };

  const handleEditTask = (task) => {
    setEditingTask(task);
    setShowTaskModal(true);
  };

  const handleDeleteTask = async (taskId) => {
    try {
      await deleteDoc(doc(db, 'calendar_tasks', taskId));
    } catch (error) {
      console.error('❌ Erreur suppression tâche:', error);
    }
  };

  // Drag & Drop
  const handleDragStart = (task) => {
    setDraggedTask(task);
  };

  const handleDragEnd = () => {
    setDraggedTask(null);
  };

const handleDrop = async (e, date) => {
  e.preventDefault();
  if (!draggedTask) return;

  const dateStr = formatDate(date);
  const taskStartDate = parseDate(draggedTask.startDate);
  const taskEndDate = parseDate(draggedTask.endDate);
  const taskDuration = Math.ceil((taskEndDate - taskStartDate) / (1000 * 60 * 60 * 24));

  const newStartDate = dateStr;
  const newEndDate = new Date(parseDate(dateStr));
  newEndDate.setDate(newEndDate.getDate() + taskDuration);

  const updatedTask = {
    ...draggedTask,
    startDate: newStartDate,
    endDate: formatDate(newEndDate)
  };

  try {
    // Sauvegarder en Firebase seulement
    await saveTaskToFirebase(updatedTask);
  } catch (error) {
    console.error('❌ Erreur lors du drag & drop:', error);
  }

  setDraggedTask(null);
  setSelectedDates([]); // ✅ CETTE LIGNE EFFACE LA SÉLECTION
  setIsSelecting(false); // ✅ AJOUT : Arrêter le mode sélection
  setSelectionStart(null); // ✅ AJOUT : Reset le point de départ
};

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  // Obtenir les tâches pour une date donnée
  const getTasksForDate = (date) => {
    const dateStr = formatDate(date);
    return tasks.filter(task => {
      const taskStart = parseDate(task.startDate);
      const taskEnd = parseDate(task.endDate);
      const currentDate = parseDate(dateStr);
      return currentDate >= taskStart && currentDate <= taskEnd;
    });
  };

  // Déplacer une sélection de tâches
// Déplacer une sélection de tâches
const moveSelectedTasksByDays = async (days) => {
  if (selectedDates.length === 0) return;

  const tasksToMove = tasks.filter(task => {
    const taskStart = parseDate(task.startDate);
    const taskEnd = parseDate(task.endDate);
    return selectedDates.some(dateStr => {
      const date = parseDate(dateStr);
      return date >= taskStart && date <= taskEnd;
    });
  });

  // Déplacer chaque tâche
  for (const task of tasksToMove) {
    const startDate = parseDate(task.startDate);
    const endDate = parseDate(task.endDate);
    
    startDate.setDate(startDate.getDate() + days);
    endDate.setDate(endDate.getDate() + days);
    
    const updatedTask = {
      ...task,
      startDate: formatDate(startDate),
      endDate: formatDate(endDate)
    };

    try {
      await saveTaskToFirebase(updatedTask);
    } catch (error) {
      console.error('❌ Erreur déplacement tâche:', task.id, error);
    }
  }
  
  // Déplacer aussi la sélection
  const newSelection = selectedDates.map(dateStr => {
    const date = parseDate(dateStr);
    date.setDate(date.getDate() + days);
    return formatDate(date);
  });
  setSelectedDates(newSelection);
};

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-2 text-gray-600">Chargement du calendrier...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      {/* En-tête avec navigation */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <CalendarIcon className="w-6 h-6 text-blue-500" />
            <h2 className="text-2xl font-bold text-gray-900">
              {getMonthName(currentDate.getMonth())} {currentDate.getFullYear()}
            </h2>
          </div>
          <div className="flex items-center space-x-1">
            <button
              onClick={goToPreviousMonth}
              className="p-2 hover:bg-gray-100 rounded-md"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={goToNextMonth}
              className="p-2 hover:bg-gray-100 rounded-md"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {selectedDates.length > 0 && (
            <div className="flex items-center space-x-2 text-sm text-gray-600 bg-gray-50 px-3 py-1 rounded-md">
              <span>{selectedDates.length} jour(s) sélectionné(s)</span>
              <button
                onClick={() => moveSelectedTasksByDays(-7)}
                className="px-2 py-1 text-xs bg-gray-200 hover:bg-gray-300 rounded"
              >
                ← 1 semaine
              </button>
              <button
                onClick={() => moveSelectedTasksByDays(7)}
                className="px-2 py-1 text-xs bg-gray-200 hover:bg-gray-300 rounded"
              >
                1 semaine →
              </button>
            </div>
          )}
          
          <button
            onClick={() => {
              setEditingTask(null);
              setShowTaskModal(true);
            }}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            disabled={selectedDates.length === 0}
          >
            <Plus className="w-4 h-4" />
            <span>Nouvelle tâche</span>
          </button>
        </div>
      </div>

      {/* En-têtes des jours */}
      <div className="grid grid-cols-7 gap-px mb-2">
        {['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'].map((day) => (
          <div key={day} className="p-3 text-center text-sm font-medium text-gray-600 bg-gray-50">
            {day}
          </div>
        ))}
      </div>

      {/* Grille du calendrier */}
      <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-lg overflow-hidden">
        {calendarDays.map((date, index) => {
          const dateStr = formatDate(date);
          const isCurrentMonth = date.getMonth() === currentDate.getMonth();
          const isToday = isSameDay(date, new Date());
          const isSelected = selectedDates.includes(dateStr);
          const dayTasks = getTasksForDate(date);

          return (
            <div
              key={index}
              className={`
                min-h-[120px] bg-white p-2 cursor-pointer select-none
                ${!isCurrentMonth ? 'bg-gray-50 text-gray-400' : ''}
                ${isSelected ? 'bg-blue-50 ring-2 ring-blue-500 ring-inset' : ''}
                hover:bg-gray-50 transition-colors
              `}
              onMouseDown={() => handleDateMouseDown(date)}
              onMouseEnter={() => handleDateMouseEnter(date)}
              onMouseUp={handleDateMouseUp}
              onDrop={(e) => handleDrop(e, date)}
              onDragOver={handleDragOver}
            >
              <div className={`
                text-sm font-medium mb-1
                ${isToday ? 'bg-blue-500 text-white w-6 h-6 rounded-full flex items-center justify-center' : ''}
              `}>
                {date.getDate()}
              </div>
              
              <div className="space-y-1">
                {dayTasks.map((task) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    onEdit={handleEditTask}
                    onDelete={handleDeleteTask}
                    isDragging={draggedTask?.id === task.id}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Instructions */}
      <div className="mt-4 text-sm text-gray-600 space-y-1">
        <p>• <strong>Sélectionner :</strong> Cliquez et faites glisser pour sélectionner plusieurs jours</p>
        <p>• <strong>Déplacer :</strong> Faites glisser une tâche vers une autre date ou utilisez les boutons de semaine</p>
        <p>• <strong>Créer :</strong> Sélectionnez des dates puis cliquez "Nouvelle tâche"</p>
      </div>

      {/* Modal de tâche */}
      <TaskModal
        isOpen={showTaskModal}
        onClose={() => {
          setShowTaskModal(false);
          setEditingTask(null);
        }}
        onSave={handleSaveTask}
        task={editingTask}
        selectedDates={selectedDates}
      />
    </div>
  );
};

export default CustomCalendar;