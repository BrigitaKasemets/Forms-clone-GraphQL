import { GraphQLError } from 'graphql';
import { DateTimeResolver, EmailAddressResolver, URLResolver } from 'graphql-scalars';
import jwt from 'jsonwebtoken';
import { UserModel } from '../models/userModel.js';
import { FormModel } from '../models/formModel.js';
import { QuestionModel } from '../models/questionModel.js';
import { ResponseModel } from '../models/responseModel.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Custom scalar for JWT
const JWTScalar = {
  serialize: (value) => value,
  parseValue: (value) => value,
  parseLiteral: (ast) => ast.value,
};

// Error helper function
const createError = (code, message, httpStatus = 400, details = []) => {
  return {
    __typename: 'Error',
    code,
    message,
    httpStatus,
    details
  };
};

// Error detail helper
const createErrorDetail = (field, message, constraint = null) => {
  return {
    field,
    message,
    constraint
  };
};

// Auth helper
const getAuthenticatedUser = (context) => {
  if (!context.user) {
    throw new GraphQLError('Authentication required', {
      extensions: { code: 'UNAUTHORIZED' }
    });
  }
  return context.user;
};

export const resolvers = {
  // Scalar types
  DateTime: DateTimeResolver,
  Email: EmailAddressResolver,
  URL: URLResolver,
  JWT: JWTScalar,

  // Union type resolvers
  SessionResult: {
    __resolveType(obj) {
      return obj.__typename || (obj.token ? 'Session' : 'Error');
    },
  },
  UserResult: {
    __resolveType(obj) {
      return obj.__typename || (obj.id ? 'User' : 'Error');
    },
  },
  UsersResult: {
    __resolveType(obj) {
      return obj.__typename || (obj.users ? 'UsersList' : 'Error');
    },
  },
  FormResult: {
    __resolveType(obj) {
      return obj.__typename || (obj.id ? 'Form' : 'Error');
    },
  },
  FormsResult: {
    __resolveType(obj) {
      return obj.__typename || (obj.forms ? 'FormsList' : 'Error');
    },
  },
  QuestionResult: {
    __resolveType(obj) {
      return obj.__typename || (obj.id ? 'Question' : 'Error');
    },
  },
  QuestionsResult: {
    __resolveType(obj) {
      return obj.__typename || (obj.questions ? 'QuestionsList' : 'Error');
    },
  },
  ResponseResult: {
    __resolveType(obj) {
      return obj.__typename || (obj.id ? 'Response' : 'Error');
    },
  },
  ResponsesResult: {
    __resolveType(obj) {
      return obj.__typename || (obj.responses ? 'ResponsesList' : 'Error');
    },
  },
  HealthResult: {
    __resolveType(obj) {
      return obj.__typename || (obj.status ? 'HealthStatus' : 'Error');
    },
  },
  DeleteResult: {
    __resolveType(obj) {
      return obj.__typename || (obj.success !== undefined ? 'SuccessResult' : 'Error');
    },
  },

  // Type resolvers with relations
  User: {
    forms: async (parent) => {
      try {
        return await FormModel.getByUserId(parent.id);
      } catch (error) {
        return [];
      }
    },
  },

  Form: {
    user: async (parent) => {
      try {
        return await UserModel.getById(parent.userId);
      } catch (error) {
        return null;
      }
    },
    questions: async (parent) => {
      try {
        return await QuestionModel.getByFormId(parent.id);
      } catch (error) {
        return [];
      }
    },
    responses: async (parent) => {
      try {
        return await ResponseModel.getByFormId(parent.id);
      } catch (error) {
        return [];
      }
    },
    questionCount: async (parent) => {
      try {
        const questions = await QuestionModel.getByFormId(parent.id);
        return questions.length;
      } catch (error) {
        return 0;
      }
    },
    responseCount: async (parent) => {
      try {
        const responses = await ResponseModel.getByFormId(parent.id);
        return responses.length;
      } catch (error) {
        return 0;
      }
    },
  },

  Question: {
    form: async (parent) => {
      try {
        return await FormModel.getById(parent.formId);
      } catch (error) {
        return null;
      }
    },
    answers: async (parent) => {
      try {
        return await ResponseModel.getAnswersByQuestionId(parent.id);
      } catch (error) {
        return [];
      }
    },
  },

  Response: {
    form: async (parent) => {
      try {
        return await FormModel.getById(parent.formId);
      } catch (error) {
        return null;
      }
    },
    answers: async (parent) => {
      try {
        return await ResponseModel.getAnswersByResponseId(parent.id);
      } catch (error) {
        return [];
      }
    },
    answerCount: async (parent) => {
      try {
        const answers = await ResponseModel.getAnswersByResponseId(parent.id);
        return answers.length;
      } catch (error) {
        return 0;
      }
    },
  },

  Answer: {
    question: async (parent) => {
      try {
        return await QuestionModel.getById(parent.questionId);
      } catch (error) {
        return null;
      }
    },
    response: async (parent) => {
      try {
        return await ResponseModel.getById(parent.responseId);
      } catch (error) {
        return null;
      }
    },
  },

  Query: {
    // System queries
    health: async () => {
      try {
        return {
          __typename: 'HealthStatus',
          status: 'OK',
          message: 'GraphQL server is running',
          timestamp: new Date().toISOString(),
          version: '1.0.0'
        };
      } catch (error) {
        return createError('INTERNAL_ERROR', 'Health check failed', 500);
      }
    },

    // User queries
    me: async (_, __, context) => {
      try {
        const user = getAuthenticatedUser(context);
        return await UserModel.getById(user.id);
      } catch (error) {
        if (error.extensions?.code === 'UNAUTHORIZED') {
          return createError('UNAUTHORIZED', 'Authentication required', 401);
        }
        return createError('USER_NOT_FOUND', error.message, 404);
      }
    },

    users: async (_, __, context) => {
      try {
        getAuthenticatedUser(context); // Ensure authenticated
        const users = await UserModel.getAll();
        return {
          __typename: 'UsersList',
          users,
          count: users.length
        };
      } catch (error) {
        if (error.extensions?.code === 'UNAUTHORIZED') {
          return createError('UNAUTHORIZED', 'Authentication required', 401);
        }
        return createError('INTERNAL_ERROR', 'Failed to fetch users', 500);
      }
    },

    user: async (_, { id }, context) => {
      try {
        getAuthenticatedUser(context);
        return await UserModel.getById(id);
      } catch (error) {
        if (error.extensions?.code === 'UNAUTHORIZED') {
          return createError('UNAUTHORIZED', 'Authentication required', 401);
        }
        return createError('USER_NOT_FOUND', error.message, 404);
      }
    },

    // Form queries
    forms: async (_, { filter, sort }, context) => {
      try {
        const user = getAuthenticatedUser(context);
        const forms = await FormModel.getAll(user.id, filter, sort);
        return {
          __typename: 'FormsList',
          forms,
          count: forms.length
        };
      } catch (error) {
        if (error.extensions?.code === 'UNAUTHORIZED') {
          return createError('UNAUTHORIZED', 'Authentication required', 401);
        }
        return createError('INTERNAL_ERROR', 'Failed to fetch forms', 500);
      }
    },

    form: async (_, { id }, context) => {
      try {
        getAuthenticatedUser(context);
        return await FormModel.getById(id);
      } catch (error) {
        if (error.extensions?.code === 'UNAUTHORIZED') {
          return createError('UNAUTHORIZED', 'Authentication required', 401);
        }
        return createError('FORM_NOT_FOUND', error.message, 404);
      }
    },

    // Question queries
    questions: async (_, { formId, sort }, context) => {
      try {
        getAuthenticatedUser(context);
        const questions = await QuestionModel.getByFormId(formId, sort);
        return {
          __typename: 'QuestionsList',
          questions,
          count: questions.length
        };
      } catch (error) {
        if (error.extensions?.code === 'UNAUTHORIZED') {
          return createError('UNAUTHORIZED', 'Authentication required', 401);
        }
        return createError('INTERNAL_ERROR', 'Failed to fetch questions', 500);
      }
    },

    question: async (_, { formId, id }, context) => {
      try {
        getAuthenticatedUser(context);
        return await QuestionModel.getById(id);
      } catch (error) {
        if (error.extensions?.code === 'UNAUTHORIZED') {
          return createError('UNAUTHORIZED', 'Authentication required', 401);
        }
        return createError('QUESTION_NOT_FOUND', error.message, 404);
      }
    },

    // Response queries
    responses: async (_, { formId, sort }, context) => {
      try {
        getAuthenticatedUser(context);
        const responses = await ResponseModel.getByFormId(formId, sort);
        return {
          __typename: 'ResponsesList',
          responses,
          count: responses.length
        };
      } catch (error) {
        if (error.extensions?.code === 'UNAUTHORIZED') {
          return createError('UNAUTHORIZED', 'Authentication required', 401);
        }
        return createError('INTERNAL_ERROR', 'Failed to fetch responses', 500);
      }
    },

    response: async (_, { formId, id }, context) => {
      try {
        getAuthenticatedUser(context);
        return await ResponseModel.getById(id);
      } catch (error) {
        if (error.extensions?.code === 'UNAUTHORIZED') {
          return createError('UNAUTHORIZED', 'Authentication required', 401);
        }
        return createError('RESPONSE_NOT_FOUND', error.message, 404);
      }
    },
  },

  Mutation: {
    // Authentication
    login: async (_, { input }) => {
      try {
        const { email, password } = input;
        
        // Validate input
        const errors = [];
        
        if (!email || !email.trim()) {
          errors.push(createErrorDetail('email', 'Email is required'));
        }
        
        if (!password || !password.trim()) {
          errors.push(createErrorDetail('password', 'Password is required'));
        }
        
        if (errors.length > 0) {
          return createError('VALIDATION_ERROR', 'Invalid input data', 400, errors);
        }
        
        const user = await UserModel.validateCredentials(email, password);
        
        if (!user) {
          return createError('INVALID_CREDENTIALS', 'Invalid email or password', 401, [
            createErrorDetail('credentials', 'Email or password is incorrect', 'AUTHENTICATION')
          ]);
        }

        const token = jwt.sign(
          { userId: user.id, email: user.email },
          JWT_SECRET,
          { expiresIn: '24h' }
        );

        return {
          __typename: 'Session',
          token,
          userId: user.id,
          user,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        };
      } catch (error) {
        return createError('INTERNAL_ERROR', 'Login failed', 500);
      }
    },

    logout: async (_, __, context) => {
      try {
        getAuthenticatedUser(context);
        return {
          __typename: 'SuccessResult',
          success: true,
          message: 'Logged out successfully'
        };
      } catch (error) {
        return createError('UNAUTHORIZED', 'Authentication required', 401);
      }
    },

    // User management
    register: async (_, { input }) => {
      try {
        const { email, password, name } = input;
        
        // Validate input
        const errors = [];
        
        if (!email || !email.trim()) {
          errors.push(createErrorDetail('email', 'Email is required'));
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          errors.push(createErrorDetail('email', 'Invalid email format', 'EMAIL_FORMAT'));
        }
        
        if (!password || password.length < 8) {
          errors.push(createErrorDetail('password', 'Password must be at least 8 characters long', 'MIN_LENGTH'));
        }
        
        if (!name || !name.trim()) {
          errors.push(createErrorDetail('name', 'Name is required'));
        }
        
        if (errors.length > 0) {
          return createError('VALIDATION_ERROR', 'Invalid input data', 400, errors);
        }
        
        const user = await UserModel.create(email, password, name);
        return user;
      } catch (error) {
        if (error.message.includes('UNIQUE constraint failed')) {
          return createError('DUPLICATE_EMAIL', 'Email already exists', 409, [
            createErrorDetail('email', 'This email is already registered', 'UNIQUE')
          ]);
        }
        if (error.message.includes('validation')) {
          const details = [createErrorDetail('password', error.message, 'PASSWORD_POLICY')];
          return createError('VALIDATION_ERROR', 'Password does not meet requirements', 400, details);
        }
        return createError('INTERNAL_ERROR', 'Registration failed', 500);
      }
    },

    updateUser: async (_, { id, input }, context) => {
      try {
        const currentUser = getAuthenticatedUser(context);
        
        // Users can only update their own profile
        if (currentUser.id !== id) {
          return createError('FORBIDDEN', 'You can only update your own profile', 403);
        }

        const user = await UserModel.update(id, input);
        return user;
      } catch (error) {
        if (error.extensions?.code === 'UNAUTHORIZED') {
          return createError('UNAUTHORIZED', 'Authentication required', 401);
        }
        return createError('VALIDATION_ERROR', error.message, 400);
      }
    },

    deleteUser: async (_, { id }, context) => {
      try {
        const currentUser = getAuthenticatedUser(context);
        
        // Users can only delete their own account
        if (currentUser.id !== id) {
          return createError('FORBIDDEN', 'You can only delete your own account', 403);
        }

        await UserModel.delete(id);
        
        // Clear the authentication context since user is deleted
        context.user = null;
        
        return {
          __typename: 'SuccessResult',
          success: true,
          message: 'User deleted successfully and logged out'
        };
      } catch (error) {
        if (error.extensions?.code === 'UNAUTHORIZED') {
          return createError('UNAUTHORIZED', 'Authentication required', 401);
        }
        return createError('USER_NOT_FOUND', error.message, 404);
      }
    },

    // Form management
    createForm: async (_, { input }, context) => {
      try {
        const user = getAuthenticatedUser(context);
        
        // Validate input
        const errors = [];
        
        if (!input.title || !input.title.trim()) {
          errors.push(createErrorDetail('title', 'Form title is required'));
        } else if (input.title.length > 200) {
          errors.push(createErrorDetail('title', 'Form title must be 200 characters or less', 'MAX_LENGTH'));
        }
        
        if (input.description && input.description.length > 1000) {
          errors.push(createErrorDetail('description', 'Form description must be 1000 characters or less', 'MAX_LENGTH'));
        }
        
        if (errors.length > 0) {
          return createError('VALIDATION_ERROR', 'Invalid form data', 400, errors);
        }
        
        const form = await FormModel.create(user.id, input.title, input.description);
        return form;
      } catch (error) {
        if (error.extensions?.code === 'UNAUTHORIZED') {
          return createError('UNAUTHORIZED', 'Authentication required', 401);
        }
        return createError('INTERNAL_ERROR', 'Failed to create form', 500);
      }
    },

    updateForm: async (_, { id, input }, context) => {
      try {
        const user = getAuthenticatedUser(context);
        const form = await FormModel.getById(id);
        
        if (form.userId !== user.id) {
          return createError('FORBIDDEN', 'You can only update your own forms', 403);
        }

        const updatedForm = await FormModel.update(id, input);
        return updatedForm;
      } catch (error) {
        if (error.extensions?.code === 'UNAUTHORIZED') {
          return createError('UNAUTHORIZED', 'Authentication required', 401);
        }
        return createError('FORM_NOT_FOUND', error.message, 404);
      }
    },

    deleteForm: async (_, { id }, context) => {
      try {
        const user = getAuthenticatedUser(context);
        const form = await FormModel.getById(id);
        
        if (form.userId !== user.id) {
          return createError('FORBIDDEN', 'You can only delete your own forms', 403);
        }

        await FormModel.delete(id);
        return {
          __typename: 'SuccessResult',
          success: true,
          message: 'Form deleted successfully'
        };
      } catch (error) {
        if (error.extensions?.code === 'UNAUTHORIZED') {
          return createError('UNAUTHORIZED', 'Authentication required', 401);
        }
        return createError('FORM_NOT_FOUND', error.message, 404);
      }
    },

    // Question management
    createQuestion: async (_, { formId, input }, context) => {
      try {
        const user = getAuthenticatedUser(context);
        const form = await FormModel.getById(formId);
        
        if (!form) {
          return createError('FORM_NOT_FOUND', 'Form not found', 404);
        }
        
        if (form.userId !== user.id) {
          return createError('FORBIDDEN', 'You can only add questions to your own forms', 403);
        }

        // Validate input
        const errors = [];
        
        if (!input.text || !input.text.trim()) {
          errors.push(createErrorDetail('text', 'Question text is required'));
        } else if (input.text.length > 500) {
          errors.push(createErrorDetail('text', 'Question text must be 500 characters or less', 'MAX_LENGTH'));
        }
        
        const validTypes = ['shorttext', 'paragraph', 'multiplechoice', 'checkbox', 'dropdown'];
        if (!input.type || !validTypes.includes(input.type)) {
          errors.push(createErrorDetail('type', `Question type must be one of: ${validTypes.join(', ')}`, 'INVALID_VALUE'));
        }
        
        if (['multiplechoice', 'checkbox', 'dropdown'].includes(input.type)) {
          if (!input.options || !Array.isArray(input.options) || input.options.length < 2) {
            errors.push(createErrorDetail('options', 'At least 2 options are required for choice questions', 'MIN_OPTIONS'));
          }
        }
        
        if (errors.length > 0) {
          return createError('VALIDATION_ERROR', 'Invalid question data', 400, errors);
        }

        const question = await QuestionModel.create(formId, input);
        return question;
      } catch (error) {
        if (error.extensions?.code === 'UNAUTHORIZED') {
          return createError('UNAUTHORIZED', 'Authentication required', 401);
        }
        return createError('INTERNAL_ERROR', 'Failed to create question', 500);
      }
    },

    updateQuestion: async (_, { formId, id, input }, context) => {
      try {
        const user = getAuthenticatedUser(context);
        const form = await FormModel.getById(formId);
        
        if (form.userId !== user.id) {
          return createError('FORBIDDEN', 'You can only update questions in your own forms', 403);
        }

        const question = await QuestionModel.update(id, input);
        return question;
      } catch (error) {
        if (error.extensions?.code === 'UNAUTHORIZED') {
          return createError('UNAUTHORIZED', 'Authentication required', 401);
        }
        return createError('QUESTION_NOT_FOUND', error.message, 404);
      }
    },

    deleteQuestion: async (_, { formId, id }, context) => {
      try {
        const user = getAuthenticatedUser(context);
        const form = await FormModel.getById(formId);
        
        if (form.userId !== user.id) {
          return createError('FORBIDDEN', 'You can only delete questions from your own forms', 403);
        }

        await QuestionModel.deleteQuestion(id);
        return {
          __typename: 'SuccessResult',
          success: true,
          message: 'Question deleted successfully'
        };
      } catch (error) {
        if (error.extensions?.code === 'UNAUTHORIZED') {
          return createError('UNAUTHORIZED', 'Authentication required', 401);
        }
        return createError('QUESTION_NOT_FOUND', error.message, 404);
      }
    },

    reorderQuestions: async (_, { formId, questionIds }, context) => {
      try {
        const user = getAuthenticatedUser(context);
        const form = await FormModel.getById(formId);
        
        if (!form) {
          return createError('FORM_NOT_FOUND', 'Form not found', 404);
        }
        
        if (form.userId !== user.id) {
          return createError('FORBIDDEN', 'You can only reorder questions in your own forms', 403);
        }

        // Validate input
        if (!questionIds || !Array.isArray(questionIds) || questionIds.length === 0) {
          return createError('VALIDATION_ERROR', 'Question IDs array is required', 400, [
            createErrorDetail('questionIds', 'At least one question ID is required')
          ]);
        }

        await QuestionModel.reorderQuestions(formId, questionIds);
        
        // Return the updated form with questions
        const updatedForm = await FormModel.getById(formId);
        return updatedForm;
      } catch (error) {
        if (error.extensions?.code === 'UNAUTHORIZED') {
          return createError('UNAUTHORIZED', 'Authentication required', 401);
        }
        if (error.message.includes('not found in form')) {
          return createError('VALIDATION_ERROR', error.message, 400, [
            createErrorDetail('questionIds', error.message, 'INVALID_QUESTION_ID')
          ]);
        }
        return createError('INTERNAL_ERROR', 'Failed to reorder questions', 500);
      }
    },

    // Response management (public - no auth required for creating responses)
    createResponse: async (_, { formId, input }) => {
      try {
        // Validate form exists
        const form = await FormModel.getById(formId);
        if (!form) {
          return createError('FORM_NOT_FOUND', 'Form not found', 404);
        }
        
        // Validate input
        const errors = [];
        
        if (!input.answers || !Array.isArray(input.answers) || input.answers.length === 0) {
          errors.push(createErrorDetail('answers', 'At least one answer is required'));
        } else {
          // Validate each answer
          input.answers.forEach((answer, index) => {
            if (!answer.questionId) {
              errors.push(createErrorDetail(`answers[${index}].questionId`, 'Question ID is required'));
            }
            if (!answer.answer || !answer.answer.trim()) {
              errors.push(createErrorDetail(`answers[${index}].answer`, 'Answer value is required'));
            }
          });
        }
        
        if (errors.length > 0) {
          return createError('VALIDATION_ERROR', 'Invalid response data', 400, errors);
        }
        
        const response = await ResponseModel.create(formId, input);
        return response;
      } catch (error) {
        if (error.message.includes('question not found') || error.message.includes('FOREIGN KEY')) {
          return createError('QUESTION_NOT_FOUND', 'One or more questions not found', 404, [
            createErrorDetail('questionId', 'Invalid question ID', 'FOREIGN_KEY')
          ]);
        }
        return createError('INTERNAL_ERROR', 'Failed to create response', 500);
      }
    },

    updateResponse: async (_, { formId, id, input }, context) => {
      try {
        const user = getAuthenticatedUser(context);
        const form = await FormModel.getById(formId);
        
        if (form.userId !== user.id) {
          return createError('FORBIDDEN', 'You can only update responses in your own forms', 403);
        }

        const response = await ResponseModel.update(id, input);
        return response;
      } catch (error) {
        if (error.extensions?.code === 'UNAUTHORIZED') {
          return createError('UNAUTHORIZED', 'Authentication required', 401);
        }
        return createError('RESPONSE_NOT_FOUND', error.message, 404);
      }
    },

    deleteResponse: async (_, { formId, id }, context) => {
      try {
        const user = getAuthenticatedUser(context);
        const form = await FormModel.getById(formId);
        
        if (form.userId !== user.id) {
          return createError('FORBIDDEN', 'You can only delete responses from your own forms', 403);
        }

        await ResponseModel.delete(id);
        return {
          __typename: 'SuccessResult',
          success: true,
          message: 'Response deleted successfully'
        };
      } catch (error) {
        if (error.extensions?.code === 'UNAUTHORIZED') {
          return createError('UNAUTHORIZED', 'Authentication required', 401);
        }
        return createError('RESPONSE_NOT_FOUND', error.message, 404);
      }
    },
  },
};
