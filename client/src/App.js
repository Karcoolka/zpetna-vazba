import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useParams, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import GlobalStyles from './styles/GlobalStyles';

// Email Confirmation Component
const EmailConfirmation = () => {
  const { pendingConfirmation, confirmEmail, resendConfirmation, cancelConfirmation, isLoading } = useAuth();
  const navigate = useNavigate();
  const [confirmationCode, setConfirmationCode] = React.useState('');
  const [message, setMessage] = React.useState('');

  React.useEffect(() => {
    if (!pendingConfirmation) {
      navigate('/login');
    }
  }, [pendingConfirmation, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    
    try {
      const result = await confirmEmail(confirmationCode);
      if (result.success) {
        navigate('/dashboard');
      } else {
        setMessage('Chyba: ' + result.error);
      }
    } catch (error) {
      setMessage('Chyba: ' + error.message);
    }
  };

  const handleResend = async () => {
    setMessage('');
    try {
      const result = await resendConfirmation();
      if (result.success) {
        setMessage('Potvrzovací email byl znovu odeslán.');
      } else {
        setMessage('Chyba: ' + result.error);
      }
    } catch (error) {
      setMessage('Chyba: ' + error.message);
    }
  };

  const handleCancel = () => {
    cancelConfirmation();
    navigate('/login');
  };

  if (!pendingConfirmation) {
    return null;
  }

  return (
    <div style={{ padding: '20px', maxWidth: '400px', margin: '100px auto' }}>
      <h2>Potvrďte svůj email</h2>
      <p>
        Na váš email <strong>{pendingConfirmation.email}</strong> jsme vám poslali potvrzovací kód.
        Zadejte ho níže pro dokončení přihlášení.
      </p>
      
      <div style={{ 
        backgroundColor: '#fff3cd', 
        border: '1px solid #ffeaa7',
        borderRadius: '4px',
        padding: '12px',
        marginBottom: '15px',
        fontSize: '14px',
        color: '#856404'
      }}>
        <strong>💡 Tip:</strong> Pokud email nevidíte, zkontrolujte prosím složku <strong>spam/nevyžádaná pošta</strong>. 
        Automatické emaily se někdy dostávají do této složky.
      </div>
      
      {message && (
        <div style={{ 
          padding: '10px', 
          marginBottom: '10px', 
          backgroundColor: message.startsWith('Chyba') ? '#f8d7da' : '#d4edda',
          color: message.startsWith('Chyba') ? '#721c24' : '#155724',
          border: '1px solid ' + (message.startsWith('Chyba') ? '#f5c6cb' : '#c3e6cb'),
          borderRadius: '4px'
        }}>
          {message}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '15px' }}>
          <label>Potvrzovací kód:</label>
          <input 
            type="text" 
            value={confirmationCode}
            onChange={(e) => setConfirmationCode(e.target.value.toUpperCase())}
            required 
            style={{ 
              width: '100%', 
              padding: '8px',
              textAlign: 'center',
              fontSize: '18px',
              letterSpacing: '2px'
            }}
            placeholder="např. A1B2C3"
            maxLength={6}
          />
        </div>
        <button 
          type="submit" 
          disabled={isLoading || confirmationCode.length !== 6}
          style={{ 
            padding: '10px 20px', 
            backgroundColor: '#28a745', 
            color: 'white', 
            border: 'none',
            width: '100%',
            marginBottom: '10px',
            opacity: (isLoading || confirmationCode.length !== 6) ? 0.6 : 1
          }}
        >
          {isLoading ? 'Ověřuji...' : 'Potvrdit'}
        </button>
      </form>
      
      <div style={{ textAlign: 'center', marginTop: '15px' }}>
        <button 
          onClick={handleResend}
          style={{ 
            background: 'none', 
            border: 'none', 
            color: '#007bff', 
            cursor: 'pointer',
            textDecoration: 'underline',
            marginRight: '15px'
          }}
        >
          Odeslat znovu
        </button>
        <button 
          onClick={handleCancel}
          style={{ 
            background: 'none', 
            border: 'none', 
            color: '#6c757d', 
            cursor: 'pointer',
            textDecoration: 'underline'
          }}
        >
          Zpět na přihlášení
        </button>
      </div>
      
      <div style={{ marginTop: '20px', fontSize: '14px', color: '#6c757d' }}>
        <p>Tip: Potvrzovací kód je platný 15 minut a obsahuje 6 znaků (písmena a čísla).</p>
      </div>
    </div>
  );
};

// Simple Login Component
const Login = () => {
  const { login, isAuthenticated, pendingConfirmation } = useAuth();
  const navigate = useNavigate();

  // Redirect if already logged in or pending confirmation
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    } else if (pendingConfirmation) {
      navigate('/confirm-email');
    }
  }, [isAuthenticated, pendingConfirmation, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    try {
      const result = await login({
        username: formData.get('username'),
        password: formData.get('password')
      });
      if (result.success) {
        if (result.requiresConfirmation) {
          navigate('/confirm-email');
        } else {
          navigate('/dashboard');
        }
      } else {
        alert('Přihlášení se nezdařilo: ' + result.error);
      }
    } catch (error) {
      alert('Přihlášení se nezdařilo: ' + error.message);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '400px', margin: '100px auto' }}>
      <h2>Zpětná vazba - Přihlášení</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '10px' }}>
          <label>Uživatelské jméno:</label>
          <input type="text" name="username" required style={{ width: '100%', padding: '8px' }} />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label>Heslo:</label>
          <input type="password" name="password" required style={{ width: '100%', padding: '8px' }} />
        </div>
        <button type="submit" style={{ padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none' }}>
          Přihlásit se
        </button>
      </form>
    </div>
  );
};

