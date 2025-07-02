const express = require('express');
const router = express.Router();
const { getDatabase } = require('../database/init');
const { authenticateToken } = require('../middleware/auth');
const { logManualAuditEvent } = require('../middleware/audit');

// Submit survey response
router.post('/submit', async (req, res) => {
  try {
    const { surveyId, tokenId, responses, formType } = req.body;
    const ip = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');

    const db = getDatabase();

    // Insert main response record
    const responseData = JSON.stringify(responses);
    const result = await new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO survey_responses (survey_id, token_id, response_data, ip_address, user_agent)
         VALUES (?, ?, ?, ?, ?)`,
        [surveyId, tokenId, responseData, ip, userAgent],
        function(err) {
          if (err) reject(err);
          else resolve({ id: this.lastID });
        }
      );
    });

    const responseId = result.id;

    // Insert individual answers for statistics
    for (const [stepId, answer] of Object.entries(responses)) {
      if (answer !== null && answer !== undefined) {
        let questionText = '';
        let questionType = '';
        let answerValue = '';
        let answerIndex = null;

        // Determine question type and format answer
        if (typeof answer === 'number') {
          // Emoji rating
          questionType = 'emoji-rating';
          answerValue = ['Very Happy', 'Happy', 'Neutral', 'Sad', 'Very Sad'][answer];
          answerIndex = answer;
        } else if (Array.isArray(answer)) {
          // Multi-select
          questionType = 'multi-select';
          answerValue = answer.join(', ');
        } else {
          // Text or single choice
          questionType = 'text';
          answerValue = answer.toString();
        }

        await new Promise((resolve, reject) => {
          db.run(
            `INSERT INTO response_answers (response_id, step_id, question_text, question_type, answer_value, answer_index)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [responseId, stepId, questionText, questionType, answerValue, answerIndex],
            function(err) {
              if (err) reject(err);
              else resolve();
            }
          );
        });
      }
    }

    // Log the response submission
    logManualAuditEvent(null, 'RESPONSE_SUBMIT', 'survey_response', responseId, {
      surveyId,
      tokenId,
      formType,
      responseCount: Object.keys(responses).length
    }, ip, userAgent);

    res.json({ success: true, responseId });
  } catch (error) {
    console.error('Error submitting response:', error);
    res.status(500).json({ error: 'Failed to submit response' });
  }
});

// Get statistics for a survey
router.get('/statistics/:surveyId', authenticateToken, async (req, res) => {
  try {
    const { surveyId } = req.params;
    const db = getDatabase();

    // Check if user has access to this survey
    const survey = await new Promise((resolve, reject) => {
      db.get(
        `SELECT * FROM surveys WHERE id = ? AND (user_id = ? OR ? = 'admin')`,
        [surveyId, req.user.id, req.user.role],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    if (!survey) {
      return res.status(404).json({ error: 'Survey not found or access denied' });
    }

    // Get response count
    const responseCount = await new Promise((resolve, reject) => {
      db.get(
        `SELECT COUNT(*) as count FROM survey_responses WHERE survey_id = ?`,
        [surveyId],
        (err, row) => {
          if (err) reject(err);
          else resolve(row.count);
        }
      );
    });

    // Get all responses with answers
    const responses = await new Promise((resolve, reject) => {
      db.all(
        `SELECT sr.id, sr.created_at, sr.ip_address,
                ra.step_id, ra.question_type, ra.answer_value, ra.answer_index
         FROM survey_responses sr
         LEFT JOIN response_answers ra ON sr.id = ra.response_id
         WHERE sr.survey_id = ?
         ORDER BY sr.created_at DESC, ra.step_id`,
        [surveyId],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });

    // Process statistics by question type
    const statistics = {};
    const individualResponses = {};

    responses.forEach(row => {
      if (!individualResponses[row.id]) {
        individualResponses[row.id] = {
          id: row.id,
          submittedAt: row.created_at,
          ipAddress: row.ip_address,
          answers: {}
        };
      }

      if (row.step_id) {
        individualResponses[row.id].answers[row.step_id] = {
          type: row.question_type,
          value: row.answer_value,
          index: row.answer_index
        };

        // Build statistics
        if (!statistics[row.step_id]) {
          statistics[row.step_id] = {
            type: row.question_type,
            totalResponses: 0,
            distribution: {}
          };
        }

        if (row.question_type === 'emoji-rating') {
          const emojiNames = ['Very Happy', 'Happy', 'Neutral', 'Sad', 'Very Sad'];
          if (!statistics[row.step_id].distribution[emojiNames[row.answer_index]]) {
            statistics[row.step_id].distribution[emojiNames[row.answer_index]] = 0;
          }
          statistics[row.step_id].distribution[emojiNames[row.answer_index]]++;
          statistics[row.step_id].totalResponses++;
        } else if (row.question_type === 'text') {
          if (!statistics[row.step_id].textResponses) {
            statistics[row.step_id].textResponses = [];
          }
          statistics[row.step_id].textResponses.push(row.answer_value);
          statistics[row.step_id].totalResponses++;
        }
      }
    });

    res.json({
      survey: {
        id: survey.id,
        title: survey.title,
        description: survey.description
      },
      responseCount,
      statistics,
      individualResponses: Object.values(individualResponses)
    });

  } catch (error) {
    console.error('Error getting statistics:', error);
    res.status(500).json({ error: 'Failed to get statistics' });
  }
});

module.exports = router; 