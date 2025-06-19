import { withDb } from '../db/db.js';

// Helper function to convert SQLite datetime string to REST API compatible format
const formatDateTime = (dateString) => {
    if (!dateString) return null;
    // SQLite returns datetime in 'YYYY-MM-DD HH:MM:SS' format
    // Return it as-is to match REST API format
    return dateString;
};

export const ResponseModel = {
  create: async (formId, responseData) => {
    try {
      // Insert the response record
      const responseQuery = `
        INSERT INTO responses (formId, respondentName, respondentEmail, createdAt, updatedAt)
        VALUES (?, ?, ?, datetime('now'), datetime('now'))
      `;
      
      await withDb(responseQuery, [
        formId,
        responseData.respondentName || null,
        responseData.respondentEmail || null
      ]);
      
      // Get the created response
      const selectQuery = 'SELECT * FROM responses WHERE formId = ? ORDER BY id DESC LIMIT 1';
      const responses = await withDb(selectQuery, [formId]);
      
      if (responses.length === 0) {
        throw new Error('Failed to create response');
      }
      
      const response = responses[0];
      const responseId = response.id;
      
      // Insert each answer if provided
      if (responseData.answers && Array.isArray(responseData.answers)) {
        for (const answer of responseData.answers) {
          const answerQuery = `
            INSERT INTO answer_values (responseId, questionId, answerText, createdAt)
            VALUES (?, ?, ?, datetime('now'))
          `;
          
          await withDb(answerQuery, [
            responseId,
            answer.questionId,
            answer.answer
          ]);
        }
      }
      
      return {
        id: response.id.toString(),
        formId: response.formId.toString(),
        respondentName: response.respondentName,
        respondentEmail: response.respondentEmail,
        createdAt: formatDateTime(response.createdAt),
        updatedAt: formatDateTime(response.updatedAt)
      };
    } catch (error) {
      throw error;
    }
  },

  getAll: async (formId) => {
    try {
      const query = 'SELECT * FROM responses WHERE formId = ? ORDER BY createdAt DESC';
      const responses = await withDb(query, [formId]);
      
      return responses.map(response => ({
        id: response.id.toString(),
        formId: response.formId.toString(),
        respondentName: response.respondentName,
        respondentEmail: response.respondentEmail,
        createdAt: formatDateTime(response.createdAt),
        updatedAt: formatDateTime(response.updatedAt)
      }));
    } catch (error) {
      throw error;
    }
  },

  getByFormId: async (formId, sort = null) => {
    try {
      let query = 'SELECT * FROM responses WHERE formId = ?';
      
      // Add sorting
      if (sort) {
        const sortField = sort.field === 'CREATED_AT' ? 'createdAt' :
                        sort.field === 'UPDATED_AT' ? 'updatedAt' :
                        sort.field === 'RESPONDENT_NAME' ? 'respondentName' : 'createdAt';
        const sortOrder = sort.order === 'DESC' ? 'DESC' : 'ASC';
        query += ` ORDER BY ${sortField} ${sortOrder}`;
      } else {
        query += ' ORDER BY createdAt DESC';
      }
      
      const responses = await withDb(query, [formId]);
      
      return responses.map(response => ({
        id: response.id.toString(),
        formId: response.formId.toString(),
        respondentName: response.respondentName,
        respondentEmail: response.respondentEmail,
        createdAt: formatDateTime(response.createdAt),
        updatedAt: formatDateTime(response.updatedAt)
      }));
    } catch (error) {
      throw error;
    }
  },

  getById: async (id) => {
    try {
      const query = 'SELECT * FROM responses WHERE id = ?';
      const responses = await withDb(query, [id]);
      
      if (responses.length === 0) {
        throw new Error(`Response with id ${id} not found`);
      }
      
      const response = responses[0];
      return {
        id: response.id.toString(),
        formId: response.formId.toString(),
        respondentName: response.respondentName,
        respondentEmail: response.respondentEmail,
        createdAt: formatDateTime(response.createdAt),
        updatedAt: formatDateTime(response.updatedAt)
      };
    } catch (error) {
      throw error;
    }
  },

  update: async (id, responseData) => {
    try {
      const fields = [];
      const values = [];
      
      if (responseData.respondentName !== undefined) {
        fields.push('respondentName = ?');
        values.push(responseData.respondentName);
      }
      if (responseData.respondentEmail !== undefined) {
        fields.push('respondentEmail = ?');
        values.push(responseData.respondentEmail);
      }
      
      fields.push('updatedAt = datetime(\'now\')');
      values.push(id);
      
      const query = `UPDATE responses SET ${fields.join(', ')} WHERE id = ?`;
      
      await withDb(query, values);
      
      // Update answers if provided
      if (responseData.answers && Array.isArray(responseData.answers)) {
        // Delete existing answers
        await withDb('DELETE FROM answer_values WHERE responseId = ?', [id]);
        
        // Insert new answers
        for (const answer of responseData.answers) {
          const answerQuery = `
            INSERT INTO answer_values (responseId, questionId, answerText, createdAt)
            VALUES (?, ?, ?, datetime('now'))
          `;
          
          await withDb(answerQuery, [
            id,
            answer.questionId,
            answer.answer
          ]);
        }
      }
      
      // Return updated response
      return await ResponseModel.getById(id);
    } catch (error) {
      throw error;
    }
  },

  delete: async (id) => {
    try {
      // Delete answers first (foreign key constraint)
      await withDb('DELETE FROM answer_values WHERE responseId = ?', [id]);
      
      // Delete response
      const query = 'DELETE FROM responses WHERE id = ?';
      await withDb(query, [id]);
      
      return { success: true };
    } catch (error) {
      throw error;
    }
  },

  getAnswersByResponseId: async (responseId) => {
    try {
      const query = `
        SELECT av.*, q.questionText, q.questionType 
        FROM answer_values av 
        JOIN questions q ON av.questionId = q.id 
        WHERE av.responseId = ?
      `;
      const answers = await withDb(query, [responseId]);
      
      return answers.map(answer => ({
        id: answer.id ? answer.id.toString() : null,
        responseId: answer.responseId.toString(),
        questionId: answer.questionId.toString(),
        answer: answer.answerText
      }));
    } catch (error) {
      throw error;
    }
  },

  getAnswersByQuestionId: async (questionId) => {
    try {
      const query = `
        SELECT av.*, r.respondentName, r.respondentEmail 
        FROM answer_values av 
        JOIN responses r ON av.responseId = r.id 
        WHERE av.questionId = ?
      `;
      const answers = await withDb(query, [questionId]);
      
      return answers.map(answer => ({
        id: answer.id ? answer.id.toString() : null,
        responseId: answer.responseId.toString(),
        questionId: answer.questionId.toString(),
        answer: answer.answerText
      }));
    } catch (error) {
      throw error;
    }
  }
};