// Navigation Menu Component
const Navigation = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const menuItems = [
    { path: '/dashboard', label: 'Dashboard', visibleTo: 'all' },
    { path: '/survey-creator', label: 'Survey Creator', visibleTo: 'all' },
    { path: '/surveys', label: 'Survey List', visibleTo: 'all' },
    { path: '/global-surveys', label: 'Global Surveys', visibleTo: 'admin' },
    { path: '/tokens', label: 'Survey Tokenisation', visibleTo: 'all' },
    { path: '/users', label: 'Users', visibleTo: 'admin' },
    { path: '/logs', label: 'Logs', visibleTo: 'admin' },
    { path: '/settings', label: 'Settings', visibleTo: 'all' }
  ];

  const filteredItems = menuItems.filter(item => 
    item.visibleTo === 'all' || (item.visibleTo === 'admin' && user?.role === 'admin')
  );

  return (
    <nav style={{ 
      backgroundColor: '#f8f9fa', 
      padding: '10px 20px', 
      borderBottom: '1px solid #dee2e6',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }}>
      <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
        <h2 style={{ 
          margin: 0, 
          color: '#262626',
          fontFamily: 'Roboto, sans-serif',
          fontWeight: 400,
          fontSize: '24px',
          lineHeight: '150%',
          letterSpacing: '3.12%'
        }}>Zpětná vazba</h2>
        <div style={{ display: 'flex', gap: '15px' }}>
          {filteredItems.map(item => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              style={{
                background: 'none',
                border: 'none',
                color: '#007bff',
                cursor: 'pointer',
                padding: '5px 10px',
                textDecoration: 'underline'
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span>Přihlášen jako: {user?.username} ({user?.role})</span>
        <button 
          onClick={logout}
          style={{ padding: '5px 10px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '3px' }}
        >
          Odhlásit se
        </button>
      </div>
    </nav>
  );
};

// Simple Dashboard Component
const Dashboard = () => {
  return (
    <div style={{ padding: '20px' }}>
      <h3>Vítejte v systému zpětné vazby!</h3>
      <p>Základní funkcionalita aplikace:</p>
      <ul>
        <li><strong>Survey Creator</strong> - Vytvářejte nové dotazníky</li>
        <li><strong>Survey List</strong> - Spravujte existující dotazníky</li>
        <li><strong>Survey Tokenisation</strong> - Vytvářejte embedovatelné widgety</li>
        <li><strong>Users</strong> - Správa uživatelů (pouze admin)</li>
        <li><strong>Logs</strong> - Audit trail (pouze admin)</li>
        <li><strong>Settings</strong> - Osobní nastavení</li>
      </ul>
    </div>
  );
};

// Placeholder components for menu items
const SurveyCreator = ({ editingSurveyId = null, globalMode = false }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = React.useState(globalMode ? 2 : 1);
  const [isEditMode, setIsEditMode] = React.useState(!!editingSurveyId);
  const [originalSurveyId, setOriginalSurveyId] = React.useState(editingSurveyId);
  const [loadingSurvey, setLoadingSurvey] = React.useState(!!editingSurveyId);
  
  // Initialize survey structure based on mode
  const getInitialSurvey = () => {
    if (globalMode) {
      return {
        title: 'Globální sekce',
        description: 'Úprava globálních sekcí sdílených napříč všemi průzkumy',
        cards: [
          {
            id: 2,
            title: 'Úvodní sekce',
            description: 'Systémová úvodní část (pouze admin)',
            isAdminOnly: true,
            isEditable: true,
            steps: []
          },
          {
            id: 4,
            title: 'Závěrečná sekce',
            description: 'Systémová závěrečná část (pouze admin)',
            isAdminOnly: true,
            isEditable: true,
            steps: []
          }
        ]
      };
    } else {
      return {
        title: '',
        description: '',
        cards: [
          {
            id: 0,
            title: 'Floating Widget',
            description: 'Floating feedback widget',
            isAdminOnly: false,
            isEditable: false,
            isSystem: true,
            steps: [
              {
                id: 'floating-widget',
                type: 'floating-widget',
                question: 'Floating feedback widget',
                isSystem: true,
                uneditable: true
              }
            ]
          },
          {
            id: 1,
            title: 'Feedback Modal',
            description: 'Feedback options',
            isAdminOnly: false,
            isEditable: false,
            isSystem: true,
            steps: [
              {
                id: 'feedback-modal',
                type: 'feedback-modal',
                question: 'Feedback options',
                isSystem: true,
                uneditable: true
              }
            ]
          },
          {
            id: 2,
            title: 'Úvodní sekce',
            description: 'Systémová úvodní část (pouze admin)',
            isAdminOnly: true,
            isEditable: false,
            steps: []
          },
          {
            id: 3,
            title: 'Hlavní obsah',
            description: 'Editovatelná část pro uživatele',
            isAdminOnly: false,
            isEditable: true,
            steps: []
          },
          {
            id: 4,
            title: 'Závěrečná sekce',
            description: 'Systémová závěrečná část (pouze admin)',
            isAdminOnly: true,
            isEditable: false,
            steps: []
          }
        ]
      };
    }
  };

  const [survey, setSurvey] = React.useState(getInitialSurvey());

  // Load existing survey for editing or global sections
  React.useEffect(() => {
    if (globalMode) {
      loadGlobalSections();
    } else if (editingSurveyId) {
      loadSurveyForEditing(editingSurveyId);
    } else {
      loadGlobalSectionsForUserSurvey();
    }
  }, [editingSurveyId, globalMode]);

  const loadGlobalSections = async () => {
    try {
      setLoadingSurvey(true);
      const response = await fetch('/api/global-surveys/sections', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSurvey(prev => ({
          ...prev,
          cards: prev.cards.map(card => {
            if (card.id === 2) { // Úvodní sekce
              return { ...card, steps: data.introSection || [] };
            } else if (card.id === 4) { // Závěrečná sekce
              return { ...card, steps: data.outroSection || [] };
            }
            return card;
          })
        }));
      }
    } catch (error) {
      console.error('Error loading global sections:', error);
    } finally {
      setLoadingSurvey(false);
    }
  };

  const loadGlobalSectionsForUserSurvey = async () => {
    try {
      const response = await fetch('/api/global-surveys/sections', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        
        // Update the intro and outro sections with global content
        setSurvey(prev => ({
          ...prev,
          cards: prev.cards.map(card => {
            if (card.id === 2) { // Úvodní sekce
              return { ...card, steps: data.introSection || [] };
            } else if (card.id === 4) { // Závěrečná sekce
              return { ...card, steps: data.outroSection || [] };
            }
            return card;
          })
        }));
      }
    } catch (error) {
      console.error('Error loading global sections:', error);
    }
  };

  const loadSurveyForEditing = async (surveyId) => {
    try {
      setLoadingSurvey(true);
      const response = await fetch(`/api/surveys/${surveyId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const surveyData = await response.json();
        setSurvey({
          title: surveyData.title,
          description: surveyData.description,
          cards: surveyData.config.cards || survey.cards // Use existing cards as fallback
        });
        setIsEditMode(true);
        setOriginalSurveyId(surveyId);
      } else {
        throw new Error('Chyba při načítání dotazníku');
      }
    } catch (error) {
      console.error('Error loading survey:', error);
      alert('Chyba při načítání dotazníku: ' + error.message);
      navigate('/surveys');
    } finally {
      setLoadingSurvey(false);
    }
  };

  const [activeCardIndex, setActiveCardIndex] = React.useState(globalMode ? 0 : 2); // Default to first global card in global mode

  const [editingStep, setEditingStep] = React.useState(null);
  const [showStepEditor, setShowStepEditor] = React.useState(false);
  const [draggedStep, setDraggedStep] = React.useState(null);
  const [dragOverIndex, setDragOverIndex] = React.useState(null);

  const saveSurvey = async () => {
    try {
      if (globalMode) {
        // Save global sections
        const introCard = survey.cards.find(card => card.id === 2);
        const outroCard = survey.cards.find(card => card.id === 4);
        
        const response = await fetch('/api/global-surveys/sections', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            introSection: introCard?.steps || [],
            outroSection: outroCard?.steps || []
          })
        });

        if (response.ok) {
          alert('Globální sekce byly úspěšně uloženy!');
        } else {
          throw new Error('Chyba při ukládání globálních sekcí');
        }
      } else {
        // Regular survey save
        const url = isEditMode ? `/api/surveys/${originalSurveyId}` : '/api/surveys';
        const method = isEditMode ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
          method: method,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            title: survey.title,
            description: survey.description,
            config: {
              cards: survey.cards,
              steps: survey.cards.flatMap(card => card.steps || [])
            }
          })
        });

        if (response.ok) {
          if (isEditMode) {
            alert('Průzkum byl úspěšně aktualizován!');
            navigate('/surveys');
          } else {
            alert('Průzkum byl úspěšně uložen!');
            // Reset form for new survey
            setSurvey(getInitialSurvey());
            setCurrentStep(1);
          }
        } else {
          alert(isEditMode ? 'Chyba při aktualizaci průzkumu' : 'Chyba při ukládání průzkumu');
        }
      }
    } catch (error) {
      console.error('Error saving survey:', error);
      alert(globalMode ? 'Chyba při ukládání globálních sekcí' : (isEditMode ? 'Chyba při aktualizaci průzkumu' : 'Chyba při ukládání průzkumu'));
    }
  };

  const addStep = (stepData) => {
    const newStep = {
      id: Date.now(),
      ...stepData
    };
    setSurvey(prev => ({
      ...prev,
      cards: prev.cards.map((card, index) => 
        index === activeCardIndex 
          ? { ...card, steps: [...card.steps, newStep] }
          : card
      )
    }));
    setShowStepEditor(false);
    setEditingStep(null);
  };

  const updateStep = (stepData) => {
    setSurvey(prev => ({
      ...prev,
      cards: prev.cards.map((card, index) => 
        index === activeCardIndex 
          ? { 
              ...card, 
              steps: card.steps.map(step => 
                step.id === editingStep.id ? { ...editingStep, ...stepData } : step
              )
            }
          : card
      )
    }));
    setShowStepEditor(false);
    setEditingStep(null);
  };

  const deleteStep = (stepId, cardIndex) => {
    if (window.confirm('Opravdu chcete smazat tento blok?')) {
      setSurvey(prev => ({
        ...prev,
        cards: prev.cards.map((card, index) => 
          index === cardIndex 
            ? { ...card, steps: card.steps.filter(step => step.id !== stepId) }
            : card
        )
      }));
    }
  };

  const moveStep = (stepId, direction) => {
    const activeCard = survey.cards[activeCardIndex];
    if (!activeCard) return;
    
    const steps = [...activeCard.steps];
    const currentIndex = steps.findIndex(step => step.id === stepId);
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    
    if (newIndex >= 0 && newIndex < steps.length) {
      [steps[currentIndex], steps[newIndex]] = [steps[newIndex], steps[currentIndex]];
      setSurvey(prev => ({
        ...prev,
        cards: prev.cards.map((card, index) => 
          index === activeCardIndex ? { ...card, steps } : card
        )
      }));
    }
  };

  // Drag and Drop handlers
  const handleDragStart = (e, index) => {
    setDraggedStep(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.target.parentNode);
    e.dataTransfer.setDragImage(e.target, 0, 0);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  const handleDragLeave = (e) => {
    // Only clear drag over if we're actually leaving the component
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDragOverIndex(null);
    }
  };

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    
    if (draggedStep === null || draggedStep === dropIndex) {
      setDraggedStep(null);
      setDragOverIndex(null);
      return;
    }

    const activeCard = survey.cards[activeCardIndex];
    if (!activeCard) {
      setDraggedStep(null);
      setDragOverIndex(null);
      return;
    }

    const newSteps = [...activeCard.steps];
    const draggedItem = newSteps[draggedStep];
    
    // Remove dragged item
    newSteps.splice(draggedStep, 1);
    
    // Insert at new position
    const actualDropIndex = draggedStep < dropIndex ? dropIndex - 1 : dropIndex;
    newSteps.splice(actualDropIndex, 0, draggedItem);
    
    setSurvey(prev => ({
      ...prev,
      cards: prev.cards.map((card, index) => 
        index === activeCardIndex ? { ...card, steps: newSteps } : card
      )
    }));
    setDraggedStep(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedStep(null);
    setDragOverIndex(null);
  };

  if (loadingSurvey) {
    return (
      <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
        <h2>Survey Creator</h2>
        <div style={{ marginTop: '50px' }}>
          <div style={{ fontSize: '18px', marginBottom: '20px' }}>Načítání dotazníku...</div>
          <div style={{ fontSize: '14px', color: '#6c757d' }}>Prosím počkejte, než se načtou data dotazníku</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h2>{globalMode ? 'Správa globálních sekcí' : (isEditMode ? 'Editace dotazníku' : 'Survey Creator')}</h2>
      <p style={{ color: '#6c757d', marginBottom: '30px' }}>
        {globalMode 
          ? 'Upravte globální sekce "Úvodní sekce" a "Závěrečná sekce" sdílené napříč všemi průzkumy' 
          : (isEditMode ? 'Upravujte existující průzkum a změny budou uloženy jako nová verze' : 'Vytvořte vlastní průzkum pomocí různých stavebních bloků')
        }
      </p>
      
      {isEditMode && (
        <div style={{ 
          backgroundColor: '#e3f2fd', 
          border: '1px solid #2196f3', 
          borderRadius: '8px', 
          padding: '16px', 
          marginBottom: '20px' 
        }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '20px', marginRight: '8px' }}>✏️</span>
            <strong style={{ color: '#1976d2' }}>EDITAČNÍ REŽIM</strong>
          </div>
          <p style={{ margin: '0', color: '#1976d2', fontSize: '14px' }}>
            Upravujete dotazník: <strong>"{survey.title}"</strong>. 
            Po uložení bude vytvořena nová aktualizovaná verze průzkumu.
          </p>
        </div>
      )}

      {/* Survey Basic Info */}
      {currentStep === 1 && (
        <div style={{ 
          backgroundColor: '#f8f9fa', 
          padding: '30px', 
          borderRadius: '8px', 
          marginBottom: '20px',
          border: '1px solid #dee2e6'
        }}>
          <h3>Krok 1: Základní informace</h3>
          
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
              Název průzkumu *
            </label>
            <input
              type="text"
              value={survey.title}
              onChange={(e) => setSurvey(prev => ({ ...prev, title: e.target.value }))}
              style={{ 
                width: '100%', 
                padding: '12px', 
                border: '1px solid #ced4da', 
                borderRadius: '4px',
                fontSize: '16px'
              }}
              placeholder="Zadejte název vašeho průzkumu"
            />
          </div>

          <div style={{ marginBottom: '30px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
              Popis průzkumu
            </label>
            <textarea
              value={survey.description}
              onChange={(e) => setSurvey(prev => ({ ...prev, description: e.target.value }))}
              style={{ 
                width: '100%', 
                padding: '12px', 
                border: '1px solid #ced4da', 
                borderRadius: '4px',
                fontSize: '16px',
                minHeight: '100px',
                resize: 'vertical'
              }}
              placeholder="Popište účel a obsah vašeho průzkumu"
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div></div>
            <button 
              onClick={() => setCurrentStep(2)}
              disabled={!survey.title}
              style={{ 
                position: 'relative',
                padding: '12px 24px',
                backgroundColor: survey.title ? 'rgb(0, 123, 255)' : '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '16px',
                cursor: survey.title ? 'pointer' : 'not-allowed'
              }}
            >
              Další krok →
            </button>
          </div>
        </div>
      )}

      {/* Survey Steps Builder */}
      {currentStep === 2 && (
        <div>
          <h3 style={{ marginBottom: '10px' }}>Krok 2: Stavba průzkumu</h3>
          <small style={{ color: '#6c757d', display: 'block', marginBottom: '20px' }}>
            💡 Tip: Přetáhněte stavební bloky z nabídky vlevo do oblasti průzkumu vpravo
          </small>
          
          {/* Global sections warning */}
          {globalMode ? (
            <div style={{
              backgroundColor: '#fff3cd',
              border: '1px solid #ffeaa7',
              borderRadius: '8px',
              padding: '16px',
              marginBottom: '20px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '20px', marginRight: '8px' }}>🌐</span>
                <strong style={{ color: '#856404' }}>SPRÁVA GLOBÁLNÍCH SEKCÍ</strong>
              </div>
              <p style={{ margin: '0', color: '#856404', fontSize: '14px' }}>
                Upravujete <strong>globální sekce</strong> sdílené napříč všemi průzkumy.
                Změny zde ovlivní <strong>všechny existující dotazníky</strong> v systému.
                Pouze jedna verze globálních sekcí existuje a je automaticky zahrnuta do všech surveys.
              </p>
            </div>
          ) : (
            <div style={{
              backgroundColor: '#e3f2fd',
              border: '1px solid #2196f3',
              borderRadius: '8px',
              padding: '16px',
              marginBottom: '20px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '20px', marginRight: '8px' }}>🌐</span>
                <strong style={{ color: '#1976d2' }}>GLOBÁLNÍ SEKCE</strong>
              </div>
              <p style={{ margin: '0', color: '#1976d2', fontSize: '14px' }}>
                <strong>"Úvodní sekce"</strong> a <strong>"Závěrečná sekce"</strong> jsou <strong>globální napříč všemi průzkumy</strong>.
                {user?.role === 'admin' ? (
                  <>
                    Pro správu těchto sekcí doporučujeme použít dedikovanou stránku{' '}
                    <a 
                      href="/global-surveys" 
                      style={{ color: '#1976d2', fontWeight: 'bold', textDecoration: 'underline' }}
                      onClick={(e) => {
                        e.preventDefault();
                        navigate('/global-surveys');
                      }}
                    >
                      Global Surveys
                    </a>
                    {' '}kde máte lepší přehled a kontrolu nad globálními sekcemi.
                  </>
                ) : (
                  <>
                    Tyto sekce spravuje administrátor a jsou automaticky zahrnuty do všech dotazníků.
                  </>
                )}
              </p>
            </div>
          )}

          <div style={{ display: 'flex', gap: '20px', minHeight: '500px' }}>
            {/* Building Blocks Palette */}
            <div style={{ 
              width: '300px', 
              backgroundColor: '#f8f9fa', 
              border: '1px solid #dee2e6',
              borderRadius: '8px',
              padding: '20px'
            }}>
              <h4 style={{ margin: '0 0 15px 0', color: '#495057' }}>
                📦 Stavební bloky
              </h4>
              <BuildingBlocksPalette />
            </div>

            {/* Survey Canvas */}
            <div style={{ 
              flex: 1,
              backgroundColor: 'white',
              border: '2px solid #dee2e6',
              borderRadius: '8px',
              minHeight: '500px',
              position: 'relative'
            }}>
              <div style={{ 
                padding: '20px',
                borderBottom: '1px solid #dee2e6',
                backgroundColor: '#f8f9fa'
              }}>
                <h4 style={{ margin: 0, color: '#495057' }}>
                  🎯 Oblast průzkumu
                </h4>
                <small style={{ color: '#6c757d' }}>
                  Přetáhněte bloky sem a uspořádejte je v požadovaném pořadí
                </small>
              </div>
              
              <SurveyCardManager 
                survey={survey}
                activeCardIndex={activeCardIndex}
                onActiveCardChange={setActiveCardIndex}
                onSurveyChange={setSurvey}
                onEditStep={(step) => {
                  setEditingStep(step);
                  setShowStepEditor(true);
                }}
                onDeleteStep={deleteStep}
                user={user}
                globalMode={globalMode}
              />
            </div>
          </div>

          {/* Bottom Navigation Buttons */}
          <div style={{ 
            display: 'flex', 
            justifyContent: globalMode ? 'center' : 'space-between', 
            marginTop: '30px',
            padding: '20px 0',
            borderTop: '1px solid #dee2e6'
          }}>
            {!globalMode && (
              <button 
                onClick={() => setCurrentStep(1)}
                style={{ 
                  position: 'relative',
                  padding: '12px 24px',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '16px',
                  cursor: 'pointer'
                }}
              >
                ← Zpět
              </button>
            )}
            {globalMode ? (
              <button 
                onClick={saveSurvey}
                style={{ 
                  position: 'relative',
                  padding: '12px 24px',
                  backgroundColor: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '16px',
                  cursor: 'pointer'
                }}
              >
                💾 Uložit globální sekce
              </button>
            ) : (
              <button 
                onClick={() => setCurrentStep(3)}
                disabled={survey.cards.every(card => card.steps.length === 0)}
                style={{ 
                  position: 'relative',
                  padding: '12px 24px',
                  backgroundColor: survey.cards.some(card => card.steps.length > 0) ? 'rgb(0, 123, 255)' : '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '16px',
                  cursor: survey.cards.some(card => card.steps.length > 0) ? 'pointer' : 'not-allowed'
                }}
              >
                Náhled →
              </button>
            )}
          </div>
        </div>
      )}

      {/* Preview */}
      {currentStep === 3 && (
        <div>
          <h3>Krok 3: Náhled a uložení</h3>
          
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '30px' }}>
            <SurveyPreview 
              survey={survey} 
              onClose={() => setCurrentStep(2)}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '30px' }}>
            <button 
              onClick={() => setCurrentStep(2)}
              style={{ 
                position: 'relative',
                padding: '12px 24px',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '16px',
                cursor: 'pointer'
              }}
            >
              ← Upravit
            </button>
            <button 
              onClick={saveSurvey}
              style={{ 
                position: 'relative',
                padding: '12px 24px',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '16px',
                cursor: 'pointer'
              }}
            >
              {isEditMode ? 'Aktualizovat novou verzi' : 'Uložit průzkum'}
            </button>
          </div>
        </div>
      )}

      {/* Step Editor Modal */}
      {showStepEditor && (
        <SurveyStepEditor 
          step={editingStep}
          onSave={editingStep ? updateStep : addStep}
          onCancel={() => {
            setShowStepEditor(false);
            setEditingStep(null);
          }}
        />
      )}
    </div>
  );
};

// Survey Builder Supporting Components
const SurveyStepCard = ({ 
  step, 
  index, 
  onEdit, 
  onDelete,
  onDragStart,
  isDragging,
  isInCanvas = false,
  canEdit = true
}) => {
  const getStepIcon = (type) => {
    switch (type) {
      case 'smiley': return '😊';
      case 'single-choice': return '📝';
      case 'dropdown-multiselect': return '☑️';
      case 'text': return '📄';
      case 'section-header': return '📋';
      case 'floating-widget': return '🔧';
      case 'feedback-modal': return '💬';
      default: return '❓';
    }
  };

  const getStepTypeName = (type) => {
    switch (type) {
      case 'smiley': return '5-bodové hodnocení smajlíky';
      case 'single-choice': return 'Jednoduché výběr';
      case 'dropdown-multiselect': return 'Vícenásobný výběr (dropdown)';
      case 'text': return 'Textové pole';
      case 'section-header': return 'Nadpis sekce';
      case 'floating-widget': return 'Plovoucí widget';
      case 'feedback-modal': return 'Feedback modal';
      default: return 'Neznámý typ';
    }
  };

  return (
    <div 
      draggable={isInCanvas && canEdit}
      onDragStart={isInCanvas && canEdit ? (e) => onDragStart(e, index) : undefined}
      style={{
        border: step.type === 'section-header' ? '2px solid #ffb74d' : '2px solid #dee2e6',
        borderRadius: '8px',
        padding: step.type === 'section-header' ? '15px 20px' : '20px',
        marginBottom: '15px',
        backgroundColor: isDragging ? '#f0f7ff' : (step.type === 'section-header' ? '#fff8e1' : 'white'),
        boxShadow: isDragging ? '0 6px 12px rgba(0,0,0,0.15)' : '0 2px 4px rgba(0,0,0,0.1)',
        opacity: isDragging ? 0.8 : (canEdit ? 1 : 0.7),
        cursor: isInCanvas && canEdit ? 'move' : 'default',
        transition: 'all 0.2s ease',
        transform: isDragging ? 'rotate(2deg) scale(1.02)' : 'rotate(0deg) scale(1)'
      }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {isInCanvas && canEdit && (
          <div style={{ display: 'flex', alignItems: 'center', marginRight: '15px' }}>
            <div 
              style={{ 
                cursor: isDragging ? 'grabbing' : 'grab', 
                fontSize: '20px', 
                color: isDragging ? '#007bff' : '#6c757d',
                marginRight: '10px',
                userSelect: 'none',
                padding: '4px',
                borderRadius: '4px',
                backgroundColor: isDragging ? '#e3f2fd' : 'transparent',
                transition: 'all 0.2s ease'
              }}
              title="Přetáhnout pro změnu pořadí"
            >
              ⋮⋮
            </div>
          </div>
        )}
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontSize: '20px', marginRight: '10px' }}>
              {getStepIcon(step.type)}
            </span>
            <div>
              {step.type === 'section-header' ? (
                <div>
                  <h3 style={{ 
                    margin: '0', 
                    color: '#f57c00',
                    fontSize: '18px',
                    fontWeight: 'bold'
                  }}>
                    📋 {step.question || 'Název sekce'}
                  </h3>
                  <small style={{ 
                    color: '#e65100', 
                    fontFamily: 'Roboto, sans-serif',
                    fontWeight: 400,
                    fontSize: '14px',
                    lineHeight: '150%',
                    letterSpacing: '1.25%'
                  }}>
                    {getStepTypeName(step.type)}
                  </small>
                </div>
              ) : (
                <div>
                  <h4 style={{ 
                    margin: '0', 
                    color: '#262626',
                    fontFamily: 'Roboto, sans-serif',
                    fontWeight: 400,
                    fontSize: '18px',
                    lineHeight: '150%',
                    letterSpacing: '1.25%'
                  }}>
                    Blok {index + 1}: {step.question || 'Bez názvu'}
                  </h4>
                  <small style={{ 
                    color: '#6c757d',
                    fontFamily: 'Roboto, sans-serif',
                    fontWeight: 400,
                    fontSize: '14px',
                    lineHeight: '150%',
                    letterSpacing: '1.25%'
                  }}>
                    {getStepTypeName(step.type)}
                  </small>
                </div>
              )}
            </div>
          </div>
          
          {step.options && step.options.length > 0 && (
            <div style={{ marginTop: '10px' }}>
              <small style={{ 
                color: '#6c757d',
                fontFamily: 'Roboto, sans-serif',
                fontWeight: 400,
                fontSize: '14px',
                lineHeight: '150%',
                letterSpacing: '1.25%'
              }}>Možnosti:</small>
              <div style={{ marginTop: '5px' }}>
                {step.options.slice(0, 3).map((option, i) => (
                  <span key={i} style={{
                    display: 'inline-block',
                    backgroundColor: '#e9ecef',
                    padding: '2px 6px',
                    borderRadius: '3px',
                    fontSize: '12px',
                    marginRight: '5px'
                  }}>
                    {option}
                  </span>
                ))}
                {step.options.length > 3 && (
                  <span style={{ color: '#6c757d', fontSize: '12px' }}>
                    ... a {step.options.length - 3} dalších
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {canEdit && !step.isSystem && !step.uneditable && (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button
              onClick={onEdit}
              style={{
                padding: '6px 12px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '12px'
              }}
            >
              ✏️ Upravit
            </button>
            <button
              onClick={onDelete}
              style={{
                padding: '6px 12px',
                backgroundColor: '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '12px'
              }}
            >
              🗑️ Smazat
            </button>
          </div>
        )}
        {(!canEdit || step.isSystem || step.uneditable) && (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center',
            color: '#dc3545',
            fontSize: '16px',
            flexDirection: 'column',
            gap: '4px'
          }}>
            {step.isSystem || step.uneditable ? (
              <div style={{
                backgroundColor: '#dc3545',
                color: 'white',
                borderRadius: '4px',
                padding: '2px 6px',
                fontSize: '10px',
                fontWeight: 'bold'
              }}>
                SYSTEM
              </div>
            ) : (
              <div>🔒</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const SurveyStepEditor = ({ step, onSave, onCancel }) => {
  const [formData, setFormData] = React.useState({
    type: step?.type || 'smiley',
    question: step?.question || '',
    options: step?.options || [],
    required: step?.required || true,
    conditionalTriggers: step?.conditionalTriggers || [],
    hasTextbox: step?.hasTextbox || false,
    textboxPlaceholder: step?.textboxPlaceholder || ''
  });

  const [newOption, setNewOption] = React.useState('');

  const addOption = () => {
    if (newOption.trim()) {
      setFormData(prev => ({
        ...prev,
        options: [...prev.options, newOption.trim()]
      }));
      setNewOption('');
    }
  };

  const removeOption = (index) => {
    setFormData(prev => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.question.trim()) {
      alert('Zadejte prosím otázku');
      return;
    }
    if ((formData.type === 'single-choice' || formData.type === 'multi-select' || formData.type === 'rating-scale') && formData.type !== 'section-header' && formData.options.length === 0) {
      alert('Přidejte prosím alespoň jednu možnost');
      return;
    }
    onSave(formData);
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '30px',
        maxWidth: '600px',
        width: '90%',
        maxHeight: '80vh',
        overflow: 'auto'
      }}>
        <h3>{step ? 'Upravit blok' : 'Přidat nový blok'}</h3>
        
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
              Typ otázky *
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ced4da',
                borderRadius: '4px'
              }}
                         >
               <option value="smiley">5-bodové hodnocení smajlíky</option>
               <option value="single-choice">Jednoduché výběr</option>
               <option value="dropdown-multiselect">Vícenásobný výběr (dropdown)</option>
               <option value="text">Textové pole</option>
               <option value="section-header">Nadpis sekce</option>
             </select>
          </div>

                     <div style={{ marginBottom: '20px' }}>
             <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
               {formData.type === 'section-header' ? 'Název sekce *' : 'Otázka *'}
             </label>
             <input
               type="text"
               value={formData.question}
               onChange={(e) => setFormData(prev => ({ ...prev, question: e.target.value }))}
               style={{
                 width: '100%',
                 padding: '10px',
                 border: '1px solid #ced4da',
                 borderRadius: '4px'
               }}
               placeholder={formData.type === 'section-header' ? 'Zadejte název sekce' : 'Zadejte text otázky'}
             />
           </div>

                     {(formData.type === 'single-choice' || formData.type === 'dropdown-multiselect') && formData.type !== 'section-header' && (
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                Možnosti odpovědí
              </label>
              
              {formData.options.map((option, index) => (
                <div key={index} style={{ display: 'flex', marginBottom: '8px', alignItems: 'center' }}>
                  <input
                    type="text"
                    value={option}
                    onChange={(e) => {
                      const newOptions = [...formData.options];
                      newOptions[index] = e.target.value;
                      setFormData(prev => ({ ...prev, options: newOptions }));
                    }}
                    style={{
                      flex: 1,
                      padding: '8px',
                      border: '1px solid #ced4da',
                      borderRadius: '4px',
                      marginRight: '8px'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => removeOption(index)}
                    style={{
                      padding: '8px 12px',
                      backgroundColor: '#dc3545',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px'
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}

              <div style={{ display: 'flex', marginTop: '10px' }}>
                <input
                  type="text"
                  value={newOption}
                  onChange={(e) => setNewOption(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addOption())}
                  style={{
                    flex: 1,
                    padding: '8px',
                    border: '1px solid #ced4da',
                    borderRadius: '4px',
                    marginRight: '8px'
                  }}
                  placeholder="Nová možnost..."
                />
                <button
                  type="button"
                  onClick={addOption}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px'
                  }}
                >
                  Přidat
                </button>
              </div>
            </div>
          )}

                     {formData.type !== 'section-header' && (
             <div style={{ marginBottom: '20px' }}>
               <label style={{ display: 'flex', alignItems: 'center' }}>
                 <input
                   type="checkbox"
                   checked={formData.required}
                   onChange={(e) => setFormData(prev => ({ ...prev, required: e.target.checked }))}
                   style={{ marginRight: '8px' }}
                 />
                 Povinná otázka
               </label>
             </div>
           )}

          {/* Conditional Text Boxes for Options */}
          {(formData.type === 'single-choice' || formData.type === 'dropdown-multiselect') && formData.options.length > 0 && (
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '12px', fontWeight: 'bold', color: '#495057' }}>
                💡 Podmíněné textové pole 
                <small style={{ display: 'block', fontWeight: 'normal', color: '#6c757d', fontSize: '14px', marginTop: '4px' }}>
                  Přidejte textové pole, které se zobrazí při výběru konkrétní možnosti
                </small>
              </label>
              
              {formData.options.map((option, optionIndex) => {
                const trigger = formData.conditionalTriggers.find(t => t.optionIndex === optionIndex);
                
                return (
                  <div key={optionIndex} style={{ 
                    marginBottom: '12px', 
                    padding: '12px', 
                    border: '1px solid #e9ecef',
                    borderRadius: '6px',
                    backgroundColor: trigger ? '#f8f9fa' : 'transparent'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: trigger ? '8px' : '0' }}>
                      <span style={{ 
                        flex: 1, 
                        fontWeight: '500',
                        fontSize: '14px'
                      }}>
                        "{option}"
                      </span>
                      <label style={{ display: 'flex', alignItems: 'center', marginLeft: '12px' }}>
                        <input
                          type="checkbox"
                          checked={!!trigger}
                          onChange={(e) => {
                            if (e.target.checked) {
                              // Add trigger
                              setFormData(prev => ({
                                ...prev,
                                conditionalTriggers: [
                                  ...prev.conditionalTriggers,
                                  {
                                    optionIndex: optionIndex,
                                    optionText: option,
                                    textboxPlaceholder: 'Prosím, okomentujte',
                                    textboxLabel: 'Nepovinné pole'
                                  }
                                ]
                              }));
                            } else {
                              // Remove trigger
                              setFormData(prev => ({
                                ...prev,
                                conditionalTriggers: prev.conditionalTriggers.filter(t => t.optionIndex !== optionIndex)
                              }));
                            }
                          }}
                          style={{ marginRight: '6px' }}
                        />
                        <span style={{ fontSize: '13px', color: '#6c757d' }}>
                          Textové pole
                        </span>
                      </label>
                    </div>
                    
                    {trigger && (
                      <div style={{ marginTop: '8px' }}>
                        <input
                          type="text"
                          value={trigger.textboxPlaceholder}
                          onChange={(e) => {
                            setFormData(prev => ({
                              ...prev,
                              conditionalTriggers: prev.conditionalTriggers.map(t => 
                                t.optionIndex === optionIndex 
                                  ? { ...t, textboxPlaceholder: e.target.value }
                                  : t
                              )
                            }));
                          }}
                          style={{
                            width: '100%',
                            padding: '6px 8px',
                            border: '1px solid #ced4da',
                            borderRadius: '4px',
                            fontSize: '13px'
                          }}
                          placeholder="Text v textovém poli (např: 'Prosím, okomentujte')"
                        />
                        <small style={{ color: '#6c757d', fontSize: '12px' }}>
                          Tento text se zobrazí jako nápověda v textovém poli
                        </small>
                      </div>
                    )}
                  </div>
                );
              })}
              
              {formData.conditionalTriggers.length > 0 && (
                <div style={{ 
                  marginTop: '8px', 
                  padding: '8px 12px', 
                  backgroundColor: '#d4edda', 
                  border: '1px solid #c3e6cb',
                  borderRadius: '4px',
                  fontSize: '13px',
                  color: '#155724'
                }}>
                  ✅ {formData.conditionalTriggers.length} podmíněn{formData.conditionalTriggers.length === 1 ? 'é' : 'ých'} textov{formData.conditionalTriggers.length === 1 ? 'é pole' : 'á pole'} nastaveno
                </div>
              )}
            </div>
          )}

          {/* Default textbox for emoji rating */}
          {formData.type === 'smiley' && (
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                <input
                  type="checkbox"
                  id={`textbox-${step?.id || 'new'}`}
                  checked={formData.hasTextbox || false}
                  onChange={(e) => setFormData(prev => ({ ...prev, hasTextbox: e.target.checked }))}
                  style={{ marginRight: '8px' }}
                />
                <label 
                  htmlFor={`textbox-${step?.id || 'new'}`}
                  style={{
                    fontFamily: 'Roboto',
                    fontWeight: 400,
                    fontSize: '14px',
                    lineHeight: '150%',
                    letterSpacing: '1.25%',
                    color: '#262626'
                  }}
                >
                  Přidat pole pro komentář
                </label>
              </div>
              {formData.hasTextbox && (
                <div style={{ marginLeft: '26px' }}>
                  <input
                    type="text"
                    placeholder="Placeholder text pro komentář"
                    value={formData.textboxPlaceholder || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, textboxPlaceholder: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '1px solid #ced4da',
                      borderRadius: '4px',
                      fontFamily: 'Roboto',
                      fontWeight: 400,
                      fontSize: '14px',
                      lineHeight: '150%',
                      letterSpacing: '1.25%'
                    }}
                  />
                </div>
              )}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '30px' }}>
            <button
              type="button"
              onClick={onCancel}
              style={{
                padding: '10px 20px',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px'
              }}
            >
              Zrušit
            </button>
            <button
              type="submit"
              style={{
                padding: '10px 20px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px'
              }}
            >
              {step ? 'Uložit změny' : 'Přidat blok'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const SurveyPreview = ({ survey, onClose }) => {
  const [currentCardIndex, setCurrentCardIndex] = React.useState(0);
  const [previewAnswers, setPreviewAnswers] = React.useState({});
  const [dropdownStates, setDropdownStates] = React.useState({});
  const [showScreenshotForm, setShowScreenshotForm] = React.useState(false);
  const [showSuccessScreen, setShowSuccessScreen] = React.useState(false);
  const [showScreenshotSuccess, setShowScreenshotSuccess] = React.useState(false);

  const SmileyIcon = ({ iconName, state = 'default', size = 48, style = {} }) => {
    const [currentState, setCurrentState] = React.useState(state);
    
    const getIconPath = () => {
      const stateFolder = currentState === 'active' ? 'activeState' : 
                         currentState === 'hover' ? 'hoverState' : 'defaultState';
      return `/icons/${stateFolder}/${iconName}.svg`;
    };

    return (
      <img 
        src={getIconPath()}
        alt={iconName}
        width={size}
        height={size}
        style={{
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          ...style
        }}
        onMouseEnter={() => setCurrentState('hover')}
        onMouseLeave={() => setCurrentState(state)}
        onClick={() => setCurrentState('active')}
      />
    );
  };

  // Get cards with non-empty steps
  const getAllCardsWithSteps = () => {
    if (!survey.cards) return [];
    return survey.cards.filter(card => card.steps && card.steps.length > 0);
  };

  const getNonSystemCardsWithSteps = () => {
    if (!survey.cards) return [];
    return survey.cards.filter(card => card.steps && card.steps.length > 0 && !card.isSystem);
  };

  const allCardsWithSteps = getAllCardsWithSteps();
  const nonSystemCards = getNonSystemCardsWithSteps();
  const totalCards = nonSystemCards.length; // Only count non-system cards
  const currentCard = allCardsWithSteps[currentCardIndex]; // Use all cards for display
  const currentBlocks = currentCard ? currentCard.steps : [];
  const isSystemCard = currentCard ? currentCard.isSystem : false;

  const renderSmileyRating = (step) => {
    // Reversed order: start from best (nejlepší) to worst
    const smileyIcons = ['emoji-laughing', 'emoji-smile', 'emoji-neutral', 'emoji-frown', 'emoji-angry'];
    const stepKey = `step-${step.id || Math.random()}`;
    const selectedRating = previewAnswers[stepKey];
    
    return (
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: '20px' }}>
          {smileyIcons.map((iconName, index) => {
            const isSelected = selectedRating === index;
            const iconState = isSelected ? 'active' : 'default';
            
            return (
              <div 
                key={index} 
                style={{ 
                  textAlign: 'center', 
                  cursor: 'pointer',
                  opacity: isSelected ? 1 : 0.7,
                  transform: isSelected ? 'scale(1.1)' : 'scale(1)',
                  transition: 'all 0.2s ease'
                }}
                onClick={() => {
                  setPreviewAnswers(prev => ({
                    ...prev,
                    [stepKey]: index
                  }));
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.opacity = '0.9';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.opacity = '0.7';
                  }
                }}
              >
                <div>
                  <SmileyIcon iconName={iconName} state={iconState} size={34} />
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Default textbox for emoji rating if enabled */}
        {step.hasTextbox && (
          <div style={{ marginTop: '16px' }}>
            <div style={{
              width: '372px',
              minHeight: '48px',
              padding: '12px 16px',
              gap: '8px',
              borderRadius: '4px',
              border: '1px solid #4F4F4F',
              backgroundColor: 'white'
            }}>
              <input
                type="text"
                placeholder={step.textboxPlaceholder || 'Prosím, okomentujte vaše hodnocení'}
                value={previewAnswers[`${stepKey}-textbox`] || ''}
                onChange={(e) => setPreviewAnswers(prev => ({
                  ...prev,
                  [`${stepKey}-textbox`]: e.target.value
                }))}
                style={{
                  width: '100%',
                  border: 'none',
                  outline: 'none',
                  fontFamily: 'Roboto',
                  fontWeight: 400,
                  fontSize: '16px',
                  lineHeight: '150%',
                  letterSpacing: '1.25%',
                  color: '#262626',
                  backgroundColor: 'transparent'
                }}
              />
            </div>
            <div style={{
              marginTop: '8px',
              fontFamily: 'Roboto',
              fontWeight: 400,
              fontSize: '14px',
              lineHeight: '150%',
              letterSpacing: '1.25%',
              color: '#6c757d',
              fontStyle: 'italic',
              textAlign: 'left'
            }}>
              Nepovinné pole
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderSingleChoice = (step) => {
    const stepKey = `step-${step.id || Math.random()}`;
    return (
      <div style={{ marginBottom: '20px', marginTop: '16px' }}>
        {step.options.map((option, index) => {
          const trigger = step.conditionalTriggers?.find(t => t.optionIndex === index);
          const isSelected = previewAnswers[stepKey] === index;
          
          return (
            <div key={index}>
              <label style={{ 
                paddingLeft: '10px',
                display: 'block', 
                marginBottom: '12px', 
                cursor: 'pointer',
                fontFamily: 'Roboto, sans-serif',
                fontWeight: 400,
                fontSize: '16px',
                lineHeight: '150%',
                letterSpacing: '1.25%',
                color: '#262626'
              }}>
                <div style={{ 
                  position: 'relative', 
                  display: 'inline-block', 
                  marginRight: '8px' 
                }}>
                  <input
                    type="radio"
                    name={stepKey}
                    value={index}
                    checked={isSelected}
                    onChange={(e) => setPreviewAnswers(prev => ({ 
                      ...prev, 
                      [stepKey]: parseInt(e.target.value) 
                    }))}
                    style={{ 
                      width: '20px',
                      height: '20px',
                      borderRadius: '20px',
                      border: '2px solid ' + (isSelected ? '#609352' : '#ced4da'),
                      backgroundColor: '#FFFFFF',
                      appearance: 'none',
                      cursor: 'pointer',
                      position: 'relative'
                    }}
                  />
                  {isSelected && (
                    <div style={{
                      position: 'absolute',
                      top: '5px',
                      left: '5px',
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      backgroundColor: '#609352',
                      pointerEvents: 'none'
                    }} />
                  )}
                </div>
                {option}
              </label>
              
              {/* Show conditional textbox if this option is selected and has a trigger */}
              {trigger && isSelected && (
                <div style={{ marginLeft: '0px', marginTop: '16px', marginBottom: '16px' }}>
                  <div style={{ 
                    width: '372px',
                    minHeight: '48px',
                    gap: '8px',
                    paddingTop: '12px',
                    paddingRight: '8px',
                    paddingBottom: '12px',
                    paddingLeft: '8px',
                    borderRadius: '4px',
                    border: '1px solid #4F4F4F'
                  }}>
                    <input
                      type="text"
                      style={{
                        width: '100%',
                        height: '24px',
                        border: 'none',
                        outline: 'none',
                        fontFamily: 'Roboto, sans-serif',
                        fontWeight: 400,
                        fontSize: '16px',
                        lineHeight: '150%',
                        letterSpacing: '1.25%',
                        backgroundColor: 'transparent'
                      }}
                      placeholder={trigger.textboxPlaceholder || 'Prosím, okomentujte'}
                    />
                  </div>
                  <div style={{ 
                    marginTop: '8px'
                  }}>
                    <small style={{ 
                      fontFamily: 'Roboto, sans-serif',
                      fontWeight: 400,
                      fontStyle: 'italic',
                      fontSize: '14px',
                      lineHeight: '150%',
                      letterSpacing: '1.25%',
                      color: '#262626',
                      textAlign: 'left'
                    }}>
                      {trigger.textboxLabel || 'Nepovinné pole'}
                    </small>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const renderMultiSelect = (step) => {
    const stepKey = `step-${step.id || Math.random()}`;
    const selectedOptions = previewAnswers[stepKey] || [];
    
    return (
      <div style={{ marginBottom: '20px', marginTop: '16px' }}>
        {step.options.map((option, index) => {
          const trigger = step.conditionalTriggers?.find(t => t.optionIndex === index);
          const isSelected = selectedOptions.includes(index);
          
          return (
            <div key={index}>
              <label style={{ 
                paddingLeft: '10px',
                display: 'block', 
                marginBottom: '12px', 
                cursor: 'pointer',
                fontFamily: 'Roboto, sans-serif',
                fontWeight: 400,
                fontSize: '16px',
                lineHeight: '150%',
                letterSpacing: '1.25%',
                color: '#262626'
              }}>
                <div style={{ 
                  position: 'relative', 
                  display: 'inline-block', 
                  marginRight: '8px' 
                }}>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={(e) => {
                      setPreviewAnswers(prev => {
                        const currentSelected = prev[stepKey] || [];
                        if (e.target.checked) {
                          return { ...prev, [stepKey]: [...currentSelected, index] };
                        } else {
                          return { ...prev, [stepKey]: currentSelected.filter(i => i !== index) };
                        }
                      });
                    }}
                    style={{ 
                      width: '20px',
                      height: '20px',
                      borderRadius: '4px',
                      border: '2px solid ' + (isSelected ? '#609352' : '#ced4da'),
                      backgroundColor: isSelected ? '#609352' : '#FFFFFF',
                      appearance: 'none',
                      cursor: 'pointer',
                      position: 'relative'
                    }}
                  />
                  {isSelected && (
                    <div style={{
                      position: 'absolute',
                      top: '2px',
                      left: '4px',
                      width: '12px',
                      height: '8px',
                      borderLeft: '2px solid #FFFFFF',
                      borderBottom: '2px solid #FFFFFF',
                      transform: 'rotate(-45deg)',
                      pointerEvents: 'none'
                    }} />
                  )}
                </div>
                {option}
              </label>
              
              {/* Show conditional textbox if this option is selected and has a trigger */}
              {trigger && isSelected && (
                <div style={{ marginLeft: '0px', marginTop: '16px', marginBottom: '16px' }}>
                  <div style={{ 
                    width: '372px',
                    minHeight: '48px',
                    gap: '8px',
                    paddingTop: '12px',
                    paddingRight: '8px',
                    paddingBottom: '12px',
                    paddingLeft: '8px',
                    borderRadius: '4px',
                    border: '1px solid #4F4F4F'
                  }}>
                    <input
                      type="text"
                      style={{
                        width: '100%',
                        height: '24px',
                        border: 'none',
                        outline: 'none',
                        fontFamily: 'Roboto, sans-serif',
                        fontWeight: 400,
                        fontSize: '16px',
                        lineHeight: '150%',
                        letterSpacing: '1.25%',
                        backgroundColor: 'transparent'
                      }}
                      placeholder={trigger.textboxPlaceholder || 'Prosím, okomentujte'}
                    />
                  </div>
                  <div style={{ 
                    marginTop: '8px'
                  }}>
                    <small style={{ 
                      fontFamily: 'Roboto, sans-serif',
                      fontWeight: 400,
                      fontStyle: 'italic',
                      fontSize: '14px',
                      lineHeight: '150%',
                      letterSpacing: '1.25%',
                      color: '#262626',
                      textAlign: 'left'
                    }}>
                      {trigger.textboxLabel || 'Nepovinné pole'}
                    </small>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const renderTextInput = (step) => (
    <div style={{ marginBottom: '20px' }}>
      <textarea
        disabled
        style={{
          width: '100%',
          minHeight: '100px',
          padding: '12px',
          border: '1px solid #ced4da',
          borderRadius: '4px',
          resize: 'vertical',
          fontFamily: 'Roboto, sans-serif',
          fontWeight: 400,
          fontSize: '16px',
          lineHeight: '150%',
          letterSpacing: '1.25%'
        }}
        placeholder="Text odpovědi..."
      />
    </div>
  );

  const renderRatingScale = (step) => (
    <div style={{ marginBottom: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        {step.options.map((rating, index) => (
          <div key={index} style={{ textAlign: 'center', cursor: 'pointer' }}>
            <div style={{ 
              width: '40px', 
              height: '40px', 
              border: '2px solid #dee2e6',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '16px',
              fontWeight: 'bold',
              color: '#262626',
              fontFamily: 'Roboto, sans-serif'
            }}>
              {rating}
            </div>
          </div>
        ))}
      </div>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        fontFamily: 'Roboto, sans-serif',
        fontWeight: 400,
        fontSize: '14px',
        lineHeight: '150%',
        letterSpacing: '1.25%',
        color: '#262626' 
      }}>
        <span>Nejnižší</span>
        <span>Nejvyšší</span>
      </div>
    </div>
  );

  const renderSectionHeader = (step) => (
    <div style={{ 
      marginBottom: '20px'
    }}>
      <h3 style={{ 
        margin: 0, 
        color: '#262626',
        fontFamily: 'Roboto, sans-serif',
        fontWeight: 400,
        fontSize: '18px',
        lineHeight: '150%',
        letterSpacing: '1.25%'
      }}>
        {step.question}
      </h3>
    </div>
  );

  const renderDropdownMultiSelect = (step) => {
    const stepKey = `step-${step.id || Math.random()}`;
    const selectedOptions = previewAnswers[stepKey] || [];
    const isOpen = dropdownStates[stepKey] || false;
    
    const toggleDropdown = () => {
      setDropdownStates(prev => ({
        ...prev,
        [stepKey]: !prev[stepKey]
      }));
    };

    return (
      <div style={{ marginBottom: '20px', position: 'relative' }}>
        {/* Dropdown */}
        <div 
          onClick={toggleDropdown}
          style={{
            position: 'relative',
            width: '372px',
            height: '40px',
            paddingTop: '5px',
            paddingBottom: '5px',
            paddingLeft: '12px',
            paddingRight: '40px',
            borderRadius: '8px',
            borderWidth: '1px',
            borderStyle: 'solid',
            borderColor: '#ced4da',
            backgroundColor: 'white',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            fontFamily: 'Roboto',
            fontWeight: 400,
            fontSize: '16px',
            lineHeight: '150%',
            letterSpacing: '1.25%',
            color: '#262626'
          }}>
          <span style={{ flex: 1 }}>
            {selectedOptions.length === 0 ? 'Vyberte možnosti...' : 
             selectedOptions.length === 1 ? `${selectedOptions.length} možnost vybrána` :
             selectedOptions.length <= 4 ? `${selectedOptions.length} možnosti vybrány` :
             `${selectedOptions.length} možností vybráno`}
          </span>
          
          {/* Custom green arrow */}
          <div style={{ 
            position: 'absolute', 
            right: '12px', 
            transform: 'translateY(-50%)',
            width: '16px',
            height: '9px'
          }}>
            <svg width="16" height="9" viewBox="0 0 16 9" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path fillRule="evenodd" clipRule="evenodd" d="M0.180242 0.180242C0.420565 -0.0600807 0.810205 -0.0600807 1.05053 0.180242L8 7.12971L14.9495 0.180242C15.1898 -0.0600807 15.5794 -0.0600807 15.8198 0.180242C16.0601 0.420565 16.0601 0.810205 15.8198 1.05053L8.43514 8.43514C8.19482 8.67546 7.80518 8.67546 7.56486 8.43514L0.180242 1.05053C-0.0600807 0.810205 -0.0600807 0.420565 0.180242 0.180242Z" fill="#609352"/>
            </svg>
          </div>
        </div>

        {/* Dropdown options (when open) */}
        {isOpen && (
          <div style={{
            position: 'absolute',
            top: '42px',
            left: 0,
            width: '372px',
            zIndex: 1000,
            backgroundColor: 'white',
            border: '1px solid #ced4da',
            borderRadius: '4px',
            maxHeight: '200px',
            overflowY: 'auto',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            {(step.options || []).map((option, index) => (
              <div 
                key={index}
                                 onClick={() => {
                   if (!selectedOptions.includes(option)) {
                     setPreviewAnswers(prev => ({
                       ...prev,
                       [stepKey]: [...selectedOptions, option]
                     }));
                   }
                   setDropdownStates(prev => ({
                     ...prev,
                     [stepKey]: false
                   }));
                 }}
                style={{
                  padding: '8px 12px',
                  cursor: selectedOptions.includes(option) ? 'not-allowed' : 'pointer',
                  fontFamily: 'Roboto',
                  fontWeight: 400,
                  fontSize: '16px',
                  lineHeight: '150%',
                  letterSpacing: '1.25%',
                  color: selectedOptions.includes(option) ? '#6c757d' : '#262626',
                  backgroundColor: selectedOptions.includes(option) ? '#f8f9fa' : 'white',
                  borderBottom: index < (step.options || []).length - 1 ? '1px solid #e9ecef' : 'none'
                }}
                onMouseEnter={(e) => {
                  if (!selectedOptions.includes(option)) {
                    e.target.style.backgroundColor = '#f8f9fa';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!selectedOptions.includes(option)) {
                    e.target.style.backgroundColor = 'white';
                  }
                }}
              >
                {selectedOptions.includes(option) ? '✓ ' : ''}{option}
              </div>
            ))}
          </div>
        )}

        {/* Selected choices (chips below dropdown) */}
        {selectedOptions.length > 0 && (
          <div style={{
            marginTop: '8px',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '8px',
            maxWidth: '320px'
          }}>
            {selectedOptions.map((option, index) => (
              <div key={index} style={{
                display: 'flex',
                alignItems: 'center',
                width: '121px',
                maxWidth: '320px',
                height: '28px',
                paddingLeft: '8px',
                paddingRight: '8px',
                borderRadius: '4px',
                borderWidth: '1px',
                borderStyle: 'solid',
                borderColor: '#ced4da',
                backgroundColor: '#f8f9fa',
                fontFamily: 'Roboto',
                fontWeight: 400,
                fontSize: '14px',
                lineHeight: '150%',
                letterSpacing: '1.25%',
                color: '#262626'
              }}>
                <span style={{ 
                  flex: 1,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {option}
                </span>
                <button
                  onClick={() => {
                    setPreviewAnswers(prev => ({
                      ...prev,
                      [stepKey]: selectedOptions.filter(opt => opt !== option)
                    }));
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '0',
                    marginLeft: '4px',
                    width: '12px',
                    height: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M0.878303 1.49725C0.837626 1.45658 0.805359 1.40829 0.783345 1.35514C0.761331 1.30199 0.75 1.24503 0.75 1.1875C0.75 1.12998 0.761331 1.07301 0.783345 1.01987C0.805359 0.966721 0.837626 0.91843 0.878303 0.877753C0.918979 0.837076 0.96727 0.80481 1.02042 0.782795C1.07356 0.760781 1.13053 0.749451 1.18805 0.749451C1.24558 0.749451 1.30254 0.760781 1.35569 0.782795C1.40884 0.80481 1.45713 0.837076 1.4978 0.877753L6.00055 5.38138L10.5033 0.877753C10.544 0.837076 10.5923 0.80481 10.6454 0.782795C10.6986 0.760781 10.7555 0.749451 10.8131 0.749451C10.8706 0.749451 10.9275 0.760781 10.9807 0.782795C11.0338 0.80481 11.0821 0.837076 11.1228 0.877753C11.1635 0.91843 11.1957 0.966721 11.2178 1.01987C11.2398 1.07301 11.2511 1.12998 11.2511 1.1875C11.2511 1.24503 11.2398 1.30199 11.2178 1.35514C11.1957 1.40829 11.1635 1.45658 11.1228 1.49725L6.61918 6L11.1228 10.5028C11.1635 10.5434 11.1957 10.5917 11.2178 10.6449C11.2398 10.698 11.2511 10.755 11.2511 10.8125C11.2511 10.87 11.2398 10.927 11.2178 10.9801C11.1957 11.0333 11.1635 11.0816 11.1228 11.1223C11.0821 11.1629 11.0338 11.1952 10.9807 11.2172C10.9275 11.2392 10.8706 11.2506 10.8131 11.2506C10.7555 11.2506 10.6986 11.2392 10.6454 11.2172C10.5923 11.1952 10.544 11.1629 10.5033 11.1223L6.00055 6.61863L1.4978 11.1223C1.45713 11.1629 1.40884 11.1952 1.35569 11.2172C1.30254 11.2392 1.24558 11.2506 1.18805 11.2506C1.13053 11.2506 1.07356 11.2392 1.02042 11.2172C0.96727 11.1952 0.918979 11.1629 0.878303 11.1223C0.837626 11.0816 0.805359 11.0333 0.783345 10.9801C0.761331 10.927 0.75 10.87 0.75 10.8125C0.75 10.755 0.761331 10.698 0.783345 10.6449C0.805359 10.5917 0.837626 10.5434 0.878303 10.5028L5.38193 6L0.878303 1.49725Z" fill="#609352"/>
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Conditional text boxes */}
        {(step.conditionalTriggers || []).map((trigger, triggerIndex) => {
          const isTriggered = selectedOptions.includes(trigger.optionText);
          
          return isTriggered ? (
            <div key={triggerIndex} style={{ marginTop: '16px' }}>
              <div style={{
                width: '372px',
                minHeight: '48px',
                gap: '8px',
                paddingTop: '12px',
                paddingRight: '8px',
                paddingBottom: '12px',
                paddingLeft: '8px',
                borderRadius: '4px',
                border: '1px solid #4F4F4F',
                backgroundColor: 'white'
              }}>
                <input
                  type="text"
                  placeholder={trigger.textboxPlaceholder || 'Prosím, okomentujte'}
                  style={{
                    width: '100%',
                    height: '24px',
                    border: 'none',
                    outline: 'none',
                    backgroundColor: 'transparent',
                    fontFamily: 'Roboto, sans-serif',
                    fontWeight: 400,
                    fontSize: '16px',
                    lineHeight: '150%',
                    letterSpacing: '1.25%',
                    color: '#262626'
                  }}
                />
              </div>
              <div style={{ marginTop: '8px' }}>
                <small style={{
                  fontFamily: 'Roboto, sans-serif',
                  fontWeight: 400,
                  fontStyle: 'italic',
                  fontSize: '14px',
                  lineHeight: '150%',
                  letterSpacing: '1.25%',
                  color: '#262626',
                  textAlign: 'left'
                }}>
                  {trigger.textboxLabel || 'Nepovinné pole'}
                </small>
              </div>
            </div>
          ) : null;
        })}
      </div>
    );
  };

const renderFloatingWidget = (step) => (
  <div style={{ 
    position: 'relative',
    height: '120px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '20px auto'
  }}>
    {/* Just the 2 icons - no window wrapper */}
    <div style={{ position: 'relative' }}>
      {/* Main Floating Circle */}
      <div 
        onClick={() => {
          // Navigate to Step 0b (Feedback Modal)
          const feedbackModalIndex = allCardsWithSteps.findIndex(card => 
            card.steps && card.steps.some(step => step.type === 'feedback-modal')
          );
          if (feedbackModalIndex !== -1) {
            setCurrentCardIndex(feedbackModalIndex);
          }
        }}
        style={{
          width: '82px',
          height: '82px',
          backgroundColor: '#FFFFFF',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          cursor: 'pointer',
          position: 'relative'
        }}>
        {/* Floating Icon */}
        <img 
          src="/floating.svg" 
          alt="Feedback"
          style={{
            width: '48px',
            height: '48px'
          }}
        />
      </div>

      {/* Close Button Circle */}
      <div 
        onClick={() => {
          // Close the floating widget - go to next non-system card
          const nextNonSystemIndex = allCardsWithSteps.findIndex((card, index) => 
            index > currentCardIndex && !card.isSystem
          );
          if (nextNonSystemIndex !== -1) {
            setCurrentCardIndex(nextNonSystemIndex);
          }
        }}
        style={{
          position: 'absolute',
          width: '39px',
          height: '39px',
          top: '-29px',
          right: '-120px',
          backgroundColor: '#FFFFFF',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
          cursor: 'pointer'
        }}>
        {/* Close Icon */}
        <img 
          src="/close.svg" 
          alt="Close"
          style={{
            width: '23.25px',
            height: '23.25px'
          }}
        />
      </div>
    </div>
  </div>
);

const renderFeedbackModal = (step) => (
  <div style={{
    marginBottom: '20px'
  }}>
    {/* Just the content - no window wrapper */}
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '24px'
    }}>
      {/* Subtitle */}
      <div style={{
        fontFamily: 'Roboto',
        fontWeight: 400,
        fontSize: '18px',
        lineHeight: '150%',
        letterSpacing: '1.25%',
        color: '#262626',
        textAlign: 'left'
      }}>
        Hodnocení, účel návštěvy, dojmy
      </div>

      {/* Green Button 1 */}
      <button 
        onClick={() => {
          // Navigate to step 1 (first non-system card)
          const firstNonSystemIndex = allCardsWithSteps.findIndex(card => !card.isSystem);
          if (firstNonSystemIndex !== -1) {
            setCurrentCardIndex(firstNonSystemIndex);
          }
        }}
        style={{
          width: '241px',
          height: '56px',
          gap: '20px',
          paddingTop: '12px',
          paddingRight: '20px',
          paddingBottom: '13px',
          paddingLeft: '20px',
          borderRadius: '8px',
          backgroundColor: '#609352',
          border: 'none',
          cursor: 'pointer',
          fontFamily: 'Roboto',
          fontWeight: 700,
          fontSize: '20px',
          lineHeight: '150%',
          letterSpacing: '3%',
          color: '#FFFFFF'
        }}>
        Zpětná vazba na web
      </button>

      {/* Second Label */}
      <div style={{
        fontFamily: 'Roboto',
        fontWeight: 400,
        fontSize: '18px',
        lineHeight: '150%',
        letterSpacing: '1.25%',
        color: '#262626',
        textAlign: 'left'
      }}>
        Možnost připojit screenshot + komentář
      </div>

      {/* Green Button 2 */}
      <button 
        onClick={() => {
          setShowScreenshotForm(true);
        }}
        style={{
          width: '183px',
          height: '56px',
          gap: '20px',
          paddingTop: '12px',
          paddingRight: '20px',
          paddingBottom: '13px',
          paddingLeft: '20px',
          borderRadius: '8px',
          backgroundColor: '#609352',
          border: 'none',
          cursor: 'pointer',
          fontFamily: 'Roboto',
          fontWeight: 700,
          fontSize: '20px',
          lineHeight: '150%',
          letterSpacing: '3%',
          color: '#FFFFFF'
        }}>
        Máte problém?
      </button>
    </div>
  </div>
);

// Screenshot Form Component
const renderScreenshotForm = () => (
  <div style={{
    width: '450px',
    height: '603px',
    borderRadius: '16px',
    backgroundColor: '#FFFFFF',
    padding: '24px',
    gap: '24px',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative'
  }}>
    {/* Header */}
    <div style={{ 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center',
      marginBottom: '24px'
    }}>
      <h4 style={{ 
        margin: 0,
        fontFamily: 'Roboto',
        fontWeight: 400,
        fontSize: '24px',
        lineHeight: '150%',
        letterSpacing: '3.12%',
        color: '#262626'
      }}>
        Přiložit snímek obrazovky
      </h4>
      <button
        onClick={onClose}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '4px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <img src="/close.svg" alt="Close" width="24" height="24" />
      </button>
    </div>

    {/* Content */}
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Question */}
      <div style={{
        fontFamily: 'Roboto',
        fontWeight: 400,
        fontSize: '18px',
        lineHeight: '150%',
        letterSpacing: '1.25%',
        color: '#262626'
      }}>
        Chcete přiložit screenshot?
      </div>

      {/* Upload Button */}
      <button style={{
        width: '160px',
        height: '40px',
        gap: '12px',
        paddingTop: '8px',
        paddingRight: '12px',
        paddingBottom: '9px',
        paddingLeft: '12px',
        borderRadius: '8px',
        border: '1px solid #609352',
        backgroundColor: 'transparent',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        {/* Upload Icon */}
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: '8px' }}>
          <path d="M0.625 12.375C0.970178 12.375 1.25 12.6549 1.25 13V16.125C1.25 16.8154 1.80964 17.375 2.5 17.375H17.5C18.1904 17.375 18.75 16.8154 18.75 16.125V13C18.75 12.6549 19.0298 12.375 19.375 12.375C19.7202 12.375 20 12.6549 20 13V16.125C20 17.5057 18.8807 18.625 17.5 18.625H2.5C1.11929 18.625 0 17.5057 0 16.125V13C0 12.6549 0.279822 12.375 0.625 12.375Z" fill="#609352"/>
          <path d="M9.55806 1.43306C9.80214 1.18898 10.1979 1.18898 10.4419 1.43306L14.1919 5.18306C14.436 5.42714 14.436 5.82286 14.1919 6.06694C13.9479 6.31102 13.5521 6.31102 13.3081 6.06694L10.625 3.38388V14.375C10.625 14.7202 10.3452 15 10 15C9.65482 15 9.375 14.7202 9.375 14.375V3.38388L6.69194 6.06694C6.44786 6.31102 6.05214 6.31102 5.80806 6.06694C5.56398 5.82286 5.56398 5.42714 5.80806 5.18306L9.55806 1.43306Z" fill="#609352"/>
        </svg>
        <span style={{
          fontFamily: 'Roboto',
          fontWeight: 700,
          fontSize: '14px',
          lineHeight: '150%',
          letterSpacing: '1.25%',
          color: '#368537'
        }}>
          Nahrajte soubor
        </span>
      </button>

      {/* Supported formats */}
      <div style={{
        fontFamily: 'Roboto',
        fontWeight: 400,
        fontSize: '14px',
        lineHeight: '150%',
        letterSpacing: '1.25%',
        color: '#262626',
        textAlign: 'center'
      }}>
        Podporované formáty JPEG, PNG, PDF
      </div>

      {/* Problem description label */}
      <div style={{
        fontFamily: 'Roboto',
        fontWeight: 400,
        fontSize: '18px',
        lineHeight: '150%',
        letterSpacing: '1.25%',
        color: '#262626',
        marginTop: '24px'
      }}>
        Popište problém nebo potíže
      </div>

      {/* Text area */}
      <textarea 
        placeholder="Prosím, uvěďte"
        style={{
          width: '372px',
          minHeight: '120px',
          padding: '12px 8px',
          borderRadius: '4px',
          border: '1px solid #4F4F4F',
          fontFamily: 'Roboto',
          fontWeight: 400,
          fontSize: '16px',
          lineHeight: '150%',
          letterSpacing: '1.25%',
          color: '#6D6D6D',
          backgroundColor: '#FFFFFF',
          resize: 'vertical',
          outline: 'none'
        }}
      />

      {/* Buttons */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 'auto',
        paddingTop: '20px'
      }}>
        {/* Back Button */}
        <button 
          onClick={() => {
            setShowScreenshotForm(false);
          }}
          style={{
            width: '83px',
            height: '56px',
            gap: '20px',
            paddingTop: '12px',
            paddingRight: '20px',
            paddingBottom: '13px',
            paddingLeft: '20px',
            borderRadius: '8px',
            border: '1px solid #609352',
            backgroundColor: 'transparent',
            cursor: 'pointer',
            fontFamily: 'Roboto',
            fontWeight: 700,
            fontSize: '20px',
            lineHeight: '150%',
            letterSpacing: '3%',
            color: '#368537'
          }}>
          Zpět
        </button>

        {/* Submit Button */}
        <button 
          onClick={() => {
            setShowScreenshotForm(false);
            setShowScreenshotSuccess(true);
          }}
          style={{
            width: '113px',
            height: '56px',
            gap: '20px',
            paddingTop: '12px',
            paddingRight: '20px',
            paddingBottom: '13px',
            paddingLeft: '20px',
            borderRadius: '8px',
            backgroundColor: '#609352',
            border: 'none',
            cursor: 'pointer',
            fontFamily: 'Roboto',
            fontWeight: 700,
            fontSize: '20px',
            lineHeight: '150%',
            letterSpacing: '3%',
            color: '#FFFFFF'
          }}>
          Odeslat
        </button>
      </div>
    </div>
  </div>
);

// Success Screen Component
const renderSuccessScreen = (message) => (
  <div style={{
    width: '450px',
    height: '603px',
    borderRadius: '16px',
    backgroundColor: '#FFFFFF',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    textAlign: 'center'
  }}>
    <h2 style={{
      margin: 0,
      fontFamily: 'Roboto',
      fontWeight: 400,
      fontSize: '24px',
      lineHeight: '150%',
      letterSpacing: '3.12%',
      color: '#262626'
    }}>
      {message}
    </h2>
  </div>
);

const renderStepContent = (step) => {
  switch (step.type) {
    case 'smiley': return renderSmileyRating(step);
    case 'single-choice': return renderSingleChoice(step);
    case 'dropdown-multiselect': return renderDropdownMultiSelect(step);
    case 'text': return renderTextInput(step);
    case 'section-header': return renderSectionHeader(step);
    case 'floating-widget': return renderFloatingWidget(step);
    case 'feedback-modal': return renderFeedbackModal(step);
    default: return <div>Neznámý typ otázky</div>;
  }
};

// Handle special screens
if (showScreenshotForm) {
  return renderScreenshotForm();
}

if (showScreenshotSuccess) {
  return renderSuccessScreen('Odesláno');
}

if (showSuccessScreen) {
  return renderSuccessScreen('Zpětná vazba odeslána');
}

if (totalCards === 0) {
  return (
    <div style={{
      width: '450px',
      height: '603px',
      borderRadius: '16px',
      backgroundColor: '#FFFFFF',
      padding: '24px',
      gap: '24px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center'
    }}>
      <p style={{ color: '#6c757d' }}>Žádné kroky pro náhled</p>
    </div>
  );
}

return (
  <div style={{
    width: '450px',
    height: '603px',
    borderRadius: '16px',
    backgroundColor: '#FFFFFF',
    padding: '24px',
    gap: '24px',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative'
  }}>
    {/* Header with title and close button - Hide for system cards */}
    {!isSystemCard && (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '24px'
      }}>
        <h4 style={{ 
          margin: 0,
          fontFamily: 'Roboto, sans-serif',
          fontWeight: 400,
          fontSize: '24px',
          lineHeight: '150%',
          letterSpacing: '3.12%',
          color: '#262626'
        }}>
          {survey.title}
        </h4>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <img src="/close.svg" alt="Close" width="24" height="24" />
        </button>
      </div>
    )}

    {/* Content - All blocks from current step */}
    <div style={{ flex: 1, overflow: 'auto' }}>
      {currentBlocks.map((block, index) => (
        <div key={index} style={{ marginBottom: index < currentBlocks.length - 1 ? '32px' : '0' }}>
          {/* Question/Block Title - Hide for system cards */}
          {block.type !== 'section-header' && !isSystemCard && (
            <div style={{ marginBottom: '16px' }}>
              <h3 style={{ 
                margin: 0,
                fontFamily: 'Roboto, sans-serif',
                fontWeight: 400,
                fontSize: '18px',
                lineHeight: '150%',
                letterSpacing: '1.25%',
                color: '#262626'
              }}>
                {block.question || `Blok ${index + 1}`}
              </h3>
            </div>
          )}
          
          {/* Block Content */}
          {renderStepContent(block)}
          

        </div>
      ))}
    </div>

    {/* Bottom section with step counter and continue button - Hide for system cards */}
    {!isSystemCard && (
      <div style={{
        width: '371px',
        height: '85px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: '20px',
        paddingBottom: '20px',
        marginTop: 'auto'
      }}>
        <div style={{
          width: '78px',
          height: '24px',
          fontFamily: 'Roboto, sans-serif',
          fontWeight: 400,
          fontSize: '16px',
          lineHeight: '150%',
          letterSpacing: '0%',
          color: '#262626'
        }}>
          {/* Calculate step number excluding system cards */}
          {(() => {
            const nonSystemCardsBeforeCurrent = allCardsWithSteps
              .slice(0, currentCardIndex)
              .filter(card => !card.isSystem).length;
            return nonSystemCardsBeforeCurrent + 1;
          })()} z {totalCards} kroků
        </div>
        
        <button
          onClick={() => {
            // Check if this is the last step
            const nonSystemCardsBeforeCurrent = allCardsWithSteps
              .slice(0, currentCardIndex)
              .filter(card => !card.isSystem).length;
            
            if (nonSystemCardsBeforeCurrent >= totalCards - 1) {
              // Last step - show success screen
              setShowSuccessScreen(true);
            } else {
              // Find next non-system card
              const nextNonSystemIndex = allCardsWithSteps.findIndex((card, index) => 
                index > currentCardIndex && !card.isSystem
              );
              if (nextNonSystemIndex !== -1) {
                setCurrentCardIndex(nextNonSystemIndex);
              }
            }
          }}
          disabled={false}
          style={{
            width: (() => {
              const nonSystemCardsBeforeCurrent = allCardsWithSteps
                .slice(0, currentCardIndex)
                .filter(card => !card.isSystem).length;
              return nonSystemCardsBeforeCurrent >= totalCards - 1 ? '201px' : '147px';
            })(),
            height: '56px',
            gap: '20px',
            paddingTop: '12px',
            paddingRight: '20px',
            paddingBottom: '13px',
            paddingLeft: '20px',
            borderRadius: '8px',
            background: '#609352',
            border: 'none',
            color: 'white',
            cursor: 'pointer',
            fontFamily: 'Roboto, sans-serif',
            fontWeight: 700,
            fontSize: '20px',
            lineHeight: '150%',
            letterSpacing: '3%'
          }}
        >
          {(() => {
            const nonSystemCardsBeforeCurrent = allCardsWithSteps
              .slice(0, currentCardIndex)
              .filter(card => !card.isSystem).length;
            return nonSystemCardsBeforeCurrent >= totalCards - 1 ? 'Odeslat dotazník' : 'Pokračovat';
          })()}
        </button>
      </div>
    )}
  </div>
);
};

// Building Blocks Palette Component
const BuildingBlocksPalette = () => {
  const buildingBlocks = [
    {
      id: 'smiley',
      name: '5-bodové hodnocení',
      icon: '😊',
      description: 'Hodnocení pomocí smajlíků (1-5)',
      color: '#ffd54f'
    },
    {
      id: 'single-choice',
      name: 'Jednoduché výběr',
      icon: '📝',
      description: 'Výběr jedné možnosti ze seznamu',
      color: '#81c784'
    },
    {
      id: 'dropdown-multiselect',
      name: 'Vícenásobný výběr',
      icon: '☑️',
      description: 'Výběr více možností (dropdown)',
      color: '#64b5f6'
    },
    {
      id: 'text',
      name: 'Textové pole',
      icon: '📄',
      description: 'Volný text nebo komentář',
      color: '#a1887f'
    },
    {
      id: 'section-header',
      name: 'Nadpis sekce',
      icon: '📋',
      description: 'Název sekce nebo popisný text',
      color: '#ffb74d'
    }
  ];

  const handleDragStart = (e, blockType) => {
    e.dataTransfer.setData('application/json', JSON.stringify({
      type: 'building-block',
      blockType: blockType
    }));
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div>
      {buildingBlocks.map((block) => (
        <div
          key={block.id}
          draggable
          onDragStart={(e) => handleDragStart(e, block.id)}
          style={{
            backgroundColor: 'white',
            border: '2px solid #dee2e6',
            borderRadius: '8px',
            padding: '15px',
            marginBottom: '12px',
            cursor: 'grab',
            transition: 'all 0.2s ease',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = 'translateY(-2px)';
            e.target.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
            e.target.style.borderColor = block.color;
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
            e.target.style.borderColor = '#dee2e6';
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
            <span 
              style={{ 
                fontSize: '24px', 
                marginRight: '12px',
                backgroundColor: block.color + '20',
                padding: '8px',
                borderRadius: '6px'
              }}
            >
              {block.icon}
            </span>
            <div style={{ flex: 1 }}>
              <h5 style={{ margin: '0 0 4px 0', color: '#495057', fontSize: '14px' }}>
                {block.name}
              </h5>
              <small style={{ color: '#6c757d', fontSize: '12px' }}>
                {block.description}
              </small>
            </div>
          </div>
          <div style={{ 
            fontSize: '11px', 
            color: '#6c757d',
            fontStyle: 'italic',
            textAlign: 'center',
            borderTop: '1px solid #f0f0f0',
            paddingTop: '8px',
            marginTop: '8px'
          }}>
            🖱️ Přetáhnout do průzkumu
          </div>
        </div>
      ))}
    </div>
  );
};

// Survey Canvas Component
const SurveyCanvas = ({ steps, onStepsChange, onEditStep, onDeleteStep, cardInfo, canEdit, isAdmin }) => {
  const [dragOverIndex, setDragOverIndex] = React.useState(null);
  const [draggedStepIndex, setDraggedStepIndex] = React.useState(null);

  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setDragOverIndex(index);
  };

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    
    // Check if editing is allowed
    if (!canEdit) {
      alert(cardInfo?.isAdminOnly ? 'Tato sekce může být upravována pouze administrátorem' : 'Tato sekce není editovatelná');
      setDragOverIndex(null);
      setDraggedStepIndex(null);
      return;
    }
    
    const data = e.dataTransfer.getData('application/json');
    
    try {
      const dragData = JSON.parse(data);
      
      if (dragData.type === 'building-block') {
        // Adding new block from palette
        const newStep = {
          id: Date.now(),
          type: dragData.blockType,
          question: getDefaultQuestion(dragData.blockType),
          options: getDefaultOptions(dragData.blockType),
          required: true,
          conditional: false
        };
        
        const newSteps = [...steps];
        newSteps.splice(dropIndex, 0, newStep);
        onStepsChange(newSteps);
      } else if (dragData.type === 'existing-step') {
        // Reordering existing steps
        const dragIndex = dragData.index;
        if (dragIndex !== dropIndex) {
          const newSteps = [...steps];
          const draggedItem = newSteps[dragIndex];
          newSteps.splice(dragIndex, 1);
          const actualDropIndex = dragIndex < dropIndex ? dropIndex - 1 : dropIndex;
          newSteps.splice(actualDropIndex, 0, draggedItem);
          onStepsChange(newSteps);
        }
      }
    } catch (error) {
      console.error('Error parsing drag data:', error);
    }
    
    setDragOverIndex(null);
    setDraggedStepIndex(null);
  };

  const handleStepDragStart = (e, index) => {
    e.dataTransfer.setData('application/json', JSON.stringify({
      type: 'existing-step',
      index: index
    }));
    e.dataTransfer.effectAllowed = 'move';
    setDraggedStepIndex(index);
  };

  const getDefaultQuestion = (blockType) => {
    switch (blockType) {
      case 'smiley': return 'Jak hodnotíte naši službu?';
      case 'single-choice': return 'Vyberte jednu možnost:';
      case 'dropdown-multiselect': return 'Vyberte všechny vhodné možnosti:';
      case 'text': return 'Váš komentář nebo připomínka:';
      case 'section-header': return 'Název sekce';
      default: return 'Nová otázka';
    }
  };

  const getDefaultOptions = (blockType) => {
    switch (blockType) {
      case 'single-choice': return ['Možnost 1', 'Možnost 2', 'Možnost 3'];
      case 'dropdown-multiselect': return ['Možnost A', 'Možnost B', 'Možnost C'];
      default: return [];
    }
  };

  // Create drop zones between steps and at the end
  const dropZones = [];
  for (let i = 0; i <= steps.length; i++) {
    dropZones.push(
      <div
        key={`drop-${i}`}
        onDragOver={(e) => handleDragOver(e, i)}
        onDrop={(e) => handleDrop(e, i)}
        onDragLeave={() => setDragOverIndex(null)}
        style={{
          height: dragOverIndex === i ? '40px' : '20px',
          backgroundColor: dragOverIndex === i ? '#e3f2fd' : 'transparent',
          border: dragOverIndex === i ? '2px dashed #2196f3' : '2px dashed transparent',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s ease',
          margin: '5px 0'
        }}
      >
        {dragOverIndex === i && (
          <span style={{ color: '#2196f3', fontSize: '12px', fontWeight: 'bold' }}>
            ⬇️ Upustit zde
          </span>
        )}
      </div>
    );

    // Add step card after each drop zone (except the last one)
    if (i < steps.length) {
      dropZones.push(
        <SurveyStepCard
          key={steps[i].id}
          step={steps[i]}
          index={i}
          onEdit={canEdit ? () => onEditStep(steps[i]) : undefined}
          onDelete={canEdit ? () => onDeleteStep(steps[i].id) : undefined}
          onDragStart={canEdit ? handleStepDragStart : undefined}
          isDragging={draggedStepIndex === i}
          isInCanvas={true}
          canEdit={canEdit}
        />
      );
    }
  }

  const getEmptyStateContent = () => {
    if (!canEdit) {
      return {
        icon: '🔒',
        title: cardInfo?.isAdminOnly ? 'Sekce pouze pro administrátory' : 'Sekce jen pro čtení',
        message: cardInfo?.isAdminOnly 
          ? 'Tato sekce může být upravována pouze administrátorem'
          : 'Tato sekce není editovatelná, ale můžete si prohlédnout její obsah'
      };
    }
    
    if (dragOverIndex === 0) {
      return {
        icon: '⬇️',
        title: 'Upustit zde!',
        message: 'Vytvořte svůj první blok v tomto kroku'
      };
    }
    
    return {
      icon: '📋',
      title: 'Prázdný krok',
      message: 'Přetáhněte stavební bloky sem pro vytvoření obsahu tohoto kroku'
    };
  };

  return (
    <div style={{ padding: '20px', minHeight: '400px' }}>
      {/* Card Header */}
      <div style={{ 
        marginBottom: '20px', 
        padding: '15px',
        backgroundColor: cardInfo?.isAdminOnly ? '#fff3cd' : '#e7f3ff',
        border: `1px solid ${cardInfo?.isAdminOnly ? '#ffeaa7' : '#b3d7ff'}`,
        borderRadius: '6px'
      }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
            <h4 style={{ margin: '0 0 4px 0', color: '#495057' }}>
              {cardInfo?.title} - Krok průzkumu
              {cardInfo?.isAdminOnly && (
                <span style={{ 
                  marginLeft: '8px', 
                  fontSize: '11px',
                  backgroundColor: '#dc3545',
                  color: 'white',
                  padding: '2px 6px',
                  borderRadius: '3px'
                }}>
                  ADMIN ONLY
                </span>
              )}
            </h4>
            <small style={{ color: '#6c757d' }}>{cardInfo?.description}</small>
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
                         <span style={{ 
               backgroundColor: '#6c757d',
               color: 'white',
               padding: '4px 8px',
               borderRadius: '12px',
               fontSize: '12px',
               fontWeight: 'bold'
             }}>
               {steps.length} {steps.length === 1 ? 'blok' : steps.length < 5 ? 'bloky' : 'bloků'}
             </span>
            {!canEdit && <span style={{ fontSize: '20px' }}>🔒</span>}
          </div>
        </div>
      </div>

      {steps.length === 0 ? (
        <div
          onDragOver={canEdit ? (e) => handleDragOver(e, 0) : undefined}
          onDrop={canEdit ? (e) => handleDrop(e, 0) : undefined}
          onDragLeave={canEdit ? () => setDragOverIndex(null) : undefined}
          style={{
            textAlign: 'center',
            padding: '80px 20px',
            border: `3px dashed ${canEdit && dragOverIndex === 0 ? '#2196f3' : '#dee2e6'}`,
            borderRadius: '12px',
            backgroundColor: canEdit && dragOverIndex === 0 ? '#e3f2fd' : '#f8f9fa',
            color: '#6c757d',
            transition: 'all 0.3s ease',
            opacity: canEdit ? 1 : 0.7
          }}
        >
          {(() => {
            const content = getEmptyStateContent();
            return (
              <>
                <div style={{ fontSize: '48px', marginBottom: '20px' }}>
                  {content.icon}
                </div>
                <h4 style={{ margin: '0 0 10px 0' }}>
                  {content.title}
                </h4>
                <p style={{ margin: 0 }}>
                  {content.message}
                </p>
              </>
            );
          })()}
        </div>
      ) : (
        <div style={{ opacity: canEdit ? 1 : 0.8 }}>
          {dropZones}
        </div>
      )}
    </div>
  );
};

// Survey Card Manager Component
const SurveyCardManager = ({ survey, activeCardIndex, onActiveCardChange, onSurveyChange, onEditStep, onDeleteStep, user, globalMode = false }) => {
  const navigate = useNavigate();
  const isAdmin = user?.role === 'admin';

  const handleStepsChange = (cardIndex, newSteps) => {
    onSurveyChange(prev => ({
      ...prev,
      cards: prev.cards.map((card, index) => 
        index === cardIndex ? { ...card, steps: newSteps } : card
      )
    }));
  };

  const canEditCard = (card) => {
    if (card.isGlobal && !globalMode) {
      return false; // Global cards are not editable in regular survey creator
    }
    if (card.isAdminOnly) {
      return isAdmin;
    }
    return card.isEditable;
  };

  const handleCardClick = (cardIndex) => {
    const card = survey.cards[cardIndex];
    
    // Show warning for global sections in regular mode
    if (!globalMode && (card.id === 2 || card.id === 4)) {
      if (isAdmin) {
        const shouldRedirect = window.confirm(
          `Pokoušíte se editovat globální sekci "${card.title}".\n\n` +
          `Pro lepší správu globálních sekcí doporučujeme použít dedikovanou stránku "Global Surveys".\n\n` +
          `Chcete přejít na Global Surveys nyní?`
        );
        
        if (shouldRedirect) {
          navigate('/global-surveys');
          return;
        }
      } else {
        alert(
          `Sekce "${card.title}" je globální a spravuje ji administrátor.\n\n` +
          `Tato sekce je automaticky zahrnuta do všech dotazníků a nelze ji zde upravovat.`
        );
        return;
      }
    }
    
    onActiveCardChange(cardIndex);
  };

  const canDeleteCard = (card, cardIndex) => {
    // Cannot delete system cards or admin cards
    // Cannot delete if it's the only user card
    const userCards = survey.cards.filter(c => !c.isAdminOnly && !c.isSystem);
    return !card.isAdminOnly && !card.isSystem && userCards.length > 1;
  };

  const addNewCard = () => {
    const userCards = survey.cards.filter(c => !c.isAdminOnly && !c.isSystem);
    const newCardNumber = userCards.length + 1;
    const lastAdminCardIndex = survey.cards.length - 1; // Last card is always admin "Závěrečná sekce"
    
    const newCard = {
      id: Date.now(),
      title: `Krok ${newCardNumber}`,
      description: `Uživatelská sekce ${newCardNumber}`,
      isAdminOnly: false,
      isEditable: true,
      steps: []
    };

    onSurveyChange(prev => {
      const newCards = [...prev.cards];
      // Insert before the last admin card
      newCards.splice(lastAdminCardIndex, 0, newCard);
      return {
        ...prev,
        cards: newCards
      };
    });
  };

  const deleteCard = (cardIndex) => {
    const card = survey.cards[cardIndex];
    if (!canDeleteCard(card, cardIndex)) return;

    if (window.confirm(`Opravdu chcete smazat "${card.title}"? Všechny bloky v této sekci budou ztraceny.`)) {
      onSurveyChange(prev => ({
        ...prev,
        cards: prev.cards.filter((_, index) => index !== cardIndex)
      }));

      // Adjust active card index if needed
      if (activeCardIndex === cardIndex) {
        // Move to the previous card or first editable card
        const newActiveIndex = cardIndex > 0 ? cardIndex - 1 : 0;
        onActiveCardChange(newActiveIndex);
      } else if (activeCardIndex > cardIndex) {
        onActiveCardChange(activeCardIndex - 1);
      }
    }
  };

  const renameCard = (cardIndex, newTitle) => {
    onSurveyChange(prev => ({
      ...prev,
      cards: prev.cards.map((card, index) => 
        index === cardIndex ? { ...card, title: newTitle } : card
      )
    }));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Card Management Panel */}
      <div style={{
        backgroundColor: '#f8f9fa',
        padding: '12px 20px',
        borderBottom: '2px solid #dee2e6',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '15px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ 
            fontWeight: 'bold', 
            color: '#495057',
            fontSize: '14px'
          }}>
            📋 Správa kroků:
          </span>
          
          <button
            onClick={addNewCard}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              padding: '8px 12px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '13px',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#218838'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#28a745'}
            title="Přidat nový krok mezi uživatelské sekce"
          >
            ➕ Přidat krok
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <small style={{ color: '#6c757d', fontSize: '12px' }}>
            💡 Tip: Kliknutím na krok ho aktivujete, systémové kroky 🔒 může editovat pouze admin
          </small>
          
          <div style={{ 
            backgroundColor: '#e9ecef',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '12px',
            fontWeight: 'bold',
            color: '#495057'
          }}>
            {survey.cards.filter(card => !card.isSystem).length} {survey.cards.filter(card => !card.isSystem).length === 1 ? 'krok' : survey.cards.filter(card => !card.isSystem).length < 5 ? 'kroky' : 'kroků'}
          </div>
        </div>
      </div>

      {/* Card Tabs - Hide system cards */}
      <div style={{ 
        display: 'flex', 
        borderBottom: '1px solid #dee2e6',
        backgroundColor: '#f8f9fa',
        borderRadius: '0'
      }}>
        {survey.cards
          .filter(card => !card.isSystem) // Hide system cards from the interface
          .map((card, filteredIndex) => {
            // Find the original index in the unfiltered array
            const originalIndex = survey.cards.findIndex(c => c.id === card.id);
            return (
              <CardTab
                key={card.id}
                card={card}
                index={originalIndex}
                isActive={activeCardIndex === originalIndex}
                canEdit={canEditCard(card)}
                canDelete={canDeleteCard(card, originalIndex)}
                isAdmin={isAdmin}
                onClick={() => handleCardClick(originalIndex)}
                onDelete={() => deleteCard(originalIndex)}
                onRename={(newTitle) => renameCard(originalIndex, newTitle)}
              />
            );
          })}
      </div>

      {/* Active Card Content */}
      <div style={{ flex: 1, backgroundColor: 'white' }}>
        {survey.cards[activeCardIndex] && (
          <SurveyCanvas 
            steps={survey.cards[activeCardIndex].steps}
            onStepsChange={(newSteps) => handleStepsChange(activeCardIndex, newSteps)}
            onEditStep={onEditStep}
            onDeleteStep={(stepId) => onDeleteStep(stepId, activeCardIndex)}
            cardInfo={survey.cards[activeCardIndex]}
            canEdit={canEditCard(survey.cards[activeCardIndex])}
            isAdmin={isAdmin}
          />
        )}
      </div>
    </div>
  );
};

// New CardTab component for individual card management
const CardTab = ({ card, index, isActive, canEdit, canDelete, isAdmin, onClick, onDelete, onRename }) => {
  const [isEditing, setIsEditing] = React.useState(false);
  const [editTitle, setEditTitle] = React.useState(card.title);

  const handleDoubleClick = () => {
    if (canEdit && !card.isAdminOnly) {
      setIsEditing(true);
      setEditTitle(card.title);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setEditTitle(card.title);
    }
  };

  const handleSaveEdit = () => {
    if (editTitle.trim() && editTitle !== card.title) {
      onRename(editTitle.trim());
    }
    setIsEditing(false);
  };

  return (
    <div
      onClick={!isEditing ? onClick : undefined}
      onDoubleClick={handleDoubleClick}
      style={{
        flex: 1,
        padding: '15px 20px',
        cursor: isEditing ? 'default' : 'pointer',
        backgroundColor: isActive ? '#007bff' : 'transparent',
        color: isActive ? 'white' : (card.isAdminOnly && !isAdmin ? '#999' : '#495057'),
        borderBottom: isActive ? '3px solid #0056b3' : '3px solid transparent',
        transition: 'all 0.2s ease',
        opacity: card.isAdminOnly && !isAdmin ? 0.6 : 1,
        position: 'relative',
        minWidth: '180px'
      }}
      onMouseEnter={(e) => {
        if (!isActive && (canEdit || !card.isAdminOnly) && !isEditing) {
          e.target.style.backgroundColor = '#e9ecef';
        }
      }}
      onMouseLeave={(e) => {
        if (!isActive && !isEditing) {
          e.target.style.backgroundColor = 'transparent';
        }
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ flex: 1 }}>
          {isEditing ? (
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onBlur={handleSaveEdit}
              onKeyDown={handleKeyPress}
              style={{
                backgroundColor: 'white',
                color: '#000',
                border: '2px solid #007bff',
                borderRadius: '3px',
                padding: '4px 8px',
                fontSize: '14px',
                fontWeight: 'bold',
                width: '100%',
                outline: 'none'
              }}
              autoFocus
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <h5 style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: 'bold' }}>
              {card.title}
              {card.isAdminOnly && (
                <span style={{ 
                  marginLeft: '8px', 
                  fontSize: '12px',
                  backgroundColor: '#dc3545',
                  color: 'white',
                  padding: '2px 6px',
                  borderRadius: '3px'
                }}>
                  Admin
                </span>
              )}
            </h5>
          )}
          
          {!isEditing && (
            <small style={{ 
              opacity: 0.8, 
              fontSize: '11px',
              display: 'block' 
            }}>
              {card.description}
            </small>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px', marginLeft: '10px' }}>
          <div style={{ 
            backgroundColor: isActive ? 'rgba(255,255,255,0.2)' : '#6c757d',
            color: 'white',
            borderRadius: '12px',
            padding: '2px 8px',
            fontSize: '11px',
            fontWeight: 'bold'
          }}>
            Krok {index + 1}
          </div>
          
          <div style={{ 
            backgroundColor: isActive ? 'rgba(255,255,255,0.1)' : '#28a745',
            color: 'white',
            borderRadius: '8px',
            padding: '1px 6px',
            fontSize: '10px',
            fontWeight: 'bold'
          }}>
            {card.steps.length} {card.steps.length === 1 ? 'blok' : card.steps.length < 5 ? 'bloky' : 'bloků'}
          </div>
        </div>
      </div>
      
      {/* Card Actions */}
      <div style={{
        position: 'absolute',
        top: '4px',
        right: '4px',
        display: 'flex',
        gap: '4px',
        opacity: isActive ? 1 : 0.7
      }}>
        {!canEdit && (
          <span style={{ fontSize: '16px' }}>🔒</span>
        )}
        
        {canDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '14px',
              cursor: 'pointer',
              padding: '2px',
              borderRadius: '2px',
              color: isActive ? 'rgba(255,255,255,0.8)' : '#dc3545'
            }}
            title="Smazat tento krok"
            onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(220, 53, 69, 0.1)'}
            onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
          >
            ❌
          </button>
        )}
        
        {canEdit && !card.isAdminOnly && !isEditing && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDoubleClick();
            }}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '12px',
              cursor: 'pointer',
              padding: '2px',
              borderRadius: '2px',
              color: isActive ? 'rgba(255,255,255,0.8)' : '#6c757d'
            }}
            title="Přejmenovat krok (nebo dvojklik)"
            onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(108, 117, 125, 0.1)'}
            onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
          >
            ✏️
          </button>
        )}
      </div>
      
      {!isEditing && canEdit && !card.isAdminOnly && (
        <div style={{
          position: 'absolute',
          bottom: '2px',
          left: '50%',
          transform: 'translateX(-50%)',
          fontSize: '9px',
          opacity: 0.6,
          color: isActive ? 'rgba(255,255,255,0.6)' : '#6c757d'
        }}>
          Dvojklik = přejmenovat
        </div>
      )}
    </div>
  );
};

// Wrapper component to handle URL parameters
const SurveyCreatorWithParams = () => {
  const { surveyId } = useParams();
  return <SurveyCreator editingSurveyId={surveyId} />;
};

// Wrapper component for Global Surveys mode
const GlobalSurveysCreator = () => {
  return <SurveyCreator globalMode={true} />;
};

const SurveyList = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [surveys, setSurveys] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);


  // Fetch surveys
  React.useEffect(() => {
    fetchSurveys();
  }, []);

  const fetchSurveys = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/surveys', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setSurveys(data.surveys || []);
      } else {
        throw new Error('Chyba při načítání dotazníků');
      }
    } catch (error) {
      console.error('Error fetching surveys:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (survey) => {
    navigate(`/survey-creator/edit/${survey.id}`);
  };

  const handleDelete = async (surveyId, surveyTitle) => {
    if (window.confirm(`Opravdu chcete smazat dotazník "${surveyTitle}"?`)) {
      try {
        const response = await fetch(`/api/surveys/${surveyId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (response.ok) {
          await fetchSurveys();
          alert('Dotazník byl smazán');
        } else {
          throw new Error('Chyba při mazání dotazníku');
        }
      } catch (error) {
        console.error('Error deleting survey:', error);
        alert('Chyba při mazání dotazníku: ' + error.message);
      }
    }
  };



  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return '#28a745';
      case 'draft': return '#6c757d';
      case 'paused': return '#ffc107';
      case 'completed': return '#17a2b8';
      default: return '#6c757d';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'active': return 'Aktivní';
      case 'draft': return 'Koncept';
      case 'paused': return 'Pozastaveno';
      case 'completed': return 'Dokončeno';
      default: return status;
    }
  };

  if (loading) {
    return <div style={{ padding: '20px' }}>Načítání dotazníků...</div>;
  }

  if (error) {
    return (
      <div style={{ padding: '20px' }}>
        <div style={{ color: 'red', marginBottom: '10px' }}>Chyba: {error}</div>
        <button onClick={fetchSurveys} style={{ padding: '8px 16px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px' }}>
          Zkusit znovu
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Seznam dotazníků</h2>
        <div style={{ fontSize: '14px', color: '#6c757d' }}>
          {user?.role === 'admin' ? 'Zobrazeny všechny dotazníky' : 'Zobrazeny vaše dotazníky'}
        </div>
      </div>

      {surveys.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#6c757d' }}>
          <p>Žádné dotazníky nebyly nalezeny.</p>
          <p>Začněte vytvořením nového dotazníku v Survey Creator.</p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8f9fa' }}>
                <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #dee2e6', fontWeight: 'bold' }}>Název</th>
                <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #dee2e6', fontWeight: 'bold' }}>Vlastník</th>
                <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #dee2e6', fontWeight: 'bold' }}>Status</th>
                <th style={{ padding: '12px', textAlign: 'center', border: '1px solid #dee2e6', fontWeight: 'bold' }}>Aktivní tokeny</th>
                <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #dee2e6', fontWeight: 'bold' }}>Vytvořeno</th>
                <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #dee2e6', fontWeight: 'bold' }}>Upraveno</th>
                <th style={{ padding: '12px', textAlign: 'center', border: '1px solid #dee2e6', fontWeight: 'bold' }}>Akce</th>
              </tr>
            </thead>
            <tbody>
              {surveys.map(survey => (
                <tr key={survey.id} style={{ backgroundColor: survey.id % 2 === 0 ? '#f9f9f9' : 'white' }}>
                  <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>{survey.title}</div>
                    {survey.description && (
                      <div style={{ fontSize: '12px', color: '#6c757d', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {survey.description}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>
                    <div style={{ fontWeight: 'bold' }}>{survey.owner_username}</div>
                    {user?.role === 'admin' && survey.user_id !== user.id && (
                      <div style={{ fontSize: '11px', color: '#dc3545', fontWeight: 'bold' }}>CIZÍ</div>
                    )}
                  </td>
                  <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>
                    <span style={{ 
                      padding: '4px 8px', 
                      borderRadius: '12px',
                      backgroundColor: getStatusColor(survey.status),
                      color: 'white',
                      fontSize: '12px',
                      fontWeight: 'bold'
                    }}>
                      {getStatusText(survey.status)}
                    </span>
                  </td>
                  <td style={{ padding: '12px', border: '1px solid #dee2e6', textAlign: 'center' }}>
                    {survey.is_active ? (
                      <span style={{ 
                        padding: '4px 8px', 
                        borderRadius: '12px',
                        backgroundColor: '#28a745',
                        color: 'white',
                        fontSize: '12px',
                        fontWeight: 'bold'
                      }}>
                        AKTIVNÍ
                      </span>
                    ) : (
                      <span style={{ 
                        padding: '4px 8px', 
                        borderRadius: '12px',
                        backgroundColor: '#6c757d',
                        color: 'white',
                        fontSize: '12px'
                      }}>
                        NEAKTIVNÍ
                      </span>
                    )}
                    <div style={{ fontSize: '11px', color: '#6c757d', marginTop: '2px' }}>
                      {survey.token_count || 0} tokenů
                    </div>
                  </td>
                  <td style={{ padding: '12px', border: '1px solid #dee2e6', fontSize: '13px' }}>
                    {new Date(survey.created_at).toLocaleDateString('cs-CZ', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric'
                    })}
                    <div style={{ fontSize: '11px', color: '#6c757d' }}>
                      {new Date(survey.created_at).toLocaleTimeString('cs-CZ', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </td>
                  <td style={{ padding: '12px', border: '1px solid #dee2e6', fontSize: '13px' }}>
                    {new Date(survey.updated_at).toLocaleDateString('cs-CZ', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric'
                    })}
                    <div style={{ fontSize: '11px', color: '#6c757d' }}>
                      {new Date(survey.updated_at).toLocaleTimeString('cs-CZ', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </td>
                  <td style={{ padding: '12px', border: '1px solid #dee2e6', textAlign: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center' }}>
                      {(user?.role === 'admin' || survey.user_id === user?.id) && (
                        <>
                          <button 
                            onClick={() => handleEdit(survey)}
                            style={{ 
                              padding: '4px 8px', 
                              backgroundColor: '#ffc107', 
                              border: 'none', 
                              borderRadius: '3px',
                              fontSize: '12px',
                              cursor: 'pointer',
                              minWidth: '60px'
                            }}
                            title="Upravit dotazník"
                          >
                            Upravit
                          </button>
                          
                          <button 
                            onClick={() => handleDelete(survey.id, survey.title)}
                            style={{ 
                              padding: '4px 8px', 
                              backgroundColor: '#dc3545', 
                              color: 'white', 
                              border: 'none', 
                              borderRadius: '3px',
                              fontSize: '12px',
                              cursor: 'pointer',
                              minWidth: '60px'
                            }}
                            title="Smazat dotazník"
                          >
                            Smazat
                          </button>
                        </>
                      )}
                      
                      {user?.role !== 'admin' && survey.user_id !== user?.id && (
                        <span style={{ fontSize: '12px', color: '#6c757d', fontStyle: 'italic' }}>
                          Pouze zobrazení
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}


    </div>
  );
};

const TokenList = () => {
  const { user } = useAuth();
  const [tokens, setTokens] = React.useState([]);
  const [surveys, setSurveys] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [showCreateForm, setShowCreateForm] = React.useState(false);
  const [newToken, setNewToken] = React.useState({
    surveyId: '',
    allowedDomains: '',
    validFrom: '',
    validTo: ''
  });

  // Fetch tokens and surveys
  React.useEffect(() => {
    fetchTokens();
    fetchSurveys();
  }, []);

  const fetchTokens = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/tokens', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setTokens(data.tokens || []);
      } else {
        throw new Error('Chyba při načítání tokenů');
      }
    } catch (error) {
      console.error('Error fetching tokens:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchSurveys = async () => {
    try {
      const response = await fetch('/api/surveys', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setSurveys(data.surveys || []);
      }
    } catch (error) {
      console.error('Error fetching surveys:', error);
    }
  };

  const handleCreateToken = async (e) => {
    e.preventDefault();
    
    if (!newToken.surveyId) {
      alert('Vyberte prosím dotazník');
      return;
    }

    try {
      const response = await fetch('/api/tokens', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          survey_id: newToken.surveyId,
          allowed_domains: newToken.allowedDomains.split('\n').filter(d => d.trim()),
          valid_from: newToken.validFrom || null,
          valid_until: newToken.validTo || null
        })
      });

      if (response.ok) {
        await fetchTokens();
        setShowCreateForm(false);
        setNewToken({ surveyId: '', allowedDomains: '', validFrom: '', validTo: '' });
        alert('Token byl úspěšně vytvořen!');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Chyba při vytváření tokenu');
      }
    } catch (error) {
      console.error('Error creating token:', error);
      alert('Chyba při vytváření tokenu: ' + error.message);
    }
  };

  const handleToggleStatus = async (tokenId, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'paused' : 'active';
    const action = newStatus === 'active' ? 'obnovit' : 'pozastavit';
    const endpoint = newStatus === 'active' ? 'resume' : 'pause';
    
    if (window.confirm(`Opravdu chcete ${action} tento token?`)) {
      try {
        const response = await fetch(`/api/tokens/${tokenId}/${endpoint}`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (response.ok) {
          await fetchTokens();
          alert(`Token byl ${newStatus === 'active' ? 'obnoven' : 'pozastaven'}`);
        } else {
          throw new Error('Chyba při změně statusu');
        }
      } catch (error) {
        console.error('Error updating token:', error);
        alert('Chyba při změně statusu: ' + error.message);
      }
    }
  };

  const handleDeleteToken = async (tokenId, tokenName) => {
    if (window.confirm(`Opravdu chcete smazat token "${tokenName}"?`)) {
      try {
        const response = await fetch(`/api/tokens/${tokenId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (response.ok) {
          await fetchTokens();
          alert('Token byl smazán');
        } else {
          throw new Error('Chyba při mazání tokenu');
        }
      } catch (error) {
        console.error('Error deleting token:', error);
        alert('Chyba při mazání tokenu: ' + error.message);
      }
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      alert('Kód byl zkopírován do schránky!');
    }).catch(() => {
      alert('Chyba při kopírování do schránky');
    });
  };

  const getStatusColor = (status) => {
    return status === 'active' ? '#28a745' : '#6c757d';
  };

  const getStatusText = (status) => {
    return status === 'active' ? 'Aktivní' : 'Pozastaveno';
  };

  if (loading) {
    return <div style={{ padding: '20px' }}>Načítání tokenů...</div>;
  }

  if (error) {
    return (
      <div style={{ padding: '20px' }}>
        <div style={{ color: 'red', marginBottom: '10px' }}>Chyba: {error}</div>
        <button onClick={fetchTokens} style={{ padding: '8px 16px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px' }}>
          Zkusit znovu
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Survey Tokenisation</h2>
        <div style={{ fontSize: '14px', color: '#6c757d' }}>
          {user?.role === 'admin' ? 'Zobrazeny všechny tokeny' : 'Zobrazeny vaše tokeny'}
        </div>
      </div>

      <div style={{ 
        backgroundColor: '#e3f2fd', 
        border: '1px solid #2196f3', 
        borderRadius: '8px', 
        padding: '16px', 
        marginBottom: '20px' 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
          <span style={{ fontSize: '20px', marginRight: '8px' }}>📡</span>
          <strong style={{ color: '#1976d2' }}>EMBEDOVÁNÍ WIDGETŮ</strong>
        </div>
        <p style={{ margin: '0', color: '#1976d2', fontSize: '14px' }}>
          Vytvořte tokeny pro embedování dotazníků na externí weby. 
          Každý token generuje JavaScript soubor, který můžete vložit na vaše stránky.
        </p>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3>Seznam tokenů</h3>
        <button 
          onClick={() => setShowCreateForm(true)}
          style={{ 
            padding: '8px 16px', 
            backgroundColor: '#28a745', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          ➕ Tokenise survey (Add)
        </button>
      </div>

      {showCreateForm && (
        <div style={{ 
          backgroundColor: '#f8f9fa', 
          border: '1px solid #dee2e6', 
          borderRadius: '8px', 
          padding: '20px', 
          marginBottom: '20px' 
        }}>
          <h4>Vytvořit nový token</h4>
          <form onSubmit={handleCreateToken}>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Vyberte dotazník *
              </label>
              <select 
                value={newToken.surveyId}
                onChange={(e) => setNewToken({...newToken, surveyId: e.target.value})}
                style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                required
              >
                <option value="">-- Vyberte dotazník --</option>
                {surveys.map(survey => (
                  <option key={survey.id} value={survey.id}>
                    {survey.title} ({getStatusText(survey.status)})
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Povolené domény (whitelist)
              </label>
              <textarea 
                value={newToken.allowedDomains}
                onChange={(e) => setNewToken({...newToken, allowedDomains: e.target.value})}
                placeholder="example.com&#10;subdomain.example.com&#10;*.example.org"
                style={{ 
                  width: '100%', 
                  padding: '8px', 
                  border: '1px solid #ccc', 
                  borderRadius: '4px', 
                  minHeight: '80px',
                  resize: 'vertical'
                }}
              />
              <small style={{ color: '#6c757d' }}>
                Zadejte každou doménu na nový řádek. Nechte prázdné pro povolení všech domén.
              </small>
            </div>

            <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  Platnost od
                </label>
                <input 
                  type="datetime-local"
                  value={newToken.validFrom}
                  onChange={(e) => setNewToken({...newToken, validFrom: e.target.value})}
                  style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  Platnost do
                </label>
                <input 
                  type="datetime-local"
                  value={newToken.validTo}
                  onChange={(e) => setNewToken({...newToken, validTo: e.target.value})}
                  style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button 
                type="button"
                onClick={() => {
                  setShowCreateForm(false);
                  setNewToken({ surveyId: '', allowedDomains: '', validFrom: '', validTo: '' });
                }}
                style={{ padding: '8px 16px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '4px' }}
              >
                Zrušit
              </button>
              <button 
                type="submit"
                style={{ padding: '8px 16px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px' }}
              >
                Vytvořit token
              </button>
            </div>
          </form>
        </div>
      )}

      {tokens.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#6c757d' }}>
          <p>Žádné tokeny nebyly nalezeny.</p>
          <p>Začněte vytvořením nového tokenu pro embedování dotazníků.</p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8f9fa' }}>
                <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #dee2e6', fontWeight: 'bold' }}>Token ID</th>
                <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #dee2e6', fontWeight: 'bold' }}>Dotazník</th>
                <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #dee2e6', fontWeight: 'bold' }}>Vlastník</th>
                <th style={{ padding: '12px', textAlign: 'center', border: '1px solid #dee2e6', fontWeight: 'bold' }}>Status</th>
                <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #dee2e6', fontWeight: 'bold' }}>Platnost</th>
                <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #dee2e6', fontWeight: 'bold' }}>Embed kód</th>
                <th style={{ padding: '12px', textAlign: 'center', border: '1px solid #dee2e6', fontWeight: 'bold' }}>Statistiky</th>
                <th style={{ padding: '12px', textAlign: 'center', border: '1px solid #dee2e6', fontWeight: 'bold' }}>Akce</th>
              </tr>
            </thead>
            <tbody>
              {tokens.map(token => (
                <tr key={token.id} style={{ backgroundColor: token.id % 2 === 0 ? '#f9f9f9' : 'white' }}>
                  <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>
                    <code style={{ 
                      backgroundColor: '#f8f9fa', 
                      padding: '2px 4px', 
                      borderRadius: '3px',
                      fontSize: '12px'
                    }}>
                      {token.token_id}
                    </code>
                  </td>
                  <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>
                    <div style={{ fontWeight: 'bold' }}>{token.survey_title}</div>
                    <div style={{ fontSize: '12px', color: '#6c757d' }}>ID: {token.survey_id}</div>
                  </td>
                  <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>
                    <div style={{ fontWeight: 'bold' }}>{token.owner_username}</div>
                    {user?.role === 'admin' && token.user_id !== user.id && (
                      <div style={{ fontSize: '11px', color: '#dc3545', fontWeight: 'bold' }}>CIZÍ</div>
                    )}
                  </td>
                  <td style={{ padding: '12px', border: '1px solid #dee2e6', textAlign: 'center' }}>
                    <span style={{ 
                      padding: '4px 8px', 
                      borderRadius: '12px',
                      backgroundColor: getStatusColor(token.status),
                      color: 'white',
                      fontSize: '12px',
                      fontWeight: 'bold'
                    }}>
                      {getStatusText(token.status)}
                    </span>
                  </td>
                  <td style={{ padding: '12px', border: '1px solid #dee2e6', fontSize: '13px' }}>
                    {token.valid_from && (
                      <div>
                        <strong>Od:</strong> {new Date(token.valid_from).toLocaleDateString('cs-CZ')}
                      </div>
                    )}
                    {token.valid_to && (
                      <div>
                        <strong>Do:</strong> {new Date(token.valid_to).toLocaleDateString('cs-CZ')}
                      </div>
                    )}
                    {!token.valid_from && !token.valid_to && (
                      <span style={{ color: '#6c757d', fontStyle: 'italic' }}>Bez omezení</span>
                    )}
                  </td>
                  <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>
                    <div style={{ 
                      backgroundColor: '#f8f9fa', 
                      border: '1px solid #dee2e6', 
                      borderRadius: '4px', 
                      padding: '8px',
                      fontSize: '12px',
                      fontFamily: 'monospace',
                      marginBottom: '5px'
                    }}>
                      {`<script src="${window.location.origin}/widget_${token.token_id}.js"></script>`}
                    </div>
                                         <div style={{ display: 'flex', gap: '4px' }}>
                       <button 
                         onClick={() => copyToClipboard(`<script src="${window.location.origin}/widget_${token.token_id}.js"></script>`)}
                         style={{ 
                           padding: '4px 8px', 
                           backgroundColor: '#17a2b8', 
                           color: 'white', 
                           border: 'none', 
                           borderRadius: '3px',
                           fontSize: '11px',
                           cursor: 'pointer'
                         }}
                         title="Zkopírovat do schránky"
                       >
                         📋 Kopírovat
                       </button>
                       <button 
                         onClick={() => window.open(`/widget_${token.token_id}.html`, '_blank')}
                         style={{ 
                           padding: '4px 8px', 
                           backgroundColor: '#28a745', 
                           color: 'white', 
                           border: 'none', 
                           borderRadius: '3px',
                           fontSize: '11px',
                           cursor: 'pointer'
                         }}
                         title="Zobrazit náhled widgetu"
                       >
                         👁️ Náhled
                       </button>
                     </div>
                  </td>
                  <td style={{ padding: '12px', border: '1px solid #dee2e6', textAlign: 'center' }}>
                    <button 
                      onClick={() => window.open(`/statistics/${token.survey_id}`, '_blank')}
                      style={{ 
                        padding: '6px 12px', 
                        backgroundColor: '#6f42c1', 
                        color: 'white', 
                        border: 'none', 
                        borderRadius: '4px',
                        fontSize: '12px',
                        cursor: 'pointer',
                        fontWeight: 'bold'
                      }}
                      title="Zobrazit statistiky dotazníku"
                    >
                      📊 Statistiky
                    </button>
                  </td>
                  <td style={{ padding: '12px', border: '1px solid #dee2e6', textAlign: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center' }}>
                      {(user?.role === 'admin' || token.user_id === user?.id) && (
                        <>
                          <button 
                            onClick={() => handleToggleStatus(token.id, token.status)}
                            style={{ 
                              padding: '4px 8px', 
                              backgroundColor: token.status === 'active' ? '#ffc107' : '#28a745',
                              color: token.status === 'active' ? 'black' : 'white',
                              border: 'none', 
                              borderRadius: '3px',
                              fontSize: '12px',
                              cursor: 'pointer',
                              minWidth: '70px'
                            }}
                            title={token.status === 'active' ? 'Pozastavit token' : 'Obnovit token'}
                          >
                            {token.status === 'active' ? 'Pozastavit' : 'Obnovit'}
                          </button>
                          
                          <button 
                            onClick={() => handleDeleteToken(token.id, token.token_id)}
                            style={{ 
                              padding: '4px 8px', 
                              backgroundColor: '#dc3545', 
                              color: 'white', 
                              border: 'none', 
                              borderRadius: '3px',
                              fontSize: '12px',
                              cursor: 'pointer',
                              minWidth: '70px'
                            }}
                            title="Smazat token"
                          >
                            Smazat
                          </button>
                        </>
                      )}
                      
                      {user?.role !== 'admin' && token.user_id !== user?.id && (
                        <span style={{ fontSize: '12px', color: '#6c757d', fontStyle: 'italic' }}>
                          Pouze zobrazení
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const UserList = () => {
  const [users, setUsers] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [editingUser, setEditingUser] = React.useState(null);
  const [showCreateForm, setShowCreateForm] = React.useState(false);

  // Fetch users
  React.useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/users', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        // Handle API response format - it returns {users: [...], pagination: {...}}
        setUsers(data.users || data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (user) => {
    setEditingUser({...user, newPassword: ''});
  };

  const handleSave = async () => {
    try {
      const { id, newPassword, ...updateData } = editingUser;
      if (newPassword) {
        updateData.password = newPassword;
      }

      const response = await fetch(`/api/users/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(updateData)
      });

      if (response.ok) {
        await fetchUsers();
        setEditingUser(null);
        alert('Uživatel byl úspěšně upraven');
      } else {
        alert('Chyba při ukládání uživatele');
      }
    } catch (error) {
      console.error('Error saving user:', error);
      alert('Chyba při ukládání uživatele');
    }
  };

  const handleDelete = async (userId, username) => {
    if (window.confirm(`Opravdu chcete smazat uživatele "${username}"?`)) {
      try {
        const response = await fetch(`/api/users/${userId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (response.ok) {
          await fetchUsers();
          alert('Uživatel byl smazán');
        } else {
          alert('Chyba při mazání uživatele');
        }
      } catch (error) {
        console.error('Error deleting user:', error);
        alert('Chyba při mazání uživatele');
      }
    }
  };

  const handleCreate = async (userData) => {
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(userData)
      });

      if (response.ok) {
        await fetchUsers();
        setShowCreateForm(false);
        alert('Uživatel byl vytvořen');
      } else {
        const error = await response.json();
        alert('Chyba při vytváření uživatele: ' + error.error);
      }
    } catch (error) {
      console.error('Error creating user:', error);
      alert('Chyba při vytváření uživatele');
    }
  };

  if (loading) {
    return <div style={{ padding: '20px' }}>Načítání uživatelů...</div>;
  }

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Správa uživatelů</h2>
        <button 
          onClick={() => setShowCreateForm(true)}
          style={{ padding: '8px 16px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px' }}
        >
          Přidat uživatele
        </button>
      </div>

      {showCreateForm && (
        <UserForm 
          onSave={handleCreate}
          onCancel={() => setShowCreateForm(false)}
          title="Vytvořit nového uživatele"
        />
      )}

      {editingUser && (
        <UserForm 
          user={editingUser}
          onSave={() => handleSave()}
          onCancel={() => setEditingUser(null)}
          onChange={setEditingUser}
          title="Upravit uživatele"
        />
      )}

      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
        <thead>
          <tr style={{ backgroundColor: '#f8f9fa' }}>
            <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #dee2e6' }}>Uživatelské jméno</th>
            <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #dee2e6' }}>Email</th>
            <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #dee2e6' }}>Role</th>
            <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #dee2e6' }}>Vytvořeno</th>
            <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #dee2e6' }}>Akce</th>
          </tr>
        </thead>
        <tbody>
          {users.map(user => (
            <tr key={user.id}>
              <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>{user.username}</td>
              <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>{user.email}</td>
              <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>
                <span style={{ 
                  padding: '4px 8px', 
                  borderRadius: '4px',
                  backgroundColor: user.role === 'admin' ? '#dc3545' : '#007bff',
                  color: 'white',
                  fontSize: '12px'
                }}>
                  {user.role}
                </span>
              </td>
              <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>
                {new Date(user.created_at).toLocaleDateString('cs-CZ')}
              </td>
              <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>
                <button 
                  onClick={() => handleEdit(user)}
                  style={{ padding: '4px 8px', marginRight: '8px', backgroundColor: '#ffc107', border: 'none', borderRadius: '3px' }}
                >
                  Upravit
                </button>
                <button 
                  onClick={() => handleDelete(user.id, user.username)}
                  style={{ padding: '4px 8px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '3px' }}
                >
                  Smazat
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {users.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px', color: '#6c757d' }}>
          Žádní uživatelé nebyli nalezeni
        </div>
      )}
    </div>
  );
};

const AuditLogs = () => {
  const [logs, setLogs] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [filters, setFilters] = React.useState({
    eventType: '',
    userId: '',
    dateFrom: '',
    dateTo: '',
    page: 1,
    limit: 50
  });

  // Fetch logs
  React.useEffect(() => {
    fetchLogs();
  }, [filters]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      
      // Map frontend filters to backend API parameters
      if (filters.eventType) queryParams.append('action', filters.eventType);
      if (filters.userId) queryParams.append('user_id', filters.userId);
      if (filters.dateFrom) queryParams.append('from_date', filters.dateFrom + 'T00:00:00Z');
      if (filters.dateTo) queryParams.append('to_date', filters.dateTo + 'T23:59:59Z');
      if (filters.page) queryParams.append('page', filters.page);
      if (filters.limit) queryParams.append('limit', filters.limit);

      const response = await fetch(`/api/logs?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setLogs(data.logs || data);
      }
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value, page: 1 }));
  };

  const getEventTypeColor = (eventType) => {
    const colors = {
      'LOGIN': '#28a745',
      'LOGOUT': '#6c757d',
      'CREATE': '#007bff',
      'UPDATE': '#ffc107',
      'DELETE': '#dc3545',
      'TOKEN_CREATE': '#17a2b8',
      'TOKEN_PAUSE': '#fd7e14',
      'TOKEN_RESUME': '#20c997',
      'TOKEN_DELETE': '#e83e8c',
      'SURVEY_DELIVERY': '#6f42c1'
    };
    return colors[eventType] || '#6c757d';
  };

  const formatEventDescription = (log) => {
    switch(log.action) {
      case 'LOGIN':
        return `Uživatel se přihlásil`;
      case 'LOGOUT':
        return `Uživatel se odhlásil`;
      case 'CREATE':
        return `Vytvořil ${log.resource_type}: ${log.resource_id}`;
      case 'UPDATE':
        return `Upravil ${log.resource_type}: ${log.resource_id}`;
      case 'DELETE':
        return `Smazal ${log.resource_type}: ${log.resource_id}`;
      case 'TOKEN_CREATE':
        return `Vytvořil token pro survey: ${log.resource_id}`;
      case 'TOKEN_PAUSE':
        return `Pozastavil token: ${log.resource_id}`;
      case 'TOKEN_RESUME':
        return `Obnovil token: ${log.resource_id}`;
      case 'TOKEN_DELETE':
        return `Smazal token: ${log.resource_id}`;
      case 'SURVEY_DELIVERY':
        return `Survey doručen přes token: ${log.resource_id}`;
      default:
        return log.action;
    }
  };

  if (loading) {
    return <div style={{ padding: '20px' }}>Načítání audit logů...</div>;
  }

  return (
    <div style={{ padding: '20px' }}>
      <h2>Audit Logs</h2>
      <p style={{ color: '#6c757d', marginBottom: '20px' }}>
        Kompletní záznam všech aktivit v systému
      </p>

      {/* Filters */}
      <div style={{ 
        backgroundColor: '#f8f9fa', 
        padding: '20px', 
        borderRadius: '8px', 
        marginBottom: '20px',
        border: '1px solid #dee2e6'
      }}>
        <h4 style={{ marginBottom: '15px' }}>Filtry</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Typ události
            </label>
            <select
              value={filters.eventType}
              onChange={(e) => handleFilterChange('eventType', e.target.value)}
              style={{ width: '100%', padding: '8px', border: '1px solid #ced4da', borderRadius: '4px' }}
            >
              <option value="">Všechny</option>
              <option value="LOGIN">Přihlášení</option>
              <option value="LOGOUT">Odhlášení</option>
              <option value="CREATE">Vytvoření</option>
              <option value="UPDATE">Úprava</option>
              <option value="DELETE">Smazání</option>
              <option value="TOKEN_CREATE">Vytvoření tokenu</option>
              <option value="TOKEN_PAUSE">Pozastavení tokenu</option>
              <option value="TOKEN_RESUME">Obnovení tokenu</option>
              <option value="TOKEN_DELETE">Smazání tokenu</option>
              <option value="SURVEY_DELIVERY">Doručení survey</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Od data
            </label>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
              style={{ width: '100%', padding: '8px', border: '1px solid #ced4da', borderRadius: '4px' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Do data
            </label>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => handleFilterChange('dateTo', e.target.value)}
              style={{ width: '100%', padding: '8px', border: '1px solid #ced4da', borderRadius: '4px' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              ID uživatele
            </label>
            <input
              type="text"
              value={filters.userId}
              onChange={(e) => handleFilterChange('userId', e.target.value)}
              placeholder="např. 1"
              style={{ width: '100%', padding: '8px', border: '1px solid #ced4da', borderRadius: '4px' }}
            />
          </div>
        </div>

        <div style={{ marginTop: '15px' }}>
          <button 
            onClick={() => setFilters({ eventType: '', userId: '', dateFrom: '', dateTo: '', page: 1, limit: 50 })}
            style={{ padding: '8px 16px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '4px' }}
          >
            Vymazat filtry
          </button>
        </div>
      </div>

      {/* Logs Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8f9fa' }}>
              <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #dee2e6', minWidth: '150px' }}>Datum a čas</th>
              <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #dee2e6', minWidth: '80px' }}>Uživatel</th>
              <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #dee2e6', minWidth: '120px' }}>Typ události</th>
              <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #dee2e6', minWidth: '200px' }}>Popis</th>
              <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #dee2e6', minWidth: '120px' }}>IP adresa</th>
              <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #dee2e6', minWidth: '150px' }}>User Agent</th>
            </tr>
          </thead>
          <tbody>
            {logs.map(log => (
              <tr key={log.id} style={{ borderBottom: '1px solid #dee2e6' }}>
                <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>
                  {new Date(log.timestamp).toLocaleString('cs-CZ')}
                </td>
                <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>
                  {log.username || log.user_id || 'N/A'}
                </td>
                <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>
                  <span style={{ 
                    padding: '4px 8px', 
                    borderRadius: '4px',
                    backgroundColor: getEventTypeColor(log.action),
                    color: 'white',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}>
                    {log.action}
                  </span>
                </td>
                <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>
                  {formatEventDescription(log)}
                  {log.details && (
                    <div style={{ fontSize: '12px', color: '#6c757d', marginTop: '4px' }}>
                      {typeof log.details === 'string' ? log.details : JSON.stringify(log.details)}
                    </div>
                  )}
                </td>
                <td style={{ padding: '12px', border: '1px solid #dee2e6', fontFamily: 'monospace' }}>
                  {log.ip_address || 'N/A'}
                </td>
                <td style={{ padding: '12px', border: '1px solid #dee2e6', fontSize: '12px', color: '#6c757d' }}>
                  {log.user_agent ? log.user_agent.substring(0, 50) + (log.user_agent.length > 50 ? '...' : '') : 'N/A'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {logs.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px', color: '#6c757d' }}>
          Žádné audit logy nebyly nalezeny
        </div>
      )}

      {/* Pagination would go here if needed */}
      <div style={{ marginTop: '20px', textAlign: 'center', color: '#6c757d' }}>
        Zobrazeno {logs.length} záznamů
      </div>
    </div>
  );
};

const UserForm = ({ user, onSave, onCancel, onChange, title }) => {
  const [formData, setFormData] = React.useState({
    username: user?.username || '',
    email: user?.email || '',
    password: '',
    confirmPassword: '',
    role: user?.role || 'user'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.username || !formData.email) {
      alert('Uživatelské jméno a email jsou povinné');
      return;
    }
    if (!user && !formData.password) {
      alert('Heslo je povinné pro nového uživatele');
      return;
    }
    if (formData.password && formData.password !== formData.confirmPassword) {
      alert('Hesla se neshodují');
      return;
    }

    const dataToSave = { ...formData };
    if (user && !formData.password) {
      delete dataToSave.password; // Don't update password if not provided
    }
    delete dataToSave.confirmPassword; // Remove confirmPassword from data to save

    if (onChange) {
      onChange({ ...user, ...dataToSave, newPassword: formData.password });
    } else {
      onSave(dataToSave);
    }
  };

  const handleChange = (field, value) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);
    if (onChange) {
      onChange({ ...user, ...newData, newPassword: newData.password });
    }
  };

  return (
    <div style={{ 
      backgroundColor: '#f8f9fa', 
      padding: '20px', 
      borderRadius: '8px', 
      marginBottom: '20px',
      border: '1px solid #dee2e6'
    }}>
      <h3>{title}</h3>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Uživatelské jméno *
          </label>
          <input
            type="text"
            value={formData.username}
            onChange={(e) => handleChange('username', e.target.value)}
            style={{ width: '100%', padding: '8px', border: '1px solid #ced4da', borderRadius: '4px' }}
            required
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Email *
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => handleChange('email', e.target.value)}
            style={{ width: '100%', padding: '8px', border: '1px solid #ced4da', borderRadius: '4px' }}
            required
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            {user ? 'Nové heslo (ponechte prázdné pro nezměnu)' : 'Heslo *'}
          </label>
          <input
            type="password"
            value={formData.password}
            onChange={(e) => handleChange('password', e.target.value)}
            style={{ width: '100%', padding: '8px', border: '1px solid #ced4da', borderRadius: '4px' }}
            required={!user}
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            {user ? 'Potvrzení nového hesla' : 'Potvrzení hesla *'}
          </label>
          <input
            type="password"
            value={formData.confirmPassword}
            onChange={(e) => handleChange('confirmPassword', e.target.value)}
            style={{ width: '100%', padding: '8px', border: '1px solid #ced4da', borderRadius: '4px' }}
            required={!user}
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Role
          </label>
          <select
            value={formData.role}
            onChange={(e) => handleChange('role', e.target.value)}
            style={{ width: '100%', padding: '8px', border: '1px solid #ced4da', borderRadius: '4px' }}
          >
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            type="submit"
            style={{ padding: '8px 16px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px' }}
          >
            {user ? 'Uložit změny' : 'Vytvořit uživatele'}
          </button>
          <button 
            type="button"
            onClick={onCancel}
            style={{ padding: '8px 16px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '4px' }}
          >
            Zrušit
          </button>
        </div>
      </form>
    </div>
  );
};

const Settings = () => {
  const { user, updateProfile } = useAuth();
  const [formData, setFormData] = React.useState({
    username: user?.username || '',
    email: user?.email || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
      alert('Nové heslo a potvrzení hesla se neshodují');
      return;
    }

    const updateData = {
      username: formData.username,
      email: formData.email
    };

    if (formData.newPassword) {
      updateData.currentPassword = formData.currentPassword;
      updateData.newPassword = formData.newPassword;
    }

    const result = await updateProfile(updateData);
    if (result.success) {
      alert('Profil byl úspěšně aktualizován');
      setFormData(prev => ({ ...prev, currentPassword: '', newPassword: '', confirmPassword: '' }));
    } else {
      alert('Chyba při aktualizaci profilu: ' + result.error);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px' }}>
      <h2>Nastavení profilu</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '20px' }}>
          <h3>Základní informace</h3>
          
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Uživatelské jméno
            </label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
              style={{ width: '100%', padding: '8px', border: '1px solid #ced4da', borderRadius: '4px' }}
              required
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              style={{ width: '100%', padding: '8px', border: '1px solid #ced4da', borderRadius: '4px' }}
              required
            />
          </div>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <h3>Změna hesla</h3>
          <p style={{ color: '#6c757d', fontSize: '14px', marginBottom: '15px' }}>
            Ponechte prázdné, pokud nechcete změnit heslo
          </p>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Současné heslo
            </label>
            <input
              type="password"
              value={formData.currentPassword}
              onChange={(e) => setFormData(prev => ({ ...prev, currentPassword: e.target.value }))}
              style={{ width: '100%', padding: '8px', border: '1px solid #ced4da', borderRadius: '4px' }}
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Nové heslo
            </label>
            <input
              type="password"
              value={formData.newPassword}
              onChange={(e) => setFormData(prev => ({ ...prev, newPassword: e.target.value }))}
              style={{ width: '100%', padding: '8px', border: '1px solid #ced4da', borderRadius: '4px' }}
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Potvrzení nového hesla
            </label>
            <input
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
              style={{ width: '100%', padding: '8px', border: '1px solid #ced4da', borderRadius: '4px' }}
            />
          </div>
        </div>

        <button 
          type="submit"
          style={{ padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px' }}
        >
          Uložit změny
        </button>
      </form>
    </div>
  );
};

// Layout component with navigation
const Layout = ({ children }) => {
  return (
    <div>
      <Navigation />
      {children}
      
    </div>
  );
};

// Protected Route component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div style={{ padding: '20px' }}>Načítání...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <Layout>
      {children}
    </Layout>
  );
};

// Admin-only Route component
const AdminRoute = ({ children }) => {
  const { user } = useAuth();

  if (user?.role !== 'admin') {
    return (
      <div style={{ padding: '20px' }}>
        <h3>Přístup odepřen</h3>
        <p>Tato stránka je dostupná pouze administrátorům.</p>
      </div>
    );
  }

  return children;
};

// Statistics Component
const Statistics = () => {
  const { user } = useAuth();
  const location = useLocation();
  const surveyId = location.pathname.split('/')[2]; // Get surveyId from URL
  const [statisticsData, setStatisticsData] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    if (surveyId) {
      fetchStatistics();
    }
  }, [surveyId]);

  const fetchStatistics = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/responses/statistics/${surveyId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setStatisticsData(data);
      } else {
        throw new Error('Chyba při načítání statistik');
      }
    } catch (error) {
      console.error('Error fetching statistics:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const renderEmojiStatistics = (statistics) => {
    const emojiLabels = ['Very Happy', 'Happy', 'Neutral', 'Sad', 'Very Sad'];
    const emojiIcons = ['😄', '😊', '😐', '😞', '😠'];
    
    return (
      <div style={{ marginBottom: '30px' }}>
        <h4 style={{ marginBottom: '15px' }}>Emoji hodnocení</h4>
        <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: '20px' }}>
          {emojiLabels.map((label, index) => {
            const count = statistics.distribution[label] || 0;
            const percentage = statistics.totalResponses > 0 ? ((count / statistics.totalResponses) * 100).toFixed(1) : 0;
            
            return (
              <div key={label} style={{ textAlign: 'center', minWidth: '80px' }}>
                <div style={{ fontSize: '24px', marginBottom: '8px' }}>{emojiIcons[index]}</div>
                <div style={{ fontWeight: 'bold', fontSize: '18px' }}>{count}</div>
                <div style={{ fontSize: '14px', color: '#666' }}>{percentage}%</div>
                <div style={{ fontSize: '12px', color: '#999' }}>{label}</div>
              </div>
            );
          })}
        </div>
        
        {/* Simple bar chart */}
        <div style={{ marginTop: '20px' }}>
          {emojiLabels.map((label, index) => {
            const count = statistics.distribution[label] || 0;
            const percentage = statistics.totalResponses > 0 ? (count / statistics.totalResponses) * 100 : 0;
            const colors = ['#4CAF50', '#8BC34A', '#FFC107', '#FF9800', '#F44336'];
            
            return (
              <div key={label} style={{ marginBottom: '8px' }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  fontSize: '14px',
                  marginBottom: '4px'
                }}>
                  <span style={{ minWidth: '100px' }}>{emojiIcons[index]} {label}</span>
                  <span style={{ marginLeft: '10px', fontWeight: 'bold' }}>{count} ({percentage.toFixed(1)}%)</span>
                </div>
                <div style={{ 
                  height: '8px', 
                  backgroundColor: '#f0f0f0', 
                  borderRadius: '4px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    height: '100%',
                    width: `${percentage}%`,
                    backgroundColor: colors[index],
                    transition: 'width 0.3s ease'
                  }}></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderTextStatistics = (statistics) => {
    return (
      <div style={{ marginBottom: '30px' }}>
        <h4 style={{ marginBottom: '15px' }}>Textové odpovědi</h4>
        <div style={{ 
          maxHeight: '300px', 
          overflowY: 'auto',
          border: '1px solid #ddd',
          borderRadius: '4px',
          padding: '15px'
        }}>
          {statistics.textResponses && statistics.textResponses.length > 0 ? (
            statistics.textResponses.map((response, index) => (
              <div key={index} style={{ 
                padding: '10px',
                borderBottom: index < statistics.textResponses.length - 1 ? '1px solid #eee' : 'none',
                fontSize: '14px'
              }}>
                "{response}"
              </div>
            ))
          ) : (
            <div style={{ color: '#999', fontStyle: 'italic' }}>Žádné textové odpovědi</div>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <div style={{ fontSize: '18px' }}>Načítání statistik...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <div style={{ color: 'red', fontSize: '18px', marginBottom: '20px' }}>
          Chyba: {error}
        </div>
        <button 
          onClick={fetchStatistics}
          style={{ 
            padding: '10px 20px', 
            backgroundColor: '#007bff', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px' 
          }}
        >
          Zkusit znovu
        </button>
      </div>
    );
  }

  if (!statisticsData) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <div style={{ fontSize: '18px', color: '#666' }}>Statistiky nenalezeny</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '30px' }}>
        <h1 style={{ marginBottom: '10px' }}>📊 Statistiky dotazníku</h1>
        <h2 style={{ color: '#666', fontWeight: 'normal', marginBottom: '10px' }}>
          {statisticsData.survey.title}
        </h2>
        <div style={{ 
          backgroundColor: '#e3f2fd', 
          padding: '15px', 
          borderRadius: '8px',
          border: '1px solid #2196f3'
        }}>
          <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#1976d2' }}>
            Celkem odpovědí: {statisticsData.responseCount}
          </div>
          {statisticsData.survey.description && (
            <div style={{ marginTop: '8px', color: '#666' }}>
              {statisticsData.survey.description}
            </div>
          )}
        </div>
      </div>

      {/* Statistics by Question */}
      <div style={{ marginBottom: '40px' }}>
        <h2 style={{ marginBottom: '20px' }}>Statistiky podle otázek</h2>
        
        {Object.keys(statisticsData.statistics).length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '40px', 
            backgroundColor: '#f8f9fa',
            borderRadius: '8px',
            color: '#666'
          }}>
            <div style={{ fontSize: '18px', marginBottom: '10px' }}>📊</div>
            <div>Zatím žádné odpovědi k analýze</div>
          </div>
        ) : (
          Object.entries(statisticsData.statistics).map(([stepId, statistics]) => (
            <div key={stepId} style={{ 
              backgroundColor: 'white',
              border: '1px solid #ddd',
              borderRadius: '8px',
              padding: '20px',
              marginBottom: '20px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
              <h3 style={{ 
                marginBottom: '15px', 
                color: '#333',
                borderBottom: '2px solid #f0f0f0',
                paddingBottom: '10px'
              }}>
                Otázka {stepId} ({statistics.type})
              </h3>
              
              {statistics.type === 'emoji-rating' && renderEmojiStatistics(statistics)}
              {statistics.type === 'text' && renderTextStatistics(statistics)}
            </div>
          ))
        )}
      </div>

      {/* Individual Responses Table */}
      <div style={{ marginBottom: '40px' }}>
        <h2 style={{ marginBottom: '20px' }}>Jednotlivé odpovědi</h2>
        
        {statisticsData.individualResponses.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '40px', 
            backgroundColor: '#f8f9fa',
            borderRadius: '8px',
            color: '#666'
          }}>
            Zatím žádné odpovědi
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8f9fa' }}>
                  <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #dee2e6' }}>
                    Čas odeslání
                  </th>
                  <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #dee2e6' }}>
                    IP adresa
                  </th>
                  {/* Dynamic columns for each question */}
                  {Object.keys(statisticsData.statistics).map(stepId => (
                    <th key={stepId} style={{ padding: '12px', textAlign: 'left', border: '1px solid #dee2e6' }}>
                      Otázka {stepId}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {statisticsData.individualResponses.map(response => (
                  <tr key={response.id} style={{ borderBottom: '1px solid #dee2e6' }}>
                    <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>
                      {new Date(response.submittedAt).toLocaleString('cs-CZ')}
                    </td>
                    <td style={{ padding: '12px', border: '1px solid #dee2e6', fontFamily: 'monospace' }}>
                      {response.ipAddress || 'N/A'}
                    </td>
                    {/* Dynamic cells for each question */}
                    {Object.keys(statisticsData.statistics).map(stepId => (
                      <td key={stepId} style={{ padding: '12px', border: '1px solid #dee2e6' }}>
                        {response.answers[stepId] ? (
                          <span title={`Typ: ${response.answers[stepId].type}`}>
                            {response.answers[stepId].value || 'Bez odpovědi'}
                          </span>
                        ) : (
                          <span style={{ color: '#999', fontStyle: 'italic' }}>Bez odpovědi</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div style={{ textAlign: 'center', marginTop: '40px' }}>
        <button 
          onClick={() => window.close()}
          style={{ 
            padding: '12px 24px', 
            backgroundColor: '#6c757d', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px',
            fontSize: '16px',
            marginRight: '10px'
          }}
        >
          Zavřít
        </button>
        <button 
          onClick={fetchStatistics}
          style={{ 
            padding: '12px 24px', 
            backgroundColor: '#28a745', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px',
            fontSize: '16px'
          }}
        >
          🔄 Aktualizovat
        </button>
      </div>
    </div>
  );
};

// Floating Feedback Widget - System Component (Uneditable)
// FloatingFeedbackWidget removed - floating icon now only shows in preview (Krok 0a)

function App() {
  return (
    <AuthProvider>
      <GlobalStyles />
      <Router>
        <div className="App">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/confirm-email" element={<EmailConfirmation />} />
            
            {/* Protected Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/survey-creator"
              element={
                <ProtectedRoute>
                  <SurveyCreator />
                </ProtectedRoute>
              }
            />
            <Route
              path="/survey-creator/edit/:surveyId"
              element={
                <ProtectedRoute>
                  <SurveyCreatorWithParams />
                </ProtectedRoute>
              }
            />
            <Route
              path="/surveys"
              element={
                <ProtectedRoute>
                  <SurveyList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/global-surveys"
              element={
                <ProtectedRoute>
                  <AdminRoute>
                    <GlobalSurveysCreator />
                  </AdminRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path="/tokens"
              element={
                <ProtectedRoute>
                  <TokenList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              }
            />
            
            {/* Admin-only Routes */}
            <Route
              path="/users"
              element={
                <ProtectedRoute>
                  <AdminRoute>
                    <UserList />
                  </AdminRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path="/logs"
              element={
                <ProtectedRoute>
                  <AdminRoute>
                    <AuditLogs />
                  </AdminRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path="/statistics/:surveyId"
              element={
                <ProtectedRoute>
                  <Statistics />
                </ProtectedRoute>
              }
            />
            
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App; 