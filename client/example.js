import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:4000/graphql';
const HEADERS = {
  'Content-Type': 'application/json',
};

// Test state
let authToken = null;
let userId = null;
let formId = null;
let questionId = null;
let responseId = null;
let testUserEmail = null;
let testUserPassword = null;

// Utility functions
function log(message, type = 'info') {
  const colors = {
    info: '\x1b[36m',    // Cyan
    success: '\x1b[32m', // Green
    error: '\x1b[31m',   // Red
    warning: '\x1b[33m', // Yellow
  };
  const reset = '\x1b[0m';
  console.log(`${colors[type]}${message}${reset}`);
}

function logTest(testName) {
  console.log(`\n${'='.repeat(60)}`);
  log(`${testName}`, 'info');
  console.log(`${'='.repeat(60)}`);
}

async function makeGraphQLRequest(query, variables = {}, requireAuth = false) {
  const headers = { ...HEADERS };
  if (requireAuth && authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }

  try {
    const response = await fetch(BASE_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        query,
        variables,
      }),
    });

    const result = await response.json();
    
    if (result.errors) {
      log(`❌ GraphQL Errors: ${JSON.stringify(result.errors, null, 2)}`, 'error');
      return { success: false, errors: result.errors };
    }

    return { success: true, data: result.data };
  } catch (error) {
    log(`❌ Network Error: ${error.message}`, 'error');
    return { success: false, error: error.message };
  }
}

// Test functions
async function testHealth() {
  logTest('1. Health Check');
  
  const query = `
    query Health {
      health {
        ... on HealthStatus {
          status
          message
          timestamp
          version
        }
        ... on Error {
          code
          message
        }
      }
    }
  `;

  const result = await makeGraphQLRequest(query);
  if (result.success) {
    log(`✅ Health check successful: ${JSON.stringify(result.data.health, null, 2)}`, 'success');
  } else {
    log('❌ Health check failed', 'error');
  }
  return result.success;
}

async function testRegister() {
  logTest('2. User Registration');
  
  const query = `
    mutation Register($input: UserCreateInput!) {
      register(input: $input) {
        ... on User {
          id
          email
          name
          createdAt
        }
        ... on Error {
          code
          message
          details {
            field
            message
          }
        }
      }
    }
  `;

  testUserEmail = `test.user.${Date.now()}@example.com`;
  testUserPassword = 'SecurePassword123';

  const variables = {
    input: {
      email: testUserEmail,
      password: testUserPassword,
      name: 'Test User'
    }
  };

  const result = await makeGraphQLRequest(query, variables);
  if (result.success && result.data.register.id) {
    // Don't set userId here, we'll get it from login
    log(`✅ User registered: ${JSON.stringify(result.data.register, null, 2)}`, 'success');
    return true;
  } else {
    log('❌ User registration failed', 'error');
    return false;
  }
}

async function testLogin() {
  logTest('3. User Login');
  
  const query = `
    mutation Login($input: SessionCreateInput!) {
      login(input: $input) {
        ... on Session {
          token
          userId
          user {
            id
            email
            name
          }
          expiresAt
        }
        ... on Error {
          code
          message
        }
      }
    }
  `;

  // Use the user we just registered
  const variables = {
    input: {
      email: testUserEmail,
      password: testUserPassword
    }
  };

  const result = await makeGraphQLRequest(query, variables);
  if (result.success && result.data.login.token) {
    authToken = result.data.login.token;
    userId = result.data.login.userId;
    log(`✅ Login successful: ${JSON.stringify(result.data.login, null, 2)}`, 'success');
    return true;
  } else {
    log('❌ Login failed', 'error');
    return false;
  }
}

async function testGetUsers() {
  logTest('4. Get All Users');
  
  const query = `
    query GetUsers {
      users {
        ... on UsersList {
          users {
            id
            email
            name
            createdAt
          }
          count
        }
        ... on Error {
          code
          message
        }
      }
    }
  `;

  const result = await makeGraphQLRequest(query, {}, true);
  if (result.success) {
    log(`✅ Users retrieved: ${JSON.stringify(result.data.users, null, 2)}`, 'success');
    return true;
  } else {
    log('❌ Get users failed', 'error');
    return false;
  }
}

