import { withDb } from '../db/db.js';

// Helper function to convert SQLite datetime string to REST API compatible format
const formatDateTime = (dateString) => {
    if (!dateString) return null;
    // SQLite returns datetime in 'YYYY-MM-DD HH:MM:SS' format
    // Return it as-is to match REST API format
    return dateString;
};

export const QuestionModel = {
  create: async (formId, questionData) => {
    try {
      console.log('QuestionModel.create called with:', { formId, questionData });
      
      const { text, type, required = false, options = [], order } = questionData;
      const query = `
        INSERT INTO questions (formId, questionText, questionType, required, options, questionOrder, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      `;
      
      const params = [
        formId,
        text,
        type,
        required ? 1 : 0,
        JSON.stringify(options),
        order || 0
      ];
      
      console.log('About to execute INSERT with params:', params);
      
      // Use withDb for INSERT
      await withDb(query, params);
      
      console.log('INSERT completed, now fetching created question...');
      
      // Get the most recently created question for this form with this text
      const selectQuery = 'SELECT * FROM questions WHERE formId = ? AND questionText = ? ORDER BY id DESC LIMIT 1';
      const questions = await withDb(selectQuery, [formId, text]);
      
      console.log('SELECT result:', questions);
      
      if (questions.length === 0) {
        throw new Error('Failed to create question');
      }
      
      const question = questions[0];
      
      console.log('Returning question:', question);
      
      return {
        id: question.id.toString(),
        formId: question.formId.toString(),
        text: question.questionText,
        type: question.questionType,
        required: Boolean(question.required),
        options: JSON.parse(question.options || '[]'),
        order: question.questionOrder || 0,
        createdAt: formatDateTime(question.createdAt),
        updatedAt: formatDateTime(question.updatedAt)
      };
    } catch (error) {
      console.error('Error in QuestionModel.create:', error);
      throw error;
    }
  },
  
  getAll: async (formId) => {
    try {
      let query = 'SELECT * FROM questions WHERE formId = ? ORDER BY questionOrder ASC, id ASC';
      const questions = await withDb(query, [formId]);
      
      return questions.map(question => ({
        id: question.id.toString(),
        formId: question.formId.toString(),
        text: question.questionText,
        type: question.questionType,
        required: Boolean(question.required),
        options: JSON.parse(question.options || '[]'),
        order: question.questionOrder || 0,
        createdAt: formatDateTime(question.createdAt),
        updatedAt: formatDateTime(question.updatedAt)
      }));
    } catch (error) {
      throw error;
    }
  },

  getByFormId: async (formId, sort = null) => {
    try {
      let query = 'SELECT * FROM questions WHERE formId = ?';
      let orderBy = ' ORDER BY questionOrder ASC, id ASC';
      
      if (sort) {
        switch (sort.field) {
          case 'createdAt':
            orderBy = ` ORDER BY createdAt ${sort.direction}`;
            break;
          case 'updatedAt':
            orderBy = ` ORDER BY updatedAt ${sort.direction}`;
            break;
          case 'order':
            orderBy = ` ORDER BY questionOrder ${sort.direction}`;
            break;
          default:
            orderBy = ' ORDER BY questionOrder ASC, id ASC';
        }
      }
      
      query += orderBy;
      const questions = await withDb(query, [formId]);
      
      return questions.map(question => ({
        id: question.id.toString(),
        formId: question.formId.toString(),
        text: question.questionText,
        type: question.questionType,
        required: Boolean(question.required),
        options: JSON.parse(question.options || '[]'),
        order: question.questionOrder || 0,
        createdAt: formatDateTime(question.createdAt),
        updatedAt: formatDateTime(question.updatedAt)
      }));
    } catch (error) {
      throw error;
    }
  },

  getById: async (id) => {
    try {
      const query = 'SELECT * FROM questions WHERE id = ?';
      const questions = await withDb(query, [id]);
      
      if (questions.length === 0) {
        throw new Error('Question not found');
      }
      
      const question = questions[0];
      
      return {
        id: question.id.toString(),
        formId: question.formId.toString(),
        text: question.questionText,
        type: question.questionType,
        required: Boolean(question.required),
        options: JSON.parse(question.options || '[]'),
        order: question.questionOrder || 0,
        createdAt: formatDateTime(question.createdAt),
        updatedAt: formatDateTime(question.updatedAt)
      };
    } catch (error) {
      throw error;
    }
  },
  
  update: async (id, questionData) => {
    try {
      const fields = [];
      const values = [];
      
      if (questionData.text) {
        fields.push('questionText = ?');
        values.push(questionData.text);
      }
      if (questionData.type) {
        fields.push('questionType = ?');
        values.push(questionData.type);
      }
      if (questionData.required !== undefined) {
        fields.push('required = ?');
        values.push(questionData.required ? 1 : 0);
      }
      if (questionData.options !== undefined) {
        fields.push('options = ?');
        values.push(JSON.stringify(questionData.options));
      }
      if (questionData.order !== undefined) {
        fields.push('questionOrder = ?');
        values.push(questionData.order);
      }
      
      fields.push('updatedAt = datetime(\'now\')');
      values.push(id);
      
      const query = `UPDATE questions SET ${fields.join(', ')} WHERE id = ?`;
      
      await withDb(query, values);
      
      // Return updated question
      return await QuestionModel.getById(id);
    } catch (error) {
      throw error;
    }
  },
  
  deleteQuestion: async (id) => {
    try {
      const query = 'DELETE FROM questions WHERE id = ?';
      await withDb(query, [id]);
      return { success: true };
    } catch (error) {
      throw error;
    }
  },
  
  reorderQuestions: async (formId, questionIds) => {
    try {
      // Validate that all question IDs belong to the form
      const existingQuestions = await QuestionModel.getByFormId(formId);
      const existingIds = existingQuestions.map(q => q.id.toString());
      
      // Check if all provided IDs exist in the form
      for (const id of questionIds) {
        if (!existingIds.includes(id.toString())) {
          throw new Error(`Question with ID ${id} not found in form ${formId}`);
        }
      }
      
      // Check if all existing questions are included in the reorder
      if (questionIds.length !== existingIds.length) {
        throw new Error('All questions must be included in the reorder operation');
      }
      
      // Update the order of each question
      for (let i = 0; i < questionIds.length; i++) {
        const questionId = questionIds[i];
        const newOrder = i + 1; // 1-based ordering
        
        const query = 'UPDATE questions SET questionOrder = ?, updatedAt = datetime(\'now\') WHERE id = ? AND formId = ?';
        await withDb(query, [newOrder, questionId, formId]);
      }
      
      return { success: true };
    } catch (error) {
      throw error;
    }
  },
};
