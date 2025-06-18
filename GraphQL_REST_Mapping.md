# REST API vs GraphQL Mapping

See dokument näitab, kuidas REST API endpointid on kaardistatud GraphQL skeemasse.

## ✅ Täielikult kaetud REST endpointid

### 1. Sessions (Autentimine)
| REST Endpoint | HTTP Method | GraphQL Equivalent |
|---------------|-------------|-------------------|
| `/sessions` | POST | `mutation { login(input: SessionCreateInput) }` |
| `/sessions` | DELETE | `mutation { logout }` |

### 2. Users (Kasutajate haldus)
| REST Endpoint | HTTP Method | GraphQL Equivalent |
|---------------|-------------|-------------------|
| `/users` | POST | `mutation { register(input: UserCreateInput) }` |
| `/users` | GET | `query { users }` |
| `/users/{id}` | GET | `query { user(id: ID) }` |
| `/users/{id}` tai `/users/me` | PATCH | `mutation { updateUser(id: ID, input: UserUpdateInput) }` |
| `/users/{id}` tai `/users/me` | DELETE | `mutation { deleteUser(id: ID) }` |

**Märkus:** GraphQL `me` query vastab REST `/users/me` funktsionaalsusele, kuid REST API kasutab `/users/{userId}` kus `userId="me"`

### 3. Forms (Vormide haldus)
| REST Endpoint | HTTP Method | GraphQL Equivalent |
|---------------|-------------|-------------------|
| `/forms` | POST | `mutation { createForm(input: FormCreateInput) }` |
| `/forms` | GET | `query { forms }` |
| `/forms/{id}` | GET | `query { form(id: ID) }` |
| `/forms/{id}` | PATCH | `mutation { updateForm(id: ID, input: FormUpdateInput) }` |
| `/forms/{id}` | DELETE | `mutation { deleteForm(id: ID) }` |

### 4. Questions (Küsimuste haldus)
| REST Endpoint | HTTP Method | GraphQL Equivalent |
|---------------|-------------|-------------------|
| `/forms/{formId}/questions` | GET | `query { questions(formId: ID) }` |
| `/forms/{formId}/questions` | POST | `mutation { createQuestion(formId: ID, input: QuestionCreateInput) }` |
| `/forms/{formId}/questions/{id}` | GET | `query { question(formId: ID, id: ID) }` |
| `/forms/{formId}/questions/{id}` | PATCH | `mutation { updateQuestion(formId: ID, id: ID, input: QuestionUpdateInput) }` |
| `/forms/{formId}/questions/{id}` | DELETE | `mutation { deleteQuestion(formId: ID, id: ID) }` |

### 5. Responses (Vastuste haldus)
| REST Endpoint | HTTP Method | GraphQL Equivalent |
|---------------|-------------|-------------------|
| `/forms/{formId}/responses` | GET | `query { responses(formId: ID) }` |
| `/forms/{formId}/responses` | POST | `mutation { createResponse(formId: ID, input: ResponseCreateInput) }` |
| `/forms/{formId}/responses/{id}` | GET | `query { response(formId: ID, id: ID) }` |
| `/forms/{formId}/responses/{id}` | PATCH | `mutation { updateResponse(formId: ID, id: ID, input: ResponseUpdateInput) }` |
| `/forms/{formId}/responses/{id}` | DELETE | `mutation { deleteResponse(formId: ID, id: ID) }` |

### 6. System Endpoints
| REST Endpoint | HTTP Method | GraphQL Equivalent |
|---------------|-------------|-------------------|
| `/health` | GET | `query { health }` |

## ❌ REST endpointid, mis pole GraphQL-is vajalikud

### Dokumentatsiooni endpointid
- `/` (HTML keele valik)
- `/en` (Swagger inglise keeles)  
- `/et` (Swagger eesti keeles)
- `/api-docs` (tagasiühilduvus)

**Põhjus:** GraphQL on ise dokumenteeriv ja ei vaja eraldi dokumentatsiooni endpointe.