async function testGetMe() {
  logTest('5. Get Current User');
  
  const query = `
    query GetMe {
      me {
        ... on User {
          id
          email
          name
          createdAt
          forms {
            id
            title
          }
        }
        ... on Error {
          code
          message
        }
      }
    }
  `;

  const result = await makeGraphQLRequest(query, {}, true);
  if (result.success) {
    log(`✅ Current user retrieved: ${JSON.stringify(result.data.me, null, 2)}`, 'success');
    return true;
  } else {
    log('❌ Get current user failed', 'error');
    return false;
  }
}

async function testCreateForm() {
  logTest('6. Create Form');
  
  const query = `
    mutation CreateForm($input: FormCreateInput!) {
      createForm(input: $input) {
        ... on Form {
          id
          title
          description
          createdAt
          questionCount
          responseCount
        }
        ... on Error {
          code
          message
        }
      }
    }
  `;

  const variables = {
    input: {
      title: `Test Form ${Date.now()}`,
      description: 'This is a test form created by the test script'
    }
  };

  const result = await makeGraphQLRequest(query, variables, true);
  if (result.success && result.data.createForm.id) {
    formId = result.data.createForm.id;
    log(`✅ Form created: ${JSON.stringify(result.data.createForm, null, 2)}`, 'success');
    return true;
  } else {
    log('❌ Form creation failed', 'error');
    return false;
  }
}

async function testGetForms() {
  logTest('7. Get All Forms');
  
  const query = `
    query GetForms($filter: FormFilter, $sort: FormSort) {
      forms(filter: $filter, sort: $sort) {
        ... on FormsList {
          forms {
            id
            title
            description
            createdAt
            questionCount
            responseCount
            user {
              name
              email
            }
          }
          count
        }
        ... on Error {
          code
          message
        }
      }
    }
  `;

  const variables = {
    sort: {
      field: "CREATED_AT",
      order: "DESC"
    }
  };

  const result = await makeGraphQLRequest(query, variables, true);
  if (result.success) {
    log(`✅ Forms retrieved: ${JSON.stringify(result.data.forms, null, 2)}`, 'success');
    return true;
  } else {
    log('❌ Get forms failed', 'error');
    return false;
  }
}

async function testGetForm() {
  logTest('8. Get Specific Form');
  
  if (!formId) {
    log('❌ No form ID available for testing', 'error');
    return false;
  }

  const query = `
    query GetForm($id: ID!) {
      form(id: $id) {
        ... on Form {
          id
          title
          description
          createdAt
          updatedAt
          questionCount
          responseCount
          user {
            name
            email
          }
          questions {
            id
            text
            type
            required
            options
            order
          }
          responses {
            id
            respondentName
            respondentEmail
            createdAt
          }
        }
        ... on Error {
          code
          message
        }
      }
    }
  `;

  const result = await makeGraphQLRequest(query, { id: formId }, true);
  if (result.success) {
    log(`✅ Form retrieved: ${JSON.stringify(result.data.form, null, 2)}`, 'success');
    return true;
  } else {
    log('❌ Get form failed', 'error');
    return false;
  }
}

async function testCreateQuestion() {
  logTest('9. Create Question');
  
  if (!formId) {
    log('❌ No form ID available for creating question', 'error');
    return false;
  }

  const query = `
    mutation CreateQuestion($formId: ID!, $input: QuestionCreateInput!) {
      createQuestion(formId: $formId, input: $input) {
        ... on Question {
          id
          text
          type
          required
          options
          order
          createdAt
        }
        ... on Error {
          code
          message
        }
      }
    }
  `;

  const variables = {
    formId,
    input: {
      text: 'What is your favorite color?',
      type: 'multiplechoice',
      required: true,
      options: ['Red', 'Blue', 'Green', 'Yellow'],
      order: 1
    }
  };

  const result = await makeGraphQLRequest(query, variables, true);
  if (result.success && result.data.createQuestion.id) {
    questionId = result.data.createQuestion.id;
    log(`✅ Question created: ${JSON.stringify(result.data.createQuestion, null, 2)}`, 'success');
    return true;
  } else {
    log('❌ Question creation failed', 'error');
    return false;
  }
}

