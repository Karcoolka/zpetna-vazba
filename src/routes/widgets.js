const express = require('express');
const { body, validationResult, param } = require('express-validator');
const path = require('path');
const { getDatabase } = require('../database/init');
const { optionalAuth } = require('../middleware/auth');
const { asyncHandler, createError } = require('../middleware/errorHandler');
const { logManualAuditEvent } = require('../middleware/audit');

const router = express.Router();

// Serve widget survey page
router.get('/:tokenId/survey', [
  param('tokenId').matches(/^to_[a-f0-9]{32}$/).withMessage('Invalid token format')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createError(400, 'Validation failed', errors.array());
  }

  const { tokenId } = req.params;
  const db = getDatabase();

  // Get token and survey info
  const tokenInfo = await new Promise((resolve, reject) => {
    db.get(`
      SELECT st.*, s.title, s.config, s.status as survey_status
      FROM survey_tokens st
      JOIN surveys s ON st.survey_id = s.id
      WHERE st.token_id = ? AND st.status = 'active'
    `, [tokenId], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });

  if (!tokenInfo) {
    return res.status(404).send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Survey Not Found</title>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
            .error { color: var(--color-red); }
          </style>
        </head>
        <body>
          <h1 class="error">Survey Not Found</h1>
          <p>The requested survey is not available or has been deactivated.</p>
        </body>
      </html>
    `);
  }

  // Check validity period
  const now = new Date();
  if (tokenInfo.valid_from && new Date(tokenInfo.valid_from) > now) {
    return res.status(403).send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Survey Not Available</title>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
            .warning { color: var(--color-yellow); }
          </style>
        </head>
        <body>
          <h1 class="warning">Survey Not Available Yet</h1>
          <p>This survey will be available from ${new Date(tokenInfo.valid_from).toLocaleString()}.</p>
        </body>
      </html>
    `);
  }

  if (tokenInfo.valid_until && new Date(tokenInfo.valid_until) < now) {
    return res.status(403).send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Survey Expired</title>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
            .warning { color: var(--color-yellow); }
          </style>
        </head>
        <body>
          <h1 class="warning">Survey Expired</h1>
          <p>This survey expired on ${new Date(tokenInfo.valid_until).toLocaleString()}.</p>
        </body>
      </html>
    `);
  }

  const config = JSON.parse(tokenInfo.config);
  
  // Generate survey HTML
  const surveyHtml = generateSurveyHtml(tokenInfo.title, config, tokenId);
  res.send(surveyHtml);
}));

// Submit survey response
router.post('/:tokenId/response', [
  param('tokenId').matches(/^to_[a-f0-9]{32}$/).withMessage('Invalid token format'),
  body('responses').isArray().withMessage('Responses must be an array'),
  body('step').optional().isInt().withMessage('Step must be an integer')
], optionalAuth, asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createError(400, 'Validation failed', errors.array());
  }

  const { tokenId } = req.params;
  const { responses, step = null } = req.body;
  const db = getDatabase();

  // Get token and survey info
  const tokenInfo = await new Promise((resolve, reject) => {
    db.get(`
      SELECT st.*, s.id as survey_id, s.status as survey_status
      FROM survey_tokens st
      JOIN surveys s ON st.survey_id = s.id
      WHERE st.token_id = ? AND st.status = 'active'
    `, [tokenId], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });

  if (!tokenInfo) {
    throw createError(404, 'Survey token not found or inactive');
  }

  // Check validity period
  const now = new Date();
  if (tokenInfo.valid_from && new Date(tokenInfo.valid_from) > now) {
    throw createError(403, 'Survey not available yet');
  }

  if (tokenInfo.valid_until && new Date(tokenInfo.valid_until) < now) {
    throw createError(403, 'Survey has expired');
  }

  // Store response
  const responseData = {
    responses,
    step,
    timestamp: new Date().toISOString(),
    user_agent: req.get('User-Agent'),
    referer: req.get('Referer')
  };

  const result = await new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO survey_responses (survey_id, token_id, response_data, ip_address, user_agent)
       VALUES (?, ?, ?, ?, ?)`,
      [
        tokenInfo.survey_id,
        tokenId,
        JSON.stringify(responseData),
        req.ip || req.connection.remoteAddress,
        req.get('User-Agent')
      ],
      function(err) {
        if (err) reject(err);
        else resolve(this);
      }
    );
  });

  // Log survey delivery/response
  logManualAuditEvent(
    null, // Anonymous response
    'SURVEY_RESPONSE',
    'SURVEY',
    tokenInfo.survey_id.toString(),
    { 
      token_id: tokenId,
      response_id: result.lastID,
      step: step 
    },
    req.ip,
    req.get('User-Agent')
  );

  res.json({
    success: true,
    message: 'Response recorded successfully',
    response_id: result.lastID
  });
}));