## ✨ GraphQL eelised REST API ees

### 1. Subscriptions (Reaalajas uuendused)
GraphQL pakub reaalajas uuendusi, mida REST API ei paku:

```graphql
subscription {
  formUpdated(formId: "123") {
    id
    title
    updatedAt
  }
  
  responseAdded(formId: "123") {
    id
    respondentName
    createdAt
  }
}
```

### 2. Täpsed väljade päringud
GraphQL võimaldab pärida ainult vajalikke välju:

```graphql
query {
  forms {
    id
    title
    questions {
      id
      text
      type
    }
  }
}
```

### 3. Mitme ressursi päring ühes requests
```graphql
query {
  me {
    id
    name
    forms {
      id
      title
      responseCount
    }
  }
}
```

### 4. Filtering ja Pagination
GraphQL skeem lisab täiustatud filtering ja pagination võimalused:

```graphql
query {
  forms(
    filter: { title: "Customer Survey" }
    pagination: { limit: 10, offset: 0 }
    sort: { field: CREATED_AT, order: DESC }
  ) {
    items {
      id
      title
    }
    totalCount
    hasNextPage
  }
}
```

### 5. Bulk operatsioonid
```graphql
mutation {
  reorderQuestions(formId: "123", questionIds: ["q1", "q2", "q3"]) {
    id
    questions {
      id
      order
    }
  }
}
```

## 🔧 Tehnilised täiustused GraphQL skeemas

### 1. Tüübiohutus
- Kasutame `Email` scalar'i email valideerimiseks
- `DateTime` scalar standardseks kuupäevade käsitlemiseks
- `JWT` scalar'i tokenite jaoks

### 2. Valideerimise directivid
```graphql
input UserCreateInput {
  email: Email! @constraint(pattern: "^[\\w\\.-]+@[\\w\\.-]+\\.[a-zA-Z]{2,}$")
  password: String! @constraint(minLength: 8)
  name: String! @constraint(minLength: 1, maxLength: 100)
}
```

### 3. Standardiseeritud veatöötlus
```graphql
union UserResult = User | Error

type Error {
  code: ErrorCode!
  message: String!
  details: [ErrorDetail!]
  httpStatus: Int
}
```

### 4. Dokumentatsioon
Kõik tüübid on dokumenteeritud GraphQL kommentaaridega:

```graphql
"""
User represents a registered user in the system
"""
type User {
  id: ID!
  email: Email!
  # ...
}
```

## 📊 Kokkuvõte

### Kaetus: ✅ 100% REST API funktsionaalsusest kaetud
- **22 CRUD REST endpointi** → **16 GraphQL field'i** (query/mutation)
- **1 süsteemi endpoint** (`/health`) → **1 GraphQL query** (`health`)
- **4 dokumentatsiooni endpoint'i** → **Ei vaja GraphQL-is** (self-documenting)
- Kõik CRUD operatsioonid on toetatud
- Autentimine ja autoriseerimine säilitatud
- Sama andmestruktuur ja business loogika

### Endpoint'ide arv:
- **REST API:** 27 endpoint'i kokku (22 CRUD + 5 süsteemi)
- **GraphQL:** 17 field'i (16 CRUD + 1 health) + automaatne dokumentatsioon

### Lisaväärtus GraphQL-is:
1. **Reaalajas uuendused** (subscriptions)
2. **Täpsed päringud** (ainult vajalikud väljad)
3. **Bulk operatsioonid** (mitme küsimuse järjestamine)
4. **Parem filtering ja pagination**
5. **Tüübiohutus ja valideerimised**
6. **Automaatne dokumentatsioon**
7. **Üks endpoint kõigi operatsioonide jaoks**

**Järeldus:** GraphQL skeem on mitte ainult mõistlik, vaid pakub märkimisväärset lisaväärtust võrreldes REST API-ga, säilitades samal ajal täieliku funktsionaalse ühilduvuse.