async function testGetQuestions() {
  logTest('10. Get Questions');
  
  if (!formId) {
    log('❌ No form ID available for getting questions', 'error');
    return false;
  }

  const query = `
    query GetQuestions($formId: ID!, $sort: QuestionSort) {
      questions(formId: $formId, sort: $sort) {
        ... on QuestionsList {
          questions {
            id
            text
            type
            required
            options
            order
            createdAt
          }
          count
        }
        ... on Error {
          code
          message
        }
      }
    }
  `;

  const variables = {
    formId,
    sort: {
      field: "ORDER",
      order: "ASC"
    }
  };

  const result = await makeGraphQLRequest(query, variables, true);
  if (result.success) {
    log(`✅ Questions retrieved: ${JSON.stringify(result.data.questions, null, 2)}`, 'success');
    return true;
  } else {
    log('❌ Get questions failed', 'error');
    return false;
  }
}

async function testGetQuestion() {
  logTest('11. Get Specific Question');
  
  if (!formId || !questionId) {
    log('❌ No form ID or question ID available for testing', 'error');
    return false;
  }

  const query = `
    query GetQuestion($formId: ID!, $id: ID!) {
      question(formId: $formId, id: $id) {
        ... on Question {
          id
          text
          type
          required
          options
          order
          createdAt
          form {
            title
          }
          answers {
            id
            answer
          }
        }
        ... on Error {
          code
          message
        }
      }
    }
  `;

  const result = await makeGraphQLRequest(query, { formId, id: questionId }, true);
  if (result.success) {
    log(`✅ Question retrieved: ${JSON.stringify(result.data.question, null, 2)}`, 'success');
    return true;
  } else {
    log('❌ Get question failed', 'error');
    return false;
  }
}

async function testCreateResponse() {
  logTest('12. Create Response');
  
  if (!formId || !questionId) {
    log('❌ No form ID or question ID available for creating response', 'error');
    return false;
  }

  const query = `
    mutation CreateResponse($formId: ID!, $input: ResponseCreateInput!) {
      createResponse(formId: $formId, input: $input) {
        ... on Response {
          id
          respondentName
          respondentEmail
          createdAt
          answerCount
          answers {
            id
            answer
            question {
              text
            }
          }
        }
        ... on Error {
          code
          message
          details {
            field
            message
          }
        }
      }
    }
  `;

  const variables = {
    formId,
    input: {
      answers: [
        {
          questionId,
          answer: 'Blue'
        }
      ],
      respondentName: 'Test Respondent',
      respondentEmail: `respondent.${Date.now()}@example.com`
    }
  };

  const result = await makeGraphQLRequest(query, variables);
  if (result.success && result.data.createResponse.id) {
    responseId = result.data.createResponse.id;
    log(`✅ Response created: ${JSON.stringify(result.data.createResponse, null, 2)}`, 'success');
    return true;
  } else {
    log('❌ Response creation failed', 'error');
    return false;
  }
}

async function testGetResponses() {
  logTest('13. Get Responses');
  
  if (!formId) {
    log('❌ No form ID available for getting responses', 'error');
    return false;
  }

  const query = `
    query GetResponses($formId: ID!, $sort: ResponseSort) {
      responses(formId: $formId, sort: $sort) {
        ... on ResponsesList {
          responses {
            id
            respondentName
            respondentEmail
            createdAt
            answerCount
            answers {
              id
              answer
              question {
                text
                type
              }
            }
          }
          count
        }
        ... on Error {
          code
          message
        }
      }
    }
  `;

  const variables = {
    formId,
    sort: {
      field: "CREATED_AT",
      order: "DESC"
    }
  };

  const result = await makeGraphQLRequest(query, variables, true);
  if (result.success) {
    log(`✅ Responses retrieved: ${JSON.stringify(result.data.responses, null, 2)}`, 'success');
    return true;
  } else {
    log('❌ Get responses failed', 'error');
    return false;
  }
}

async function testGetResponse() {
  logTest('14. Get Specific Response');
  
  if (!formId || !responseId) {
    log('❌ No form ID or response ID available for testing', 'error');
    return false;
  }

  const query = `
    query GetResponse($formId: ID!, $id: ID!) {
      response(formId: $formId, id: $id) {
        ... on Response {
          id
          respondentName
          respondentEmail
          createdAt
          answerCount
          form {
            title
          }
          answers {
            id
            answer
            question {
              text
              type
              options
            }
          }
        }
        ... on Error {
          code
          message
        }
      }
    }
  `;

  const result = await makeGraphQLRequest(query, { formId, id: responseId }, true);
  if (result.success) {
    log(`✅ Response retrieved: ${JSON.stringify(result.data.response, null, 2)}`, 'success');
    return true;
  } else {
    log('❌ Get response failed', 'error');
    return false;
  }
}