// Get survey configuration for widget (public access)
router.get('/:tokenId/config', [
  param('tokenId').matches(/^to_[a-f0-9]{32}$/).withMessage('Invalid token format')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createError(400, 'Validation failed', errors.array());
  }

  const { tokenId } = req.params;
  const db = getDatabase();

  // Get token and survey info
  const tokenInfo = await new Promise((resolve, reject) => {
    db.get(`
      SELECT st.*, s.title, s.config, s.status as survey_status
      FROM survey_tokens st
      JOIN surveys s ON st.survey_id = s.id
      WHERE st.token_id = ? AND st.status = 'active'
    `, [tokenId], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });

  if (!tokenInfo) {
    throw createError(404, 'Survey token not found or inactive');
  }

  // Check validity period
  const now = new Date();
  if (tokenInfo.valid_from && new Date(tokenInfo.valid_from) > now) {
    throw createError(403, 'Survey not available yet');
  }

  if (tokenInfo.valid_until && new Date(tokenInfo.valid_until) < now) {
    throw createError(403, 'Survey has expired');
  }

  res.json({
    title: tokenInfo.title,
    config: JSON.parse(tokenInfo.config),
    token_id: tokenId
  });
}));

// Helper function to generate survey HTML
const generateSurveyHtml = (title, config, tokenId) => {
  return `
<!DOCTYPE html>
<html lang="cs">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        
        .survey-container {
            background: white;
            border-radius: 12px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            max-width: 600px;
            width: 100%;
            overflow: hidden;
        }
        
        .survey-header {
            background: #667eea;
            color: white;
            padding: 30px;
            text-align: center;
            position: relative;
        }
        
        .close-btn {
            position: absolute;
            top: 15px;
            right: 15px;
            background: rgba(255,255,255,0.2);
            border: none;
            color: white;
            width: 30px;
            height: 30px;
            border-radius: 50%;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: background 0.2s;
        }
        
        .close-btn:hover {
            background: rgba(255,255,255,0.3);
        }
        
        .survey-content {
            padding: 40px;
        }
        
        .step {
            display: none;
        }
        
        .step.active {
            display: block;
        }
        
        .rating-container {
            display: flex;
            justify-content: space-between;
            margin: 30px 0;
            gap: 10px;
        }
        
        .rating-item {
            flex: 1;
            text-align: center;
            cursor: pointer;
            padding: 15px 10px;
            border-radius: 8px;
            transition: all 0.2s;
            border: 2px solid #e9ecef;
        }
        
        .rating-item:hover {
            background: #f8f9fa;
            border-color: #667eea;
        }
        
        .rating-item.selected {
            background: #667eea;
            color: white;
            border-color: #667eea;
        }
        
        .rating-emoji {
            font-size: 32px;
            margin-bottom: 8px;
            display: block;
        }
        
        .form-group {
            margin: 20px 0;
        }
        
        .form-label {
            display: block;
            margin-bottom: 8px;
            font-weight: 600;
            color: #343a40;
        }
        
        .form-input {
            width: 100%;
            padding: 12px;
            border: 2px solid #e9ecef;
            border-radius: 6px;
            font-size: 16px;
            transition: border-color 0.2s;
        }
        
        .form-input:focus {
            outline: none;
            border-color: #667eea;
        }
        
        .btn {
            background: #667eea;
            color: white;
            border: none;
            padding: 12px 30px;
            border-radius: 6px;
            font-size: 16px;
            cursor: pointer;
            transition: background 0.2s;
        }
        
        .btn:hover {
            background: #5a67d8;
        }
        
        .btn-secondary {
            background: #6c757d;
            margin-right: 10px;
        }
        
        .btn-secondary:hover {
            background: #5a6268;
        }
        
        .step-indicator {
            display: flex;
            justify-content: center;
            margin-bottom: 30px;
        }
        
        .step-dot {
            width: 12px;
            height: 12px;
            border-radius: 50%;
            background: #e9ecef;
            margin: 0 5px;
            transition: background 0.2s;
        }
        
        .step-dot.active {
            background: #667eea;
        }
        
        .thank-you {
            text-align: center;
            padding: 40px 20px;
        }
        
        .thank-you h2 {
            color:'var(--color-green)';
            margin-bottom: 20px;
        }
    </style>
</head>
<body>
    <div class="survey-container">
        <div class="survey-header">
            <button class="close-btn" onclick="window.close()">×</button>
            <h1>${title}</h1>
        </div>
        <div class="survey-content">
            <div class="step-indicator">
                <div class="step-dot active"></div>
                <div class="step-dot"></div>
                <div class="step-dot"></div>
            </div>
            
            <!-- Step 1: Rating -->
            <div class="step active" id="step-1">
                <h3>Jak hodnotíte naše služby?</h3>
                <div class="rating-container">
                    <div class="rating-item" data-value="1">
                        <span class="rating-emoji">😡</span>
                        <div>Nejhorší</div>
                    </div>
                    <div class="rating-item" data-value="2">
                        <span class="rating-emoji">😕</span>
                        <div>Špatné</div>
                    </div>
                    <div class="rating-item" data-value="3">
                        <span class="rating-emoji">😐</span>
                        <div>OK</div>
                    </div>
                    <div class="rating-item" data-value="4">
                        <span class="rating-emoji">😊</span>
                        <div>Dobré</div>
                    </div>
                    <div class="rating-item" data-value="5">
                        <span class="rating-emoji">😍</span>
                        <div>Nejlepší</div>
                    </div>
                </div>
                <button class="btn" onclick="nextStep()" id="next-btn-1" disabled>Další</button>
            </div>
            
            <!-- Step 2: Feedback -->
            <div class="step" id="step-2">
                <h3>Řekněte nám více</h3>
                <div class="form-group">
                    <label class="form-label">Co můžeme zlepšit?</label>
                    <textarea class="form-input" rows="4" id="feedback-text" placeholder="Vaše zpětná vazba..."></textarea>
                </div>
                <div class="form-group">
                    <label class="form-label">Váš email (nepovinné)</label>
                    <input type="email" class="form-input" id="email" placeholder="email@example.com">
                </div>
                <button class="btn btn-secondary" onclick="prevStep()">Zpět</button>
                <button class="btn" onclick="nextStep()">Další</button>
            </div>
            
            <!-- Step 3: Thank you -->
            <div class="step" id="step-3">
                <div class="thank-you">
                    <h2>Děkujeme!</h2>
                    <p>Vaše zpětná vazba je pro nás velmi důležitá.</p>
                    <button class="btn" onclick="window.close()">Zavřít</button>
                </div>
            </div>
        </div>
    </div>

    <script>
        let currentStep = 1;
        let responses = {};
        
        // Rating selection
        document.querySelectorAll('.rating-item').forEach(item => {
            item.addEventListener('click', function() {
                document.querySelectorAll('.rating-item').forEach(r => r.classList.remove('selected'));
                this.classList.add('selected');
                responses.rating = this.dataset.value;
                document.getElementById('next-btn-1').disabled = false;
            });
        });
        
        function nextStep() {
            if (currentStep === 1) {
                responses.feedback = document.getElementById('feedback-text').value;
                responses.email = document.getElementById('email').value;
            } else if (currentStep === 2) {
                submitResponse();
                return;
            }
            
            currentStep++;
            updateStepDisplay();
        }
        
        function prevStep() {
            currentStep--;
            updateStepDisplay();
        }
        
        function updateStepDisplay() {
            document.querySelectorAll('.step').forEach(step => step.classList.remove('active'));
            document.getElementById('step-' + currentStep).classList.add('active');
            
            document.querySelectorAll('.step-dot').forEach((dot, index) => {
                dot.classList.toggle('active', index < currentStep);
            });
        }
        
        async function submitResponse() {
            try {
                const response = await fetch('/api/widgets/${tokenId}/response', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        responses: responses,
                        step: currentStep
                    })
                });
                
                if (response.ok) {
                    currentStep = 3;
                    updateStepDisplay();
                } else {
                    alert('Došlo k chybě při odesílání odpovědi. Zkuste to prosím znovu.');
                }
            } catch (error) {
                alert('Došlo k chybě při odesílání odpovědi. Zkuste to prosím znovu.');
            }
        }
    </script>
</body>
</html>
  `;
};

module.exports = router; 