
(function() {
  'use strict';
  
  // Domain validation
  const allowedDomains = ["tttttt"];
  if (allowedDomains && !allowedDomains.includes(window.location.hostname)) {
    console.warn('Survey widget not allowed on this domain');
    return;
  }

  // Check if widget is already loaded
  if (window.zpetnaVazbaWidget_to_6c752234300c448ebab6ab0753945915) {
    return;
  }
  window.zpetnaVazbaWidget_to_6c752234300c448ebab6ab0753945915 = true;

  // Survey configuration
  const surveyConfig = {"cards":[{"id":0,"title":"Floating Widget","description":"Floating feedback widget","isAdminOnly":false,"isEditable":false,"isSystem":true,"steps":[{"id":"floating-widget","type":"floating-widget","question":"Floating feedback widget","isSystem":true,"uneditable":true}]},{"id":1,"title":"Feedback Modal","description":"Feedback options","isAdminOnly":false,"isEditable":false,"isSystem":true,"steps":[{"id":"feedback-modal","type":"feedback-modal","question":"Feedback options","isSystem":true,"uneditable":true}]},{"id":2,"title":"Úvodní sekce","description":"Systémová úvodní část (pouze admin)","isAdminOnly":true,"isEditable":false,"steps":[]},{"id":3,"title":"Hlavní obsah","description":"Editovatelná část pro uživatele","isAdminOnly":false,"isEditable":true,"steps":[]},{"id":4,"title":"Závěrečná sekce","description":"Systémová závěrečná část (pouze admin)","isAdminOnly":true,"isEditable":false,"steps":[]}],"steps":[{"id":"floating-widget","type":"floating-widget","question":"Floating feedback widget","isSystem":true,"uneditable":true},{"id":"feedback-modal","type":"feedback-modal","question":"Feedback options","isSystem":true,"uneditable":true}]};
  const surveyId = 1;
  const tokenId = 'to_6c752234300c448ebab6ab0753945915';

  // Widget implementation will be injected here
  
  // Survey configuration
  const surveyCards = [{"id":0,"title":"Floating Widget","description":"Floating feedback widget","isAdminOnly":false,"isEditable":false,"isSystem":true,"steps":[{"id":"floating-widget","type":"floating-widget","question":"Floating feedback widget","isSystem":true,"uneditable":true}]},{"id":1,"title":"Feedback Modal","description":"Feedback options","isAdminOnly":false,"isEditable":false,"isSystem":true,"steps":[{"id":"feedback-modal","type":"feedback-modal","question":"Feedback options","isSystem":true,"uneditable":true}]},{"id":2,"title":"Úvodní sekce","description":"Systémová úvodní část (pouze admin)","isAdminOnly":true,"isEditable":false,"steps":[]},{"id":3,"title":"Hlavní obsah","description":"Editovatelná část pro uživatele","isAdminOnly":false,"isEditable":true,"steps":[]},{"id":4,"title":"Závěrečná sekce","description":"Systémová závěrečná část (pouze admin)","isAdminOnly":true,"isEditable":false,"steps":[]}];
  let currentCardIndex = 0;
  let surveyResponses = {};
  let userAnswers = {}; // Track user's answers for submission

  // Generate unique CSS prefix for this widget instance
  const uniquePrefix = 'zpv_to_6c752234300c448ebab6ab0753945915_' + Date.now() + '_';
  
  // Create widget container
  const widgetContainer = document.createElement('div');
  widgetContainer.id = uniquePrefix + 'container';
  widgetContainer.className = uniquePrefix + 'widget_container';
  
  // Initial state: show floating button (Step 0a)
  showFloatingWidget();

  document.body.appendChild(widgetContainer);

  function showFloatingWidget() {
    widgetContainer.innerHTML = `
      <div class="${uniquePrefix}floating_wrapper" style="position: fixed; bottom: 20px; right: 20px; z-index: 9999;">
        <div id="${uniquePrefix}floating_button" class="${uniquePrefix}floating_btn" style="
          width: 82px; 
          height: 82px; 
          background: white; 
          border-radius: 50%; 
          cursor: pointer; 
          display: flex; 
          align-items: center; 
          justify-content: center;
          box-shadow: 0 4px 12px rgba(0,0,0,0.2);
          transition: transform 0.2s;
          position: relative;
        ">
          <img src="/floating.svg" width="48" height="48" alt="Feedback" />
          <div id="${uniquePrefix}close_button" class="${uniquePrefix}close_btn" style="
            position: absolute;
            top: -15px;
            right: -35px;
            width: 39px;
            height: 39px;
            background: white;
            border-radius: 50%;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 2px 8px rgba(0,0,0,0.15);
          ">
            <img src="/close.svg" width="23" height="23" alt="Close" />
          </div>
        </div>
      </div>
    `;

    // Add event listeners
    const floatingButton = widgetContainer.querySelector('#' + uniquePrefix + 'floating_button');
    const closeButton = widgetContainer.querySelector('#' + uniquePrefix + 'close_button');
    
    floatingButton.addEventListener('click', (e) => {
      e.stopPropagation();
      showFeedbackModal();
    });
    
    closeButton.addEventListener('click', (e) => {
      e.stopPropagation();
      closeSurvey();
    });

    // Hover effects
    floatingButton.addEventListener('mouseenter', () => {
      floatingButton.style.transform = 'scale(1.05)';
    });
    floatingButton.addEventListener('mouseleave', () => {
      floatingButton.style.transform = 'scale(1)';
    });
  }

  function showFeedbackModal() {
    widgetContainer.innerHTML = `
      <div class="${uniquePrefix}modal_wrapper" style="
        position: fixed; 
        top: 50%; 
        left: 50%; 
        transform: translate(-50%, -50%); 
        width: 450px; 
        max-height: 603px; 
        background: white; 
        border-radius: 16px; 
        box-shadow: 0 20px 60px rgba(0,0,0,0.3); 
        z-index: 10000;
        overflow: hidden;
        font-family: 'Roboto', sans-serif;
      ">
        <!-- Header with title and close button -->
        <div class="${uniquePrefix}modal_header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; padding: 24px 40px 0 40px;">
          <h2 class="${uniquePrefix}modal_title" style="
            font-size: 24px; 
            font-weight: 500; 
            color: #262626; 
            margin: 0;
          ">Zpětná vazba</h2>
          <button id="${uniquePrefix}close_feedback_modal_btn" class="${uniquePrefix}close_modal_btn" style="
            background: none;
            border: none;
            font-size: 24px;
            color: #666;
            cursor: pointer;
            padding: 0;
            line-height: 1;
          ">×</button>
        </div>
        
        <!-- EXACT COPY from SurveyPreview renderFeedbackModal - 1:1 match -->
        <div class="${uniquePrefix}modal_content" style="margin-bottom: 20px; padding: 0 40px 40px 40px;">
          <div class="${uniquePrefix}content_wrapper" style="
            display: flex;
            flex-direction: column;
            gap: 24px;
            align-items: center;
          ">
            <!-- Subtitle -->
            <div style="
              font-family: Roboto;
              font-weight: 400;
              font-size: 18px;
              line-height: 150%;
              letter-spacing: 1.25%;
              color: #262626;
              text-align: left;
            ">
              Hodnocení, účel návštěvy, dojmy
            </div>

            <!-- Green Button 1 -->
            <button id="${uniquePrefix}start_survey_btn" class="${uniquePrefix}primary_btn" style="
              width: 241px;
              height: 56px;
              gap: 20px;
              padding-top: 12px;
              padding-right: 20px;
              padding-bottom: 13px;
              padding-left: 20px;
              border-radius: 8px;
              background-color: #609352;
              border: none;
              cursor: pointer;
              font-family: Roboto;
              font-weight: 700;
              font-size: 20px;
              line-height: 150%;
              letter-spacing: 3%;
              color: #FFFFFF;
            ">
              Zpětná vazba na web
            </button>

            <!-- Second Label -->
            <div style="
              font-family: Roboto;
              font-weight: 400;
              font-size: 18px;
              line-height: 150%;
              letter-spacing: 1.25%;
              color: #262626;
              text-align: left;
            ">
              Možnost připojit screenshot + komentář
            </div>

            <!-- Green Button 2 -->
            <button id="${uniquePrefix}screenshot_btn" class="${uniquePrefix}secondary_btn" style="
              width: 183px;
              height: 56px;
              gap: 20px;
              padding-top: 12px;
              padding-right: 20px;
              padding-bottom: 13px;
              padding-left: 20px;
              border-radius: 8px;
              background-color: #609352;
              border: none;
              cursor: pointer;
              font-family: Roboto;
              font-weight: 700;
              font-size: 20px;
              line-height: 150%;
              letter-spacing: 3%;
              color: #FFFFFF;
            ">
              Máte problém?
            </button>
          </div>
        </div>
      </div>
    `;

    // Add event listeners after DOM is updated
    const startSurveyBtn = widgetContainer.querySelector('#' + uniquePrefix + 'start_survey_btn');
    const screenshotBtn = widgetContainer.querySelector('#' + uniquePrefix + 'screenshot_btn');
    const closeFeedbackModalBtn = widgetContainer.querySelector('#' + uniquePrefix + 'close_feedback_modal_btn');
    
    startSurveyBtn.addEventListener('click', startSurvey);
    screenshotBtn.addEventListener('click', showScreenshotForm);
    closeFeedbackModalBtn.addEventListener('click', closeSurvey);
    
    // Click outside to close
    widgetContainer.addEventListener('click', (e) => {
      if (e.target === widgetContainer || e.target.closest('[style*="position: fixed"]') === null) {
        closeSurvey();
      }
    });
    
    // Add hover effects
    startSurveyBtn.addEventListener('mouseenter', () => {
      startSurveyBtn.style.background = '#5a8649';
    });
    startSurveyBtn.addEventListener('mouseleave', () => {
      startSurveyBtn.style.background = '#609352';
    });
    
    screenshotBtn.addEventListener('mouseenter', () => {
      screenshotBtn.style.background = '#5a8649';
    });
    screenshotBtn.addEventListener('mouseleave', () => {
      screenshotBtn.style.background = '#609352';
    });
  }

  function startSurvey() {
    currentCardIndex = 2; // Start from first user card (skip system cards 0a, 0b)
    showSurveyStep();
  }

  function showSurveyStep() {
    const card = surveyCards[currentCardIndex];
    if (!card) {
      showThankYou();
      return;
    }

    // Count non-system steps for progress
    const userCards = surveyCards.filter((c, i) => i >= 2);
    const currentUserStep = currentCardIndex - 1; // -2 for system cards, +1 for 1-based counting
    const totalUserSteps = userCards.length;

    widgetContainer.innerHTML = `
      <div class="${uniquePrefix}survey_modal" style="
        position: fixed; 
        top: 50%; 
        left: 50%; 
        transform: translate(-50%, -50%); 
        width: 450px; 
        max-height: 603px; 
        background: white; 
        border-radius: 16px; 
        box-shadow: 0 20px 60px rgba(0,0,0,0.3); 
        z-index: 10000;
        overflow-y: auto;
        font-family: 'Roboto', sans-serif;
      ">
        <div class="${uniquePrefix}survey_content" style="padding: 24px 40px 40px 40px;">
          <div class="${uniquePrefix}survey_header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px;">
            <h2 class="${uniquePrefix}survey_title" style="
              font-size: 24px; 
              font-weight: 500; 
              color: #262626; 
              margin: 0;
            ">${surveyCards[currentCardIndex].title || 'Krok'}</h2>
            <button id="${uniquePrefix}close_survey_header_btn" class="${uniquePrefix}close_survey_btn" style="
              background: none;
              border: none;
              font-size: 24px;
              color: #666;
              cursor: pointer;
              padding: 0;
              line-height: 1;
            ">×</button>
          </div>
          
                     <div id="${uniquePrefix}step_content" class="${uniquePrefix}step_content_wrapper">
             ${renderStepContent(surveyCards[currentCardIndex])}
           </div>

          <div class="${uniquePrefix}survey_footer" style="display: flex; justify-content: space-between; align-items: center; margin-top: 30px;">
            <span class="${uniquePrefix}progress_text" style="color: #666; font-size: 14px;">${currentUserStep} z ${totalUserSteps} kroků</span>
            <button id="${uniquePrefix}next_button" class="${uniquePrefix}next_btn" style="
              padding: 12px 24px;
              background: #609352;
              color: white;
              border: none;
              border-radius: 8px;
              font-size: 16px;
              font-weight: 500;
              cursor: pointer;
            ">
              Pokračovat
            </button>
          </div>
        </div>
      </div>
    `;

    // Add event listeners after DOM is updated
    const closeSurveyHeaderBtn = widgetContainer.querySelector('#' + uniquePrefix + 'close_survey_header_btn');
    const nextBtn = widgetContainer.querySelector('#' + uniquePrefix + 'next_button');
    
    closeSurveyHeaderBtn.addEventListener('click', closeSurvey);
    nextBtn.addEventListener('click', nextStep);
    
    // Click outside to close
    widgetContainer.addEventListener('click', (e) => {
      if (e.target === widgetContainer || e.target.closest('[style*="position: fixed"]') === null) {
        closeSurvey();
      }
    });
    
    // EXACT COPY of emoji functionality from SurveyPreview - 1:1 match
    const emojiContainers = widgetContainer.querySelectorAll('.' + uniquePrefix + 'emoji_container');
    emojiContainers.forEach(container => {
      const index = parseInt(container.getAttribute('data-value'));
      const stepKey = container.getAttribute('data-step-key');
      
      container.addEventListener('click', () => {
        // Store the selected rating
        if (!window.previewAnswers) window.previewAnswers = {};
        window.previewAnswers[stepKey] = index;
        
        // Reset all emoji containers in this step
        const stepContainers = widgetContainer.querySelectorAll(`[data-step-key="${stepKey}"]`);
        stepContainers.forEach(c => {
          c.style.opacity = '0.7';
          c.style.transform = 'scale(1)';
          const img = c.querySelector('img');
          if (img) {
            const iconName = img.src.split('/').pop().replace('.svg', '');
            img.src = `/icons/defaultState/${iconName}.svg`;
          }
        });
        
        // Set selected state - EXACTLY like preview
        container.style.opacity = '1';
        container.style.transform = 'scale(1.1)';
        const img = container.querySelector('img');
        if (img) {
          const iconName = img.src.split('/').pop().replace('.svg', '');
          img.src = `/icons/activeState/${iconName}.svg`;
        }
      });
      
      // EXACT hover effects from preview
      container.addEventListener('mouseenter', () => {
        const isSelected = window.previewAnswers && window.previewAnswers[stepKey] === index;
        if (!isSelected) {
          container.style.opacity = '0.9';
        }
      });
      
      container.addEventListener('mouseleave', () => {
        const isSelected = window.previewAnswers && window.previewAnswers[stepKey] === index;
        if (!isSelected) {
          container.style.opacity = '0.7';
        }
      });
    });
    
    // Add hover effects for choice options
    const choiceOptions = widgetContainer.querySelectorAll('.' + uniquePrefix + 'choice_option');
    choiceOptions.forEach(option => {
      option.addEventListener('mouseenter', () => {
        option.style.background = '#f8f9fa';
      });
      option.addEventListener('mouseleave', () => {
        option.style.background = 'white';
      });
    });
  }

  function renderStepContent(card) {
    if (!card.steps || card.steps.length === 0) {
      return '<p>Žádný obsah</p>';
    }

    return card.steps.map(step => {
      switch (step.type) {
        case 'smiley':
        case 'emoji-rating':
          return renderEmojiRating(step);
        case 'single-choice':
          return renderSingleChoice(step);
        case 'multi-select':
          return renderMultiSelect(step);
        case 'dropdown-multi-select':
          return renderDropdownMultiSelect(step);
        case 'text-field':
          return renderTextField(step);
        case 'section-header':
          return renderSectionHeader(step);
        default:
          return `<p>Neznámý typ kroku: ${step.type}</p>`;
      }
    }).join('');
  }

  function renderEmojiRating(step) {
    // EXACT COPY from SurveyPreview - 1:1 match
    const smileyIcons = ['emoji-laughing', 'emoji-smile', 'emoji-neutral', 'emoji-frown', 'emoji-angry'];
    const stepKey = `step-${step.id || Math.random()}`;
    
    return `
      <div class="${uniquePrefix}emoji_rating_wrapper" style="margin-bottom: 24px;">
        <h3 class="${uniquePrefix}emoji_question" style="font-size: 18px; margin-bottom: 16px; color: #262626; text-align: center;">${step.question || 'Jak hodnotíte naši službu?'}</h3>
        <div class="${uniquePrefix}emoji_content" style="text-align: center; margin-bottom: 20px;">
          <div class="${uniquePrefix}emoji_row" style="display: flex; justify-content: space-around; margin-bottom: 20px;">
            ${smileyIcons.map((iconName, index) => `
              <div 
                class="${uniquePrefix}emoji_container" 
                data-value="${index}" 
                data-step-key="${stepKey}"
                style="
                  text-align: center; 
                  cursor: pointer;
                  opacity: 0.7;
                  transform: scale(1);
                  transition: all 0.2s ease;
                "
              >
                <div class="${uniquePrefix}emoji_icon_wrapper">
                  <img 
                    class="${uniquePrefix}emoji_icon"
                    src="/icons/defaultState/${iconName}.svg" 
                    width="34" 
                    height="34" 
                    alt="Rating ${index + 1}"
                    style="pointer-events: none;"
                  />
                </div>
              </div>
            `).join('')}
          </div>
          
          ${step.hasTextbox ? `
            <div class="${uniquePrefix}textbox_wrapper" style="margin-top: 16px;">
              <div class="${uniquePrefix}textbox_container" style="
                width: 372px;
                min-height: 48px;
                padding: 12px 16px;
                gap: 8px;
                border-radius: 4px;
                border: 1px solid #4F4F4F;
                background-color: white;
                margin: 0 auto;
              ">
                <input
                  class="${uniquePrefix}textbox_input"
                  type="text"
                  placeholder="${step.textboxPlaceholder || 'Prosím, okomentujte vaše hodnocení'}"
                  style="
                    width: 100%;
                    border: none;
                    outline: none;
                    font-family: Roboto;
                    font-weight: 400;
                    font-size: 16px;
                    line-height: 150%;
                    letter-spacing: 1.25%;
                    color: #262626;
                    background-color: transparent;
                  "
                />
              </div>
              <div style="
                margin-top: 8px;
                font-family: Roboto;
                font-weight: 400;
                font-size: 14px;
                line-height: 150%;
                letter-spacing: 1.25%;
                color: #6c757d;
                font-style: italic;
                text-align: left;
                width: 372px;
                margin: 8px auto 0;
              ">
                Nepovinné pole
              </div>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }

  function renderSingleChoice(step) {
    return `
      <div class="${uniquePrefix}single_choice_wrapper" style="margin-bottom: 24px;">
        <h3 class="${uniquePrefix}choice_question" style="font-size: 18px; margin-bottom: 16px; color: #262626;">${step.question || 'Vyberte možnost'}</h3>
        ${(step.options || []).map((option, index) => `
          <label class="${uniquePrefix}choice_option" style="
            display: block;
            margin-bottom: 12px;
            cursor: pointer;
            padding: 12px;
            border: 1px solid #ddd;
            border-radius: 8px;
            transition: background 0.2s;
          ">
            <input class="${uniquePrefix}radio_input" type="radio" name="${uniquePrefix}single_choice" value="${option}" style="margin-right: 8px;" />
            ${option}
          </label>
        `).join('')}
      </div>
    `;
  }

  function renderMultiSelect(step) {
    return `
      <div class="${uniquePrefix}multi_select_wrapper" style="margin-bottom: 24px;">
        <h3 class="${uniquePrefix}choice_question" style="font-size: 18px; margin-bottom: 16px; color: #262626;">${step.question || 'Vyberte možnosti'}</h3>
        ${(step.options || []).map((option, index) => `
          <label class="${uniquePrefix}choice_option" style="
            display: block;
            margin-bottom: 12px;
            cursor: pointer;
            padding: 12px;
            border: 1px solid #ddd;
            border-radius: 8px;
            transition: background 0.2s;
          ">
            <input class="${uniquePrefix}checkbox_input" type="checkbox" name="${uniquePrefix}multi_select" value="${option}" style="margin-right: 8px;" />
            ${option}
          </label>
        `).join('')}
      </div>
    `;
  }

  function renderDropdownMultiSelect(step) {
    return `
      <div style="margin-bottom: 24px;">
        <h3 style="font-size: 18px; margin-bottom: 16px; color: #262626;">${step.question || 'Vyberte z rozbalovacího menu'}</h3>
        <select multiple style="
          width: 100%;
          min-height: 120px;
          padding: 12px;
          border: 1px solid #ddd;
          border-radius: 8px;
          font-family: inherit;
          font-size: 14px;
        ">
          ${(step.options || []).map(option => `
            <option value="${option}">${option}</option>
          `).join('')}
        </select>
      </div>
    `;
  }

  function renderTextField(step) {
    return `
      <div class="${uniquePrefix}text_field_wrapper" style="margin-bottom: 24px;">
        <h3 class="${uniquePrefix}text_field_question" style="font-size: 18px; margin-bottom: 16px; color: #262626;">${step.question || 'Textové pole'}</h3>
        <textarea class="${uniquePrefix}text_field_input" placeholder="${step.placeholder || 'Napište svou odpověď...'}" style="
          width: 100%;
          min-height: 120px;
          padding: 12px;
          border: 1px solid #ddd;
          border-radius: 8px;
          font-family: inherit;
          font-size: 14px;
          resize: vertical;
        "></textarea>
      </div>
    `;
  }

  function renderSectionHeader(step) {
    return `
      <div class="${uniquePrefix}section_header_wrapper" style="margin-bottom: 24px;">
        <h2 class="${uniquePrefix}section_header_title" style="font-size: 24px; font-weight: 600; color: #262626; margin: 0;">${step.title || 'Nadpis sekce'}</h2>
        ${step.description ? `<p class="${uniquePrefix}section_header_description" style="color: #666; margin-top: 8px;">${step.description}</p>` : ''}
      </div>
    `;
  }

  function selectEmoji(value) {
    // Handle emoji selection
    const buttons = document.querySelectorAll('[data-value]');
    buttons.forEach(btn => btn.style.background = 'none');
    document.querySelector(`[data-value="${value}"]`).style.background = '#e3f2fd';
  }

  function nextStep() {
    currentCardIndex++;
    showSurveyStep();
  }

  function goToNextCard() {
    // Find next non-system card
    do {
      currentCardIndex++;
    } while (currentCardIndex < surveyCards.length && surveyCards[currentCardIndex].isSystem);
    
    if (currentCardIndex >= surveyCards.length) {
      showThankYou();
    } else {
      showSurveyStep();
    }
  }

  function showScreenshotForm() {
    widgetContainer.innerHTML = `
      <div class="${uniquePrefix}screenshot_modal" style="
        position: fixed; 
        top: 50%; 
        left: 50%; 
        transform: translate(-50%, -50%); 
        width: 450px; 
        max-height: 603px; 
        background: white; 
        border-radius: 16px; 
        box-shadow: 0 20px 60px rgba(0,0,0,0.3); 
        z-index: 10000;
        overflow-y: auto;
        font-family: 'Roboto', sans-serif;
      ">
        <!-- Header with title and close button -->
        <div class="${uniquePrefix}screenshot_header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; padding: 24px 40px 0 40px;">
          <h2 class="${uniquePrefix}screenshot_title" style="
            font-size: 24px; 
            font-weight: 500; 
            color: #262626; 
            margin: 0;
          ">Přiložit snímek obrazovky</h2>
          <button id="${uniquePrefix}close_screenshot_btn" class="${uniquePrefix}close_screenshot_btn" style="
            background: none;
            border: none;
            font-size: 24px;
            color: #666;
            cursor: pointer;
            padding: 0;
            line-height: 1;
          ">×</button>
        </div>

        <!-- Content -->
        <div style="padding: 0 40px 40px 40px; display: flex; flex-direction: column; gap: 24px; align-items: center;">
          <!-- Question -->
          <div style="
            font-family: Roboto;
            font-weight: 400;
            font-size: 18px;
            line-height: 150%;
            letter-spacing: 1.25%;
            color: #262626;
            text-align: center;
          ">Chcete přiložit screenshot?</div>

          <!-- Upload Area -->
          <div class="${uniquePrefix}upload_area" style="
            width: 372px;
            min-height: 120px;
            border: 2px dashed #609352;
            border-radius: 8px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 16px;
            padding: 24px;
            cursor: pointer;
            transition: background-color 0.2s;
          " id="${uniquePrefix}upload_area">
            <!-- Upload Icon -->
            <svg width="48" height="48" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M0.625 12.375C0.970178 12.375 1.25 12.6549 1.25 13V16.125C1.25 16.8154 1.80964 17.375 2.5 17.375H17.5C18.1904 17.375 18.75 16.8154 18.75 16.125V13C18.75 12.6549 19.0298 12.375 19.375 12.375C19.7202 12.375 20 12.6549 20 13V16.125C20 17.5057 18.8807 18.625 17.5 18.625H2.5C1.11929 18.625 0 17.5057 0 16.125V13C0 12.6549 0.279822 12.375 0.625 12.375Z" fill="#609352"/>
              <path d="M9.55806 1.43306C9.80214 1.18898 10.1979 1.18898 10.4419 1.43306L14.1919 5.18306C14.436 5.42714 14.436 5.82286 14.1919 6.06694C13.9479 6.31102 13.5521 6.31102 13.3081 6.06694L10.625 3.38388V14.375C10.625 14.7202 10.3452 15 10 15C9.65482 15 9.375 14.7202 9.375 14.375V3.38388L6.69194 6.06694C6.44786 6.31102 6.05214 6.31102 5.80806 6.06694C5.56398 5.82286 5.56398 5.42714 5.80806 5.18306L9.55806 1.43306Z" fill="#609352"/>
            </svg>
            
            <div style="text-align: center;">
              <div style="
                font-family: Roboto;
                font-weight: 700;
                font-size: 16px;
                line-height: 150%;
                letter-spacing: 1.25%;
                color: #609352;
                margin-bottom: 8px;
              ">Nahrajte soubor nebo přetáhněte sem</div>
              
              <div style="
                font-family: Roboto;
                font-weight: 400;
                font-size: 14px;
                line-height: 150%;
                letter-spacing: 1.25%;
                color: #666;
              ">Podporované formáty: JPEG, PNG, PDF</div>
            </div>
            
            <input type="file" id="${uniquePrefix}file_input" class="${uniquePrefix}file_input" accept=".jpg,.jpeg,.png,.pdf" style="display: none;" />
          </div>

          <!-- Problem description label -->
          <div style="
            font-family: Roboto;
            font-weight: 400;
            font-size: 18px;
            line-height: 150%;
            letter-spacing: 1.25%;
            color: #262626;
            text-align: center;
            margin-top: 16px;
          ">Popište problém nebo potíže</div>

          <!-- Text area -->
          <textarea class="${uniquePrefix}textarea_input" placeholder="Prosím, uvěďte" style="
            width: 372px;
            min-height: 120px;
            padding: 12px 16px;
            border-radius: 4px;
            border: 1px solid #4F4F4F;
            font-family: Roboto;
            font-weight: 400;
            font-size: 16px;
            line-height: 150%;
            letter-spacing: 1.25%;
            color: #262626;
            background-color: #FFFFFF;
            resize: vertical;
            outline: none;
          "></textarea>

          <!-- Buttons -->
          <div style="
            display: flex;
            justify-content: space-between;
            align-items: center;
            width: 372px;
            margin-top: 24px;
          ">
            <!-- Back Button -->
            <button id="${uniquePrefix}back_btn" class="${uniquePrefix}back_button" style="
              width: 83px;
              height: 56px;
              gap: 20px;
              padding: 12px 20px 13px 20px;
              border-radius: 8px;
              border: 1px solid #609352;
              background-color: transparent;
              cursor: pointer;
              font-family: Roboto;
              font-weight: 700;
              font-size: 20px;
              line-height: 150%;
              letter-spacing: 3%;
              color:'var(--color-green)';
            ">Zpět</button>

            <!-- Submit Button -->
            <button id="${uniquePrefix}submit_btn" class="${uniquePrefix}submit_button" style="
              width: 113px;
              height: 56px;
              gap: 20px;
              padding: 12px 20px 13px 20px;
              border-radius: 8px;
              background-color: #609352;
              border: none;
              cursor: pointer;
              font-family: Roboto;
              font-weight: 700;
              font-size: 20px;
              line-height: 150%;
              letter-spacing: 3%;
              color: #FFFFFF;
            ">Odeslat</button>
          </div>
        </div>
      </div>
    `;

    // Add event listeners after DOM is updated
    const closeBtn = widgetContainer.querySelector('#' + uniquePrefix + 'close_screenshot_btn');
    const backBtn = widgetContainer.querySelector('#' + uniquePrefix + 'back_btn');
    const submitBtn = widgetContainer.querySelector('#' + uniquePrefix + 'submit_btn');
    const uploadArea = widgetContainer.querySelector('#' + uniquePrefix + 'upload_area');
    const fileInput = widgetContainer.querySelector('#' + uniquePrefix + 'file_input');
    
    closeBtn.addEventListener('click', closeSurvey);
    backBtn.addEventListener('click', showFeedbackModal);
    submitBtn.addEventListener('click', showScreenshotSuccess);
    
    // File upload functionality
    uploadArea.addEventListener('click', () => {
      fileInput.click();
    });
    
    uploadArea.addEventListener('dragover', (e) => {
      e.preventDefault();
      uploadArea.style.backgroundColor = '#f8f9fa';
    });
    
    uploadArea.addEventListener('dragleave', (e) => {
      e.preventDefault();
      uploadArea.style.backgroundColor = 'transparent';
    });
    
    uploadArea.addEventListener('drop', (e) => {
      e.preventDefault();
      uploadArea.style.backgroundColor = 'transparent';
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        handleFileUpload(files[0]);
      }
    });
    
    fileInput.addEventListener('change', (e) => {
      if (e.target.files.length > 0) {
        handleFileUpload(e.target.files[0]);
      }
    });
    
    function handleFileUpload(file) {
      // Update upload area to show selected file
      const uploadArea = widgetContainer.querySelector('#' + uniquePrefix + 'upload_area');
      uploadArea.innerHTML = `
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2Z" fill="#609352"/>
          <path d="M14 2V8H20" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <div style="text-align: center;">
          <div style="
            font-family: Roboto;
            font-weight: 700;
            font-size: 16px;
            line-height: 150%;
            letter-spacing: 1.25%;
            color: #609352;
            margin-bottom: 8px;
          ">${file.name}</div>
          <div style="
            font-family: Roboto;
            font-weight: 400;
            font-size: 14px;
            line-height: 150%;
            letter-spacing: 1.25%;
            color: #666;
          ">Soubor vybrán</div>
        </div>
      `;
    }
    
    // Click outside to close
    widgetContainer.addEventListener('click', (e) => {
      if (e.target === widgetContainer || e.target.closest('[style*="position: fixed"]') === null) {
        closeSurvey();
      }
    });
  }

  function showThankYou() {
    // Submit survey responses
    submitSurveyResponses();

    widgetContainer.innerHTML = `
      <div class="${uniquePrefix}thank_you_modal" style="
        position: fixed; 
        top: 50%; 
        left: 50%; 
        transform: translate(-50%, -50%); 
        width: 450px; 
        background: white; 
        border-radius: 16px; 
        box-shadow: 0 20px 60px rgba(0,0,0,0.3); 
        z-index: 10000;
        text-align: center;
        padding: 40px;
        font-family: 'Roboto', sans-serif;
      ">
        <h2 class="${uniquePrefix}success_title" style="color: 'var(--color-green)'; margin-bottom: 16px;">✓ Zpětná vazba odeslána</h2>
        <p class="${uniquePrefix}success_message" style="color: #666; margin-bottom: 24px;">Děkujeme za vaši zpětnou vazbu!</p>
        <button id="${uniquePrefix}close_survey_btn" class="${uniquePrefix}close_final_btn" style="
          padding: 12px 24px;
          background: #609352;
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
        ">Zavřít</button>
      </div>
    `;

    // Add event listener after DOM is updated
    const closeSurveyBtn = widgetContainer.querySelector('#' + uniquePrefix + 'close_survey_btn');
    closeSurveyBtn.addEventListener('click', closeSurvey);
  }

  function showScreenshotSuccess() {
    widgetContainer.innerHTML = `
      <div class="${uniquePrefix}screenshot_success_modal" style="
        position: fixed; 
        top: 50%; 
        left: 50%; 
        transform: translate(-50%, -50%); 
        width: 450px; 
        height: 603px; 
        background: white; 
        border-radius: 16px; 
        box-shadow: 0 20px 60px rgba(0,0,0,0.3); 
        z-index: 10000;
        text-align: center;
        padding: 40px;
        font-family: 'Roboto', sans-serif;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
      ">
        <h2 class="${uniquePrefix}success_heading" style="
          margin: 0;
          font-family: Roboto;
          font-weight: 400;
          font-size: 24px;
          line-height: 150%;
          letter-spacing: 3.12%;
          color: #262626;
        ">Odesláno</h2>
      </div>
    `;
  }

  function submitSurveyResponses() {
    // Collect all answers from the preview answers
    const responses = {};
    
    // Get answers from window.previewAnswers (emoji ratings and other inputs)
    if (window.previewAnswers) {
      Object.entries(window.previewAnswers).forEach(([stepKey, value]) => {
        responses[stepKey] = value;
      });
    }
    
    // Get text input values
    const textInputs = widgetContainer.querySelectorAll('input[type="text"], textarea');
    textInputs.forEach(input => {
      if (input.value.trim()) {
        const stepId = input.closest('[data-step-id]')?.getAttribute('data-step-id') || `input-${Date.now()}`;
        responses[stepId] = input.value.trim();
      }
    });
    
    // Get radio button selections
    const radioInputs = widgetContainer.querySelectorAll('input[type="radio"]:checked');
    radioInputs.forEach(input => {
      const stepId = input.closest('[data-step-id]')?.getAttribute('data-step-id') || `radio-${Date.now()}`;
      responses[stepId] = input.value;
    });
    
    // Get checkbox selections
    const checkboxes = widgetContainer.querySelectorAll('input[type="checkbox"]:checked');
    const checkboxGroups = {};
    checkboxes.forEach(checkbox => {
      const stepId = checkbox.closest('[data-step-id]')?.getAttribute('data-step-id') || `checkbox-${Date.now()}`;
      if (!checkboxGroups[stepId]) {
        checkboxGroups[stepId] = [];
      }
      checkboxGroups[stepId].push(checkbox.value);
    });
    
    // Add checkbox groups to responses
    Object.entries(checkboxGroups).forEach(([stepId, values]) => {
      responses[stepId] = values;
    });
    
    // Submit to backend
    fetch('/api/responses/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        surveyId: surveyId,
        tokenId: tokenId,
        responses: responses,
        formType: 'survey'
      })
    })
    .then(response => response.json())
    .then(data => {
      console.log('Survey response submitted successfully:', data);
    })
    .catch(error => {
      console.error('Error submitting survey response:', error);
    });
  }

  function closeSurvey() {
    widgetContainer.remove();
  }

  // Make functions globally available
  window.startSurvey = startSurvey;
  window.nextStep = nextStep;
  window.selectEmoji = selectEmoji;
  window.showScreenshotForm = showScreenshotForm;
  window.showScreenshotSuccess = showScreenshotSuccess;
  window.closeSurvey = closeSurvey;
  
})();