async function testUpdateForm() {
  logTest('15. Update Form');
  
  if (!formId) {
    log('❌ No form ID available for updating', 'error');
    return false;
  }

  const query = `
    mutation UpdateForm($id: ID!, $input: FormUpdateInput!) {
      updateForm(id: $id, input: $input) {
        ... on Form {
          id
          title
          description
          updatedAt
        }
        ... on Error {
          code
          message
        }
      }
    }
  `;

  const variables = {
    id: formId,
    input: {
      title: 'Updated Test Form',
      description: 'This form was updated by the test script'
    }
  };

  const result = await makeGraphQLRequest(query, variables, true);
  if (result.success) {
    log(`✅ Form updated: ${JSON.stringify(result.data.updateForm, null, 2)}`, 'success');
    return true;
  } else {
    log('❌ Form update failed', 'error');
    return false;
  }
}

async function testUpdateQuestion() {
  logTest('16. Update Question');
  
  if (!formId || !questionId) {
    log('❌ No form ID or question ID available for updating', 'error');
    return false;
  }

  const query = `
    mutation UpdateQuestion($formId: ID!, $id: ID!, $input: QuestionUpdateInput!) {
      updateQuestion(formId: $formId, id: $id, input: $input) {
        ... on Question {
          id
          text
          type
          required
          options
          updatedAt
        }
        ... on Error {
          code
          message
        }
      }
    }
  `;

  const variables = {
    formId,
    id: questionId,
    input: {
      text: 'What is your favorite updated color?',
      options: ['Red', 'Blue', 'Green', 'Yellow', 'Purple']
    }
  };

  const result = await makeGraphQLRequest(query, variables, true);
  if (result.success) {
    log(`✅ Question updated: ${JSON.stringify(result.data.updateQuestion, null, 2)}`, 'success');
    return true;
  } else {
    log('❌ Question update failed', 'error');
    return false;
  }
}

async function testUpdateResponse() {
  logTest('17. Update Response');
  
  if (!formId || !responseId || !questionId) {
    log('❌ No form ID, response ID, or question ID available for updating', 'error');
    return false;
  }

  const query = `
    mutation UpdateResponse($formId: ID!, $id: ID!, $input: ResponseUpdateInput!) {
      updateResponse(formId: $formId, id: $id, input: $input) {
        ... on Response {
          id
          respondentName
          respondentEmail
          updatedAt
          answers {
            id
            answer
            question {
              text
            }
          }
        }
        ... on Error {
          code
          message
        }
      }
    }
  `;

  const variables = {
    formId,
    id: responseId,
    input: {
      answers: [
        {
          questionId,
          answer: 'Purple'
        }
      ],
      respondentName: 'Updated Test Respondent'
    }
  };

  const result = await makeGraphQLRequest(query, variables, true);
  if (result.success) {
    log(`✅ Response updated: ${JSON.stringify(result.data.updateResponse, null, 2)}`, 'success');
    return true;
  } else {
    log('❌ Response update failed', 'error');
    return false;
  }
}

async function testGetUser() {
  logTest('18. Get Specific User');
  
  if (!userId) {
    log('❌ No user ID available for testing', 'error');
    return false;
  }

  const query = `
    query GetUser($id: ID!) {
      user(id: $id) {
        ... on User {
          id
          email
          name
          createdAt
          updatedAt
          forms {
            id
            title
          }
        }
        ... on Error {
          code
          message
        }
      }
    }
  `;

  const result = await makeGraphQLRequest(query, { id: userId }, true);
  if (result.success) {
    log(`✅ User retrieved: ${JSON.stringify(result.data.user, null, 2)}`, 'success');
    return true;
  } else {
    log('❌ Get user failed', 'error');
    return false;
  }
}

async function testUpdateUser() {
  logTest('19. Update User');
  
  if (!userId) {
    log('❌ No user ID available for updating', 'error');
    return false;
  }

  const query = `
    mutation UpdateUser($id: ID!, $input: UserUpdateInput!) {
      updateUser(id: $id, input: $input) {
        ... on User {
          id
          name
          email
          updatedAt
        }
        ... on Error {
          code
          message
        }
      }
    }
  `;

  const variables = {
    id: userId,
    input: {
      name: 'Updated Test User'
    }
  };

  const result = await makeGraphQLRequest(query, variables, true);
  if (result.success) {
    log(`✅ User updated: ${JSON.stringify(result.data.updateUser, null, 2)}`, 'success');
    return true;
  } else {
    log('❌ User update failed', 'error');
    return false;
  }
}

async function testReorderQuestions() {
  logTest('20. Reorder Questions');
  
  if (!formId) {
    log('❌ No form ID available for reordering questions', 'error');
    return false;
  }

  // First, create a second question to have something to reorder
  const createQuery = `
    mutation CreateQuestion($formId: ID!, $input: QuestionCreateInput!) {
      createQuestion(formId: $formId, input: $input) {
        ... on Question {
          id
          text
          order
        }
        ... on Error {
          code
          message
        }
      }
    }
  `;

  const createResult = await makeGraphQLRequest(createQuery, {
    formId,
    input: {
      text: 'Second question for reordering test',
      type: 'shorttext',
      required: false,
      order: 2
    }
  }, true);

  if (!createResult.success || !createResult.data.createQuestion.id) {
    log('❌ Failed to create second question for reordering test', 'error');
    return false;
  }

  const secondQuestionId = createResult.data.createQuestion.id;

  // Now test reordering
  const reorderQuery = `
    mutation ReorderQuestions($formId: ID!, $questionIds: [ID!]!) {
      reorderQuestions(formId: $formId, questionIds: $questionIds) {
        ... on Form {
          id
          questions {
            id
            text
            order
          }
        }
        ... on Error {
          code
          message
        }
      }
    }
  `;

  const variables = {
    formId,
    questionIds: [secondQuestionId, questionId] // Reverse the order
  };

  const result = await makeGraphQLRequest(reorderQuery, variables, true);
  if (result.success) {
    log(`✅ Questions reordered: ${JSON.stringify(result.data.reorderQuestions, null, 2)}`, 'success');
    return true;
  } else {
    log('❌ Question reordering failed', 'error');
    return false;
  }
}

async function testDeleteResponse() {
  logTest('21. Delete Response');
  
  if (!formId || !responseId) {
    log('❌ No form ID or response ID available for deletion', 'error');
    return false;
  }

  const query = `
    mutation DeleteResponse($formId: ID!, $id: ID!) {
      deleteResponse(formId: $formId, id: $id) {
        ... on SuccessResult {
          success
          message
        }
        ... on Error {
          code
          message
        }
      }
    }
  `;

  const result = await makeGraphQLRequest(query, { formId, id: responseId }, true);
  if (result.success) {
    log(`✅ Response deleted: ${JSON.stringify(result.data.deleteResponse, null, 2)}`, 'success');
    responseId = null; // Clear the ID since it's deleted
    return true;
  } else {
    log('❌ Response deletion failed', 'error');
    return false;
  }
}

async function testDeleteQuestion() {
  logTest('22. Delete Question');
  
  if (!formId || !questionId) {
    log('❌ No form ID or question ID available for deletion', 'error');
    return false;
  }

  const query = `
    mutation DeleteQuestion($formId: ID!, $id: ID!) {
      deleteQuestion(formId: $formId, id: $id) {
        ... on SuccessResult {
          success
          message
        }
        ... on Error {
          code
          message
        }
      }
    }
  `;

  const result = await makeGraphQLRequest(query, { formId, id: questionId }, true);
  if (result.success) {
    log(`✅ Question deleted: ${JSON.stringify(result.data.deleteQuestion, null, 2)}`, 'success');
    questionId = null; // Clear the ID since it's deleted
    return true;
  } else {
    log('❌ Question deletion failed', 'error');
    return false;
  }
}

async function testDeleteForm() {
  logTest('23. Delete Form');
  
  if (!formId) {
    log('❌ No form ID available for deletion', 'error');
    return false;
  }

  const query = `
    mutation DeleteForm($id: ID!) {
      deleteForm(id: $id) {
        ... on SuccessResult {
          success
          message
        }
        ... on Error {
          code
          message
        }
      }
    }
  `;

  const result = await makeGraphQLRequest(query, { id: formId }, true);
  if (result.success) {
    log(`✅ Form deleted: ${JSON.stringify(result.data.deleteForm, null, 2)}`, 'success');
    formId = null; // Clear the ID since it's deleted
    return true;
  } else {
    log('❌ Form deletion failed', 'error');
    return false;
  }
}

async function testLogout() {
  logTest('25. Logout');
  
  // If user was already deleted, logout is not needed
  if (!authToken) {
    log('ℹ️ No authentication token - user already logged out', 'info');
    return true;
  }
  
  const query = `
    mutation Logout {
      logout {
        ... on SuccessResult {
          success
          message
        }
        ... on Error {
          code
          message
        }
      }
    }
  `;

  const result = await makeGraphQLRequest(query, {}, true);
  if (result.success) {
    log(`✅ Logout successful: ${JSON.stringify(result.data.logout, null, 2)}`, 'success');
    authToken = null;
    return true;
  } else {
    log('❌ Logout failed', 'error');
    return false;
  }
}

async function testDeleteUser() {
  logTest('24. Delete User');
  
  if (!userId) {
    log('❌ No user ID available for deletion', 'error');
    return false;
  }

  const query = `
    mutation DeleteUser($id: ID!) {
      deleteUser(id: $id) {
        ... on SuccessResult {
          success
          message
        }
        ... on Error {
          code
          message
        }
      }
    }
  `;

  const result = await makeGraphQLRequest(query, { id: userId }, true);
  if (result.success) {
    log(`✅ User deleted and logged out: ${JSON.stringify(result.data.deleteUser, null, 2)}`, 'success');
    userId = null; // Clear the ID since it's deleted
    authToken = null; // Clear auth token since user is deleted
    return true;
  } else {
    log('❌ User deletion failed', 'error');
    return false;
  }
}

// Main test runner
async function runAllTests() {
  console.log('\n🚀 Starting Forms Clone GraphQL API Comprehensive Test');
  console.log('====================================================');
  
  const tests = [
    testHealth,
    testRegister,
    testLogin,
    testGetUsers,
    testGetMe,
    testCreateForm,
    testGetForms,
    testGetForm,
    testCreateQuestion,
    testGetQuestions,
    testGetQuestion,
    testCreateResponse,
    testGetResponses,
    testGetResponse,
    testUpdateForm,
    testUpdateQuestion,
    testUpdateResponse,
    testGetUser,
    testUpdateUser,
    testReorderQuestions,
    testDeleteResponse,
    testDeleteQuestion,
    testDeleteForm,
    testDeleteUser,
    testLogout,
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      const success = await test();
      if (success === true) {
        passed++;
      } else {
        failed++;
        // If test returned false, it means it failed but didn't throw an exception
        if (success === false) {
          log(`❌ Test ${test.name} failed (returned false)`, 'error');
        }
      }
    } catch (error) {
      log(`❌ Test ${test.name} failed with exception: ${error.message}`, 'error');
      failed++;
    }
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  log('TEST SUMMARY', 'info');
  console.log('='.repeat(60));
  log(`✅ Passed: ${passed}`, 'success');
  log(`❌ Failed: ${failed}`, 'error');
  log(`Total: ${passed + failed}`, 'info');
  
  if (failed === 0) {
    log('\n All tests passed! Your GraphQL API is working correctly.', 'success');
  } else {
    log(`\n  ${failed} test(s) failed. Please check the errors above.`, 'warning');
  }
}

// Check if server is available before running tests
async function checkServerAvailability() {
  try {
    const response = await fetch(BASE_URL, {
      method: 'POST',
      headers: HEADERS,
      body: JSON.stringify({ query: '{ __typename }' }),
    });
    
    if (response.ok) {
      log('✅ Server is available', 'success');
      return true;
    } else {
      log('❌ Server responded with error', 'error');
      return false;
    }
  } catch (error) {
    log(`❌ Cannot connect to server at ${BASE_URL}`, 'error');
    log('Make sure your GraphQL server is running (npm run dev)', 'warning');
    return false;
  }
}

// Run the tests
async function main() {
  const serverAvailable = await checkServerAvailability();
  if (!serverAvailable) {
    process.exit(1);
  }

  await runAllTests();
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  log(`❌ Unhandled Rejection at: ${promise}, reason: ${reason}`, 'error');
  process.exit(1);
});

// Run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    log(`❌ Fatal error: ${error.message}`, 'error');
    process.exit(1);
  });
}